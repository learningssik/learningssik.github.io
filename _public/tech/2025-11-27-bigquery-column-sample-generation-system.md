---
layout: post
title: "BigQuery 데이터로 컬럼 샘플 자동 생성하기"
date: 2025-11-27 15:00:00 +0900
categories: tech
tags: [BigQuery, Azure AI Search, 데이터 카탈로그, 자동화, Airflow, 개인정보보호]
excerpt: "수천 개 컬럼의 샘플 데이터를 자동으로 조회하고 개인정보를 필터링하는 시스템 구축 경험을 공유합니다."
---

## 문제 상황

데이터 분석가들이 테이블을 이해하려면 실제 데이터 예시가 필요합니다. "가입일자" 컬럼이 있다고 해서 그 형식이 "2024-01-15"인지 "20240115"인지 "2024/01/15"인지 알 수 없기 때문입니다.

하지만 우리 시스템에는 수천 개의 컬럼이 있고, 매주 새로운 컬럼이 추가됩니다. 이걸 수동으로 관리하는 건 불가능합니다. 게다가 개인정보가 포함된 컬럼은 절대 노출되면 안 됩니다.

## 해결 방안: 지능형 샘플 데이터 자동 생성

세 가지 핵심 요구사항을 만족하는 시스템을 만들기로 했습니다:

1. **자동화**: 매일 밤 자동으로 실행
2. **지능화**: 컬럼 타입에 맞는 최적의 샘플 조회
3. **보안**: 개인정보 자동 필터링

## 컬럼 타입 자동 분류

첫 번째 도전 과제는 컬럼을 어떻게 분류할 것인가였습니다. 단순히 데이터 타입(STRING, INT64 등)만으로는 부족합니다. "고객번호"와 "나이"는 둘 다 숫자지만 전혀 다른 방식으로 조회해야 합니다.

LLM을 활용해서 컬럼 논리명, 설명, 데이터 타입을 종합적으로 판단하도록 했습니다:

```python
def handle_column_category(row, idx, total):
   response = client.chat.completions.create(
      model="gpt4o", 
      messages=[
         {"role": "system", "content": """
         너는 최고의 컬럼 판별자야. column logical name, column description, 
         column type을 모두 고려하여 컬럼의 타입을 분류해야 해.
         
         카테고리:
         - 날짜: month, day 관련
         - 시간: hour 관련
         - 금액: 돈, 금액 관련
         - 여부: Y/N 2지선다
         - 나이: 연령, AGE 관련
         - 번호: 가입번호, 고객번호, ID 등
         - 코드: CD로 끝나는 코드
         - 코드명: 코드에 대한 이름
         - 기타: 그 외
         """},
         {"role": "user", "content": f"""
         column logical name: {row.ATTR_LOGI_NM}, 
         column description: {row.ATTR_DESCR}, 
         column type: {row.ATTR_DATA_TYP}
         """}
      ]
   )
   return response.choices[0].message.content
```

## 카테고리별 맞춤 조회 전략

각 카테고리에 최적화된 쿼리를 만들었습니다. 핵심은 "빈도 높은 값 + 랜덤 샘플"을 조합하는 것입니다.

### 1. 번호 컬럼: 마스킹 체크 필수

```python
def query_number(row):
    query = f"""
    SELECT number_sample FROM (
        -- 빈도 높은 15개
        SELECT {row['ATTR_PHYS_NM']} as number_sample, COUNT(*) AS count
        FROM `{row['PJT_NM']}.{row['DATA_SET_NM']}.{row['TBL_PHYS_NM']}`
        WHERE {row['LOADING_CYCLE_BQ_CONDITION']} 
          AND {row['ATTR_PHYS_NM']} IS NOT NULL
        GROUP BY number_sample
        ORDER BY count DESC
        LIMIT 15
    ) UNION ALL (
        -- 랜덤 5개
        SELECT {row['ATTR_PHYS_NM']} as number_sample
        FROM `{row['PJT_NM']}.{row['DATA_SET_NM']}.{row['TBL_PHYS_NM']}`
        WHERE {row['LOADING_CYCLE_BQ_CONDITION']} 
          AND {row['ATTR_PHYS_NM']} IS NOT NULL
        ORDER BY RAND()
        LIMIT 5
    )
    GROUP BY number_sample
    """
    
    result = query_bigquery(query)
    
    # 개인정보 마스킹 체크
    if mask_sensitive_data(result.iloc[0]["number_sample"]):
        print(f"{row['ATTR_PHYS_NM']} is sensitive_data!")
        return None
    
    return format_result(result)
```

### 2. 코드-코드명 쌍: 자동 매칭

코드와 코드명이 같은 테이블에 있으면 자동으로 매칭해서 보여줍니다:

```python
def query_code_name(row, col_df):
    pair_yn = False
    
    # 컬럼명이 _NM으로 끝나면 _CD 찾기
    if row['ATTR_PHYS_NM'].endswith('_NM'):
        target_attr = row['ATTR_PHYS_NM'].rsplit('_', 1)[0] + '_CD'
        if ((col_df['ATTR_PHYS_NM'] == target_attr) & 
            (col_df['TBL_PHYS_NM'] == row['TBL_PHYS_NM'])).any():
            pair_yn = True
    
    if pair_yn:
        # 코드와 코드명을 함께 조회
        query = f"""
        SELECT CONCAT({target_attr}, ' | ', {row['ATTR_PHYS_NM']}) 
               AS code_and_name_pair_sample
        FROM `{row['PJT_NM']}.{row['DATA_SET_NM']}.{row['TBL_PHYS_NM']}`
        WHERE {row['LOADING_CYCLE_BQ_CONDITION']}
        """
        # 결과: "01 | 정상", "02 | 해지", "03 | 일시정지"
```

이렇게 하면 사용자가 코드의 의미를 바로 이해할 수 있습니다.

### 3. 일반 컬럼: 숫자 정규화

숫자 컬럼은 반올림 처리를 해서 가독성을 높입니다:

```python
def round_numeric_values(df):
    for col in df.columns:
        # 날짜 컬럼은 제외
        if any(keyword in col.upper() 
               for keyword in ['DATE', 'DT', 'YYMM', '_CD']):
            continue
        
        # 숫자로 변환 가능한 값만 처리
        numeric_series = pd.to_numeric(df[col], errors='coerce')
        df[col] = numeric_series.combine_first(df[col])
    
    return df
```

결과:
- `3.0` → `3`
- `3.14159265` → `3.14`
- `0.0000001` → `0`

## 개인정보 보호: 다층 방어

개인정보 노출을 막기 위해 여러 단계의 필터링을 적용했습니다.

### 1. 사전 필터링: 알려진 개인정보 컬럼

```python
pii_columns = [
    'ENCN_ID', 'CUST_NO', 'BILL_ACNT_NO', 'HDPHN_NO',
    'ENTR_NO', 'DEVC_NO', 'IMSI_NO', 'HPNO',
    # ... 총 40여 개
]

# 개인정보 컬럼은 조회 대상에서 제외
df.loc[df['ATTR_PHYS_NM'].isin(pii_columns), 'NEEDS_ATTR_VAL_EX'] = 'N'
```

### 2. 패턴 매칭: 40자리 해시값 감지

암호화된 개인정보는 보통 40자리 16진수로 저장됩니다:

```python
def mask_sensitive_data(cell):
    pattern = re.compile('^[A-F0-9]{40}$')
    if isinstance(cell, str) and pattern.match(cell):
        return True
    return False
```

### 3. 키워드 필터링: 메모/내용 컬럼

```python
# CNTN, MEMO, TXN이 포함된 컬럼 제외
df.loc[df['ATTR_PHYS_NM'].str.contains('CNTN|MEMO|TXN', na=False), 
       'NEEDS_ATTR_VAL_EX'] = 'N'
```

## Airflow로 자동화

매일 새벽 2시에 자동 실행되도록 설정했습니다:

```python
dag = DAG(
    dag_id='dag_auto_make_attr_val_ex',
    default_args={
        'owner': 'aqua',
        'start_date': datetime(2025, 6, 1, tzinfo=kst),
        'retries': 4,
        'retry_delay': timedelta(minutes=15),
    },
    description='Automation of making attr_val_ex',
    schedule_interval='0 2 * * *',  # 매일 새벽 2시
    tags=['indexing'],
    catchup=False,
)
```

전체 프로세스입니다:

```python
def run_etl():
    for col_index_name in col_index_list:
        # 1. 인덱스에서 컬럼 목록 로드
        col_df = load_from_azure(col_search_client)
        
        # 2. 업데이트 대상 선별 (7일 이상 경과 or 비어있음)
        col_df = col_df[col_df["NEEDS_ATTR_VAL_EX"] == "Y"]
        
        # 3. 컬럼 카테고리 분류
        col_df['ATTR_CATE'] = col_df.apply(
            lambda row: handle_column_category(row, idx, total), 
            axis=1
        )
        
        # 4. 카테고리별 샘플 조회
        col_df['ATTR_VAL_EX'] = col_df.apply(
            lambda row: route_column(row, idx, total, col_df), 
            axis=1
        )
        
        # 5. 인덱스 업데이트
        update_index(col_search_client, col_df, 
                    ['id', 'ATTR_VAL_EX', 'UPDATE_DATE'])
        
        # 6. dev -> prod 복사
        copy_paste_index(col_index_name, target_index_name)
```

## 실제 결과

### 일반 컬럼
```
컬럼: 가입자수
Before: (없음)
After: col_sample: 1, 2, 3, 5, 10, 15, 20, 25, 30, 50, 100
```

### 코드-코드명 쌍
```
컬럼: 상태코드명
Before: (없음)
After: code_and_name_pair_sample(STATUS_CD | STATUS_NM): 
       01 | 정상, 02 | 해지, 03 | 일시정지, 04 | 휴면, 05 | 해지예정
```

### 장치명 (실제 데이터)
```
컬럼: 장치펫명
Before: (없음)
After: col_sample: 갤럭시버디3, iPhone16Pro, 갤럭시버디4, 
       갤럭시S24, iPhone15, 갤럭시A54, iPhone14ProMax
```

## 성능 및 효과

### 처리 성능
- **컬럼당 평균**: 2-3초
- **인덱스당 평균**: 10-30분
- **전체 처리 시간**: 약 3-4시간 (18개 도메인)

### 커버리지
- **전체 컬럼**: 약 5,000개
- **처리 대상**: 약 4,000개 (80%)
- **제외 대상**: 약 1,000개 (개인정보 등)

### 사용자 피드백
- "이제 컬럼 형식을 바로 알 수 있어서 좋습니다"
- "코드와 코드명이 함께 나와서 이해하기 쉽습니다"
- "샘플 데이터가 항상 최신이라 신뢰할 수 있습니다"

## 배운 점

### 1. 컬럼 타입 분류가 핵심입니다

처음에는 모든 컬럼을 똑같이 조회했는데, 카테고리별로 다르게 처리하니 품질이 크게 향상되었습니다. 특히 코드-코드명 쌍 매칭은 사용자 만족도가 높았습니다.

### 2. 개인정보 보호는 다층 방어

하나의 필터만으로는 부족합니다. 사전 필터링, 패턴 매칭, 키워드 필터링을 모두 적용해야 안전합니다.

### 3. 빈도 + 랜덤 조합이 효과적입니다

빈도 높은 값만 보여주면 편향되고, 랜덤만 보여주면 대표성이 떨어집니다. 둘을 조합하니 균형 잡힌 샘플을 얻을 수 있었습니다.

### 4. 숫자 정규화는 필수입니다

`3.14159265`보다 `3.14`가 훨씬 읽기 좋습니다. 작은 디테일이지만 사용자 경험에 큰 영향을 미칩니다.

## 개선 계획

현재 시스템도 잘 작동하지만, 더 개선할 부분이 있습니다:

### 1. 코드-코드명 자동 매칭 확장
현재는 같은 테이블 내에서만 매칭하지만, 기준정보 테이블과 JOIN해서 매칭하면 더 많은 코드를 설명할 수 있습니다.

### 2. 통계 정보 추가
MIN, MAX, AVG 같은 통계 정보도 함께 제공하면 데이터 분포를 이해하는 데 도움이 될 것입니다.

### 3. 데이터 품질 검증
생성된 샘플이 실제로 유용한지 자동으로 검증하는 시스템이 필요합니다.

### 4. 이상치 탐지
샘플 데이터에 이상한 값이 있으면 알려주는 기능을 추가하고 싶습니다.

## 마무리

데이터 카탈로그는 단순히 메타데이터를 저장하는 것이 아니라, 사용자가 데이터를 이해하고 활용할 수 있도록 돕는 것이 목적입니다. 실제 샘플 데이터를 자동으로 제공하니 데이터 분석가들의 생산성이 크게 향상되었습니다.

특히 개인정보 보호와 자동화를 동시에 달성한 것이 가장 큰 성과입니다. 보안을 지키면서도 편의성을 높일 수 있다는 것을 증명했습니다.
