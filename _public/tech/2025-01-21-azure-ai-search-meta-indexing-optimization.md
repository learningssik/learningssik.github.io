---
layout: post
title: "Azure AI Search 메타데이터 인덱싱 최적화 시스템"
date: 2025-10-28
categories: [개발]
tags: [Azure AI Search, 메타데이터, 인덱싱, AI, 벡터검색, GPT-4, BigQuery]
---

# Azure AI Search 메타데이터 인덱싱 최적화 시스템

## 개요

이 프로젝트는 **Azure AI Search**를 활용한 대규모 데이터베이스 메타데이터 인덱싱 및 검색 최적화 시스템입니다. 기업 내 다양한 도메인(IPTV, 모바일, 고객센터, HR 등)의 테이블과 컬럼 메타데이터를 자동으로 수집, 처리, 인덱싱하여 효율적인 검색 환경을 구축합니다.

### 핵심 특징
- **다중 도메인 지원**: 25개 이상의 비즈니스 도메인 통합 관리
- **AI 기반 메타데이터 생성**: GPT-4를 활용한 컬럼 설명 및 값 예시 자동 생성
- **벡터 검색**: OpenAI Embedding을 통한 의미 기반 검색
- **자동화된 파이프라인**: 데이터 전처리부터 인덱싱까지 완전 자동화

## 문제 해결

### 기존 문제점
1. **메타데이터 분산**: 각 도메인별로 산재된 테이블/컬럼 정보
2. **수동 관리**: 메타데이터 업데이트 및 검색의 비효율성
3. **검색 한계**: 키워드 기반 검색의 정확도 부족
4. **확장성 부족**: 새로운 도메인 추가 시 복잡한 설정 과정

### 해결 효과
- **통합 검색 환경**: 모든 도메인의 메타데이터를 하나의 시스템에서 검색
- **지능형 검색**: 벡터 검색과 시맨틱 검색을 통한 정확한 결과 제공
- **자동화된 관리**: 메타데이터 업데이트 및 인덱싱 프로세스 자동화
- **확장 가능한 아키텍처**: 새로운 도메인 추가 시 최소한의 설정으로 확장

## 구현 방식

### 1. 시스템 아키텍처

```python
# 핵심 구성 요소
- Azure AI Search: 검색 엔진
- OpenAI GPT-4: 메타데이터 생성
- OpenAI Embedding: 벡터화
- Google BigQuery: 데이터 소스
- Google Cloud Storage: 백업 및 히스토리 관리
```

### 2. 데이터 전처리 알고리즘

#### 도메인별 필터링 로직
```python
def fill_domain_with_default(df, column, default_value):
    """도메인 유형에 따른 USE_YN/ALL_USE_YN 필터링"""
    df[column] = df[column].replace('', pd.NA)
    df[column] = df[column].fillna(default_value)
    return df

# 대외비 도메인 vs 전사오픈 도메인 구분
if 'open' not in tbl_index_name:
    # 대외비 도메인 처리
    credential_yn = True
else:
    # 전사오픈 도메인 처리
    credential_yn = False
```

#### 테이블 메타데이터 통합
```python
def make_tbl_df(df):
    """테이블 기준으로 컬럼 논리명/물리명 CONCAT"""
    tbl_df = df.groupby(['PJT_NM','DATA_SET_NM','TBL_LOGI_NM',
                        'TBL_DESCR','TBL_PHYS_NM','CREATE_DATE',
                        'UPDATE_DATE','DOMAIN','SOURCE']).agg({
        'ATTR_LOGI_NM': ', '.join,
        'ATTR_PHYS_NM': ', '.join
    }).reset_index()
    return tbl_df
```

### 3. AI 기반 메타데이터 생성

#### 컬럼 카테고리 분류
```python
def handle_column_category(row):
    """LLM을 통한 컬럼 카테고리 자동 분류"""
    response = client.chat.completions.create(
        model="gpt4o", 
        messages=[
            {"role": "system", "content": """
            컬럼의 타입을 분류해주세요:
            - 날짜: month, day 관련
            - 시간: hour 관련  
            - 금액: 돈, 금액 관련
            - 여부: Y/N 2지선다
            - 나이: 연령, AGE 관련
            - 번호: 가입번호, 고객번호, ID 관련
            - 코드: CD 관련
            - 코드명: 코드에 대한 이름
            - 기타: 그 외
            """},
            {"role": "user", "content": f"""
            column logical name: {row['ATTR_LOGI_NM']}
            column description: {row['ATTR_DESCR']}
            column type: {row['ATTR_DATA_TYP']}
            """}
        ]
    )
    return response.choices[0].message.content
```

#### BigQuery 기반 값 예시 생성
```python
def query_code(row):
    """코드 컬럼의 값 예시 조회"""
    query = f"""
    SELECT code_sample FROM (
        SELECT code_sample, COUNT(*) AS count
        FROM `{row['PJT_NM']}.{row['DATA_SET_NM']}.{row['TBL_PHYS_NM']}`
        {row['LOADING_CYCLE_BQ_CONDITION']} 
        AND {row['ATTR_PHYS_NM']} is not null
        GROUP BY code_sample
        ORDER BY count DESC
        LIMIT 15
    )
    """
    return query_bigquery(query)
```

### 4. 벡터 검색 구성

#### HNSW 알고리즘 설정
```python
tbl_vector_search = VectorSearch(
    algorithms=[
        HnswAlgorithmConfiguration(
            name="my-hnsw",
            kind=VectorSearchAlgorithmKind.HNSW,
            parameters=HnswParameters(
                m=4,                    # 연결 수
                ef_construction=400,    # 인덱스 구축 시 탐색 범위
                ef_search=500,          # 검색 시 탐색 범위
                metric=VectorSearchAlgorithmMetric.COSINE,
            ),
        )
    ],
    profiles=[
        VectorSearchProfile(
            name="my-vector-config",
            algorithm_configuration_name="my-hnsw",
        )
    ],
)
```

#### 시맨틱 검색 설정
```python
tbl_semantic_search = SemanticSearch(
    configurations=[
        SemanticConfiguration(
            name="semantic-config",
            prioritized_fields=SemanticPrioritizedFields(
                title_field=SemanticField(field_name="TBL_LOGI_NM"),
                keywords_fields=[SemanticField(field_name="ATTR_LOGI_NM_SET")],
                content_fields=[SemanticField(field_name="TBL_DESCR")],
            ),
        )
    ]
)
```

### 5. 인덱스 관리 시스템

#### 자동 인덱스 복사
```python
def copy_paste_index(source_index, target_index):
    """개발 → 운영, 대외비 → 전사오픈 인덱스 자동 복사"""
    # 1. 기존 타겟 인덱스 삭제
    index_client.delete_index(target_index)
    
    # 2. 소스 인덱스 스키마 복사
    source_index_schema = index_client.get_index(source_index)
    
    # 3. 신규 인덱스 생성
    new_index = SearchIndex(
        name=target_index,
        fields=source_index_schema.fields,
        vector_search=source_index_schema.vector_search,
        semantic_search=source_index_schema.semantic_search,
    )
    
    # 4. 데이터 복사
    documents = list(source_client.search(search_text="*"))
    target_client.upload_documents(documents)
```

## 리팩토링 제안

### 1. 성능 최적화

#### 배치 처리 개선
```python
# 현재: 개별 문서 업로드
for idx, (_, row) in enumerate(tbl_df.iterrows(), start=1):
    documents.append({...})
    result = tbl_search_client.upload_documents(documents)

# 개선안: 배치 크기 최적화
BATCH_SIZE = 100
for i in range(0, len(tbl_df), BATCH_SIZE):
    batch_df = tbl_df.iloc[i:i+BATCH_SIZE]
    documents = [create_document(row) for _, row in batch_df.iterrows()]
    tbl_search_client.upload_documents(documents)
```

#### 캐싱 시스템 도입
```python
from functools import lru_cache
import redis

# 임베딩 결과 캐싱
@lru_cache(maxsize=1000)
def generate_embeddings_cached(text):
    return generate_embeddings(text)

# Redis를 활용한 메타데이터 캐싱
redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_metadata(table_name):
    cached = redis_client.get(f"meta:{table_name}")
    if cached:
        return json.loads(cached)
    return None
```

### 2. 에러 처리 강화

#### 재시도 메커니즘
```python
import time
from functools import wraps

def retry_on_failure(max_retries=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(delay * (2 ** attempt))
            return None
        return wrapper
    return decorator

@retry_on_failure(max_retries=3, delay=2)
def upload_documents_with_retry(client, documents):
    return client.upload_documents(documents)
```

### 3. 모니터링 및 로깅

#### 구조화된 로깅
```python
import logging
import json
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('meta_indexing.log'),
        logging.StreamHandler()
    ]
)

def log_indexing_progress(current, total, domain, index_type):
    progress = {
        'timestamp': datetime.now().isoformat(),
        'current': current,
        'total': total,
        'domain': domain,
        'index_type': index_type,
        'progress_percentage': (current / total) * 100
    }
    logging.info(json.dumps(progress))
```

### 4. 설정 관리 개선

#### 환경별 설정 분리
```python
# config.yaml
environments:
  dev:
    azure_search:
      endpoint: "https://your-search-service-dev.search.windows.net"
      api_version: "2023-10-01-preview"
    openai:
      model: "gpt-4"
      embedding_model: "embedding-3-large"
  
  prod:
    azure_search:
      endpoint: "https://your-search-service.search.windows.net"
      api_version: "2023-10-01-preview"
    openai:
      model: "gpt-4"
      embedding_model: "embedding-3-large"

# 설정 로더
import yaml

def load_config(environment='dev'):
    with open('config.yaml', 'r') as file:
        config = yaml.safe_load(file)
    return config[environment]
```

## 학습 내용

### 기술적 인사이트

#### 1. 벡터 검색의 중요성
- **키워드 검색의 한계**: 정확한 용어를 모르면 검색이 어려움
- **의미 기반 검색**: "고객 정보"와 "customer data"를 동일하게 인식
- **HNSW 알고리즘**: 대규모 벡터 데이터에서 빠른 근사 최근접 이웃 검색

#### 2. AI와 전통적 데이터베이스의 융합
- **메타데이터 자동 생성**: GPT-4를 활용한 컬럼 설명 및 값 예시 생성
- **카테고리 자동 분류**: LLM을 통한 컬럼 타입 자동 분류
- **품질 검증**: AI 생성 결과의 신뢰성 확보 방법

#### 3. 대규모 시스템 설계 원칙
- **도메인 분리**: 각 비즈니스 도메인별 독립적 관리
- **환경 분리**: 개발/운영 환경의 명확한 구분
- **권한 관리**: 대외비/전사오픈 데이터의 접근 권한 제어

### 비즈니스 가치

#### 1. 데이터 거버넌스 강화
- **메타데이터 표준화**: 일관된 데이터 설명 및 분류
- **데이터 품질 향상**: 자동화된 메타데이터 검증
- **컴플라이언스**: 개인정보 보호를 위한 자동 필터링

#### 2. 개발 생산성 향상
- **검색 시간 단축**: 기존 수 시간 → 수 분으로 단축
- **데이터 발견**: 숨겨진 데이터셋의 자동 발견
- **문서화 자동화**: 수동 문서화 작업의 대폭 감소

#### 3. 확장성과 유지보수성
- **플러그인 아키텍처**: 새로운 도메인 추가 시 최소한의 코드 변경
- **자동화된 배포**: 개발 → 운영 환경 자동 동기화
- **모니터링**: 실시간 인덱싱 상태 및 성능 모니터링

### 향후 발전 방향

#### 1. 고도화된 AI 기능
- **자동 스키마 추론**: 데이터만으로 테이블 구조 자동 분석
- **데이터 품질 평가**: AI 기반 데이터 품질 점수 산출
- **예측적 메타데이터**: 사용 패턴 기반 메타데이터 추천

#### 2. 실시간 처리
- **스트리밍 인덱싱**: 실시간 데이터 변경사항 반영
- **증분 업데이트**: 변경된 부분만 선별적 업데이트
- **이벤트 기반 아키텍처**: 데이터 변경 시 자동 트리거

#### 3. 사용자 경험 개선
- **자연어 쿼리**: "고객 나이별 통계 테이블 찾아줘" 같은 자연어 검색
- **시각적 탐색**: 그래프 기반 데이터 관계 시각화
- **개인화**: 사용자별 맞춤형 검색 결과 제공

이 시스템을 통해 기업의 데이터 자산을 효율적으로 관리하고 활용할 수 있는 기반을 마련했습니다. 특히 AI 기술과 전통적인 데이터베이스 기술의 융합을 통해 혁신적인 메타데이터 관리 솔루션을 구현할 수 있었습니다.
