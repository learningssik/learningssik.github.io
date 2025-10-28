---
layout: post
title: "Azure AI Search Few-Shot Learning 인덱싱 최적화 시스템"
date: 2025-01-21 00:00:00 +0900
categories: tech
tags: [Azure AI Search, Few-Shot Learning, OpenAI GPT-4, SQL 쿼리 생성, 벡터 검색, AI 최적화]
excerpt: "Few-Shot Learning을 활용한 지능형 질의문 처리 및 SQL 쿼리 생성 시스템으로, Azure AI Search와 OpenAI GPT-4를 결합하여 사용자의 자연어 질문을 분석하고 정확한 SQL 쿼리를 자동 생성합니다."
---

# Azure AI Search Few-Shot Learning 인덱싱 최적화 시스템

## 개요

이 프로젝트는 **Few-Shot Learning**을 활용한 지능형 질의문 처리 및 SQL 쿼리 생성 시스템입니다. Azure AI Search와 OpenAI GPT-4를 결합하여 사용자의 자연어 질문을 분석하고, 유사한 예시를 기반으로 정확한 SQL 쿼리를 자동 생성하는 혁신적인 솔루션입니다.

### 핵심 특징
- **Few-Shot Learning**: 기존 질의문-쿼리 쌍을 학습하여 새로운 질문에 대한 답변 생성
- **AI 기반 질의문 정제**: GPT-4를 활용한 검색 최적화 질문 생성
- **벡터 검색**: 의미 기반 유사 질문 검색으로 정확한 예시 매칭
- **자동화된 학습**: 새로운 질의문-쿼리 쌍의 자동 학습 및 인덱싱

## 문제 해결

### 기존 문제점
1. **SQL 작성 복잡성**: 비개발자도 SQL 쿼리를 작성해야 하는 상황
2. **반복적인 질문**: 유사한 질문에 대해 매번 새로운 쿼리 작성
3. **학습 곡선**: SQL 문법 학습의 높은 진입 장벽
4. **일관성 부족**: 동일한 요구사항에 대한 다양한 쿼리 작성 방식

### 해결 효과
- **자동 SQL 생성**: 자연어 질문을 SQL 쿼리로 자동 변환
- **학습 기반 개선**: 사용할수록 정확도가 향상되는 시스템
- **일관된 결과**: 동일한 질문에 대한 표준화된 쿼리 제공
- **접근성 향상**: SQL 지식 없이도 데이터 분석 가능

## 구현 방식

### 1. 시스템 아키텍처

```python
# 핵심 구성 요소
- Azure AI Search: Few-shot 예시 저장 및 검색
- OpenAI GPT-4: 질의문 정제 및 쿼리 생성
- OpenAI Embedding: 벡터 검색을 위한 임베딩 생성
- Google BigQuery: 실제 데이터 소스 및 예시 쿼리 저장
```

### 2. Few-Shot Learning 파이프라인

#### 질의문 정제 알고리즘
```python
def make_search_question(user_question):
    """사용자 질문을 벡터 검색에 최적화된 형태로 정제"""
    response = arg_client.chat.completions.create(
        model="gpt4o",
        messages=[
            {"role": "system", "content": """
            너는 문장 추출 전문가야. 컴팩트하게 핵심이 되는 내용만 뽑아 문장을 다시 작성할 것.
            '벡터 검색어'로 사용될 수 있도록 정제할 것.
            
            제거할 요소들:
            - 날짜와 기간: yyyy-mm부터 yyyy-mm까지, yyyy년 mm월, 2024년
            - 공통 조사: '입니다', '알려줘', '뭐야'
            - 특정 키워드: 콘텐츠명, 기기명, 사이트명
            - 특정 코드: 서비스 코드, 상담 코드, ID
            - 문장 기호: comma, dot, 따옴표
            """},
            {"role": "user", "content": f"uesr_question: {user_question}"}
        ]
    )
    return response.choices[0].message.content.strip()
```

#### 쿼리 작성 가이드 생성
```python
def make_qry_writing_tip(user_question, correct_query):
    """SQL 쿼리 작성 과정을 설명하는 가이드 생성"""
    response = arg_client.chat.completions.create(
        model="gpt4o-mini",
        messages=[
            {"role": "system", "content": """
            너는 SQL 전문가야. 주어진 사용자 질문에 맞는 SQL쿼리를 보고 
            사용자 질의문에서 어떻게 해당 쿼리를 작성했는지 QRY_WRITING_TIP을 말해줘.
            
            분석 포인트:
            1. 시점 지정: 날짜 조건 처리 방법
            2. 필터링 조건: WHERE 절 구성 방식
            3. 집계 함수: COUNT, SUM, AVG 등 사용법
            4. 조인: 테이블 연결 방법
            5. 그룹화: GROUP BY 활용법
            """},
            {"role": "user", "content": f"""
            QUESTION: {user_question}
            CORR_QRY: {correct_query}
            """}
        ]
    )
    return response.choices[0].message.content.strip()
```

### 3. 벡터 검색 구성

#### HNSW 알고리즘 설정
```python
vector_search = VectorSearch(
    algorithms=[
        HnswAlgorithmConfiguration(
            name="my-hnsw",
            kind=VectorSearchAlgorithmKind.HNSW,
            parameters=HnswParameters(
                m=4,                    # 각 노드의 최대 연결 수
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
semantic_search = SemanticSearch(
    configurations=[
        SemanticConfiguration(
            name="semantic-config",
            prioritized_fields=SemanticPrioritizedFields(
                title_field=SemanticField(field_name="USER_QUESTION"),
                keywords_fields=[SemanticField(field_name="SEARCH_QUESTION")],
                content_fields=[SemanticField(field_name="QRY_WRITING_TIP")],
            ),
        )
    ]
)
```

### 4. 인덱스 스키마 설계

```python
fields = [
    SimpleField(name="id", type=SearchFieldDataType.String, key=True),
    SimpleField(name="SOURCE", type=SearchFieldDataType.String, filterable=True),
    SimpleField(name="DOMAIN", type=SearchFieldDataType.String, filterable=True),
    SearchableField(name="USER_QUESTION", type=SearchFieldDataType.String, 
                   searchable=True, retrievable=True, filterable=True),
    SearchableField(name="SEARCH_QUESTION", type=SearchFieldDataType.String, 
                   searchable=True, retrievable=True, filterable=True),
    SearchableField(name="QRY_WRITING_TIP", type=SearchFieldDataType.String, 
                   searchable=True, retrievable=True, filterable=True),
    SearchableField(name="CORR_QRY", type=SearchFieldDataType.String, 
                   searchable=True, retrievable=True, filterable=True),
    SimpleField(name="USE_YN", type=SearchFieldDataType.String, filterable=True),
    SimpleField(name="ALL_USE_YN", type=SearchFieldDataType.String, filterable=True),
    SimpleField(name="IS_QUESTION_ELIGIBLE", type=SearchFieldDataType.String, filterable=True),
    SimpleField(name="CREATE_DATE", type=SearchFieldDataType.String, filterable=True),
    SimpleField(name="UPDATE_DATE", type=SearchFieldDataType.String, filterable=True),
    SearchField(name="QUESTION_VECTOR", 
                type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                searchable=True, vector_search_dimensions=3072, 
                vector_search_profile_name="my-vector-config")
]
```

### 5. 자동 학습 시스템

#### 기존 데이터 활용
```python
def query_bigquery(query):
    """BigQuery에서 기존 Few-shot 예시 조회"""
    bq_client = bigquery.Client()
    query_job = bq_client.query(query)
    dataframe = query_job.to_dataframe()
    return dataframe

# 도메인별 기존 예시 조회
query = f"""
SELECT USER_QUESTION, SEARCH_QUESTION, CORR_QRY, QRY_WRITING_TIP 
FROM `gcp-prod-edp-lake.DLKVWAQ.{domain}-fewshot-index` 
LIMIT 3
"""
df_fewshot = query_bigquery(query)
```

#### 자동 업데이트 로직
```python
def escape_quotes(value):
    """Azure Search 쿼리에서 안전하게 사용하기 위한 이스케이프 처리"""
    if isinstance(value, str):
        return value.replace("'", "''")
    return value

# 기존 데이터와 중복 체크
filter_query = f"USER_QUESTION eq '{user_q}' or SEARCH_QUESTION eq '{search_q}'"
existing_docs = list(search_client.search(filter=filter_query, select=["id"]))

if existing_docs:
    # 기존 데이터 업데이트
    existing_id = existing_docs[0]['id']
    search_client.delete_documents(documents=[{"id": existing_id}])
    print("기존 퓨샷을 업데이트 합니다.")
else:
    # 새로운 데이터 추가
    current_max_id += 1
    documents.append({
        'id': str(current_max_id),
        'USER_QUESTION': row['USER_QUESTION'],
        'SEARCH_QUESTION': row['SEARCH_QUESTION'],
        'QRY_WRITING_TIP': row['QRY_WRITING_TIP'],
        'CORR_QRY': row['CORR_QRY'],
        'QUESTION_VECTOR': generate_embeddings(row['SEARCH_QUESTION']),
    })
```

## 리팩토링 제안

### 1. 성능 최적화

#### 배치 처리 개선
```python
# 현재: 개별 문서 처리
for idx, (_, row) in enumerate(df.iterrows(), start=1):
    documents.append({...})
    result = search_client.upload_documents(documents)

# 개선안: 배치 크기 최적화
BATCH_SIZE = 50
for i in range(0, len(df), BATCH_SIZE):
    batch_df = df.iloc[i:i+BATCH_SIZE]
    documents = [create_document(row) for _, row in batch_df.iterrows()]
    search_client.upload_documents(documents)
```

#### 캐싱 시스템 도입
```python
from functools import lru_cache
import redis

# 임베딩 결과 캐싱
@lru_cache(maxsize=1000)
def generate_embeddings_cached(text):
    return generate_embeddings(text)

# Redis를 활용한 질의문 캐싱
redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_question(search_question):
    cached = redis_client.get(f"question:{hash(search_question)}")
    if cached:
        return json.loads(cached)
    return None
```

### 2. 품질 관리 강화

#### 자동 검증 시스템
```python
def validate_sql_query(query):
    """생성된 SQL 쿼리의 유효성 검증"""
    try:
        # BigQuery에서 쿼리 문법 검증
        bq_client = bigquery.Client()
        job_config = bigquery.QueryJobConfig(dry_run=True)
        query_job = bq_client.query(query, job_config=job_config)
        return True
    except Exception as e:
        print(f"SQL 검증 실패: {e}")
        return False

def validate_question_quality(question):
    """질문의 품질 검증"""
    quality_score = 0
    
    # 길이 검증
    if 10 <= len(question) <= 200:
        quality_score += 1
    
    # 키워드 존재 검증
    sql_keywords = ['select', 'from', 'where', 'group by', 'order by']
    if any(keyword in question.lower() for keyword in sql_keywords):
        quality_score += 1
    
    return quality_score >= 1
```

### 3. 모니터링 및 분석

#### 사용 패턴 분석
```python
import logging
from datetime import datetime

def log_query_usage(user_question, search_question, success_rate):
    """쿼리 사용 패턴 로깅"""
    usage_log = {
        'timestamp': datetime.now().isoformat(),
        'user_question': user_question,
        'search_question': search_question,
        'success_rate': success_rate,
        'domain': domain
    }
    
    logging.info(json.dumps(usage_log))
    
    # 사용 빈도 분석을 위한 카운터
    redis_client.incr(f"usage:{hash(search_question)}")
```

#### 성능 메트릭 수집
```python
def collect_performance_metrics():
    """시스템 성능 메트릭 수집"""
    metrics = {
        'total_queries': get_index_total_count(search_client),
        'avg_response_time': calculate_avg_response_time(),
        'success_rate': calculate_success_rate(),
        'popular_domains': get_popular_domains(),
        'query_complexity_distribution': analyze_query_complexity()
    }
    
    return metrics
```

### 4. 확장성 개선

#### 도메인별 특화 모델
```python
class DomainSpecificModel:
    def __init__(self, domain):
        self.domain = domain
        self.model_config = self.load_domain_config(domain)
    
    def load_domain_config(self, domain):
        """도메인별 특화 설정 로드"""
        configs = {
            'c360': {'model': 'gpt-4', 'temperature': 0.1},
            'rapt': {'model': 'gpt-4', 'temperature': 0.2},
            'iptv': {'model': 'gpt-4-mini', 'temperature': 0.1}
        }
        return configs.get(domain, configs['default'])
    
    def generate_query(self, question):
        """도메인 특화 쿼리 생성"""
        response = client.chat.completions.create(
            model=self.model_config['model'],
            temperature=self.model_config['temperature'],
            messages=[
                {"role": "system", "content": f"당신은 {self.domain} 도메인 전문가입니다."},
                {"role": "user", "content": question}
            ]
        )
        return response.choices[0].message.content
```

## 학습 내용

### 기술적 인사이트

#### 1. Few-Shot Learning의 효과
- **적은 데이터로 높은 성능**: 소수의 예시만으로도 정확한 쿼리 생성 가능
- **도메인 적응성**: 각 비즈니스 도메인별 특화된 학습 패턴
- **지속적 개선**: 새로운 예시가 추가될수록 성능 향상

#### 2. 자연어 처리와 SQL의 융합
- **질의문 정제의 중요성**: 원본 질문을 검색에 최적화된 형태로 변환
- **의미 기반 매칭**: 키워드 매칭을 넘어선 의미적 유사성 검색
- **컨텍스트 이해**: 단순 번역이 아닌 비즈니스 로직 이해

#### 3. 벡터 검색의 활용
- **임베딩 공간**: 고차원 벡터 공간에서의 유사성 계산
- **HNSW 알고리즘**: 대규모 벡터 데이터에서의 효율적 검색
- **시맨틱 검색**: 의미적 관련성을 고려한 검색 결과

### 비즈니스 가치

#### 1. 생산성 향상
- **개발 시간 단축**: SQL 작성 시간의 대폭 감소
- **일관성 확보**: 표준화된 쿼리 패턴 제공
- **학습 비용 절감**: SQL 교육 비용 및 시간 절약

#### 2. 데이터 민주화
- **접근성 향상**: 비개발자도 데이터 분석 가능
- **자기주도 분석**: 즉시 질문하고 답변받는 환경
- **의사결정 지원**: 빠른 데이터 인사이트 제공

#### 3. 품질 관리
- **오류 감소**: 검증된 패턴 기반 쿼리 생성
- **표준화**: 일관된 쿼리 작성 방식
- **문서화**: 자동 생성되는 쿼리 설명

### 향후 발전 방향

#### 1. 고도화된 AI 기능
- **멀티모달 학습**: 텍스트와 테이블 스키마를 함께 학습
- **자동 스키마 추론**: 데이터만으로 테이블 관계 자동 분석
- **예측적 쿼리**: 사용자 의도를 예측한 쿼리 제안

#### 2. 실시간 학습
- **온라인 학습**: 사용자 피드백을 실시간으로 반영
- **적응형 모델**: 사용 패턴에 따른 모델 자동 조정
- **A/B 테스팅**: 다양한 접근 방식의 성능 비교

#### 3. 사용자 경험 개선
- **대화형 인터페이스**: 자연스러운 대화를 통한 쿼리 생성
- **시각적 쿼리 빌더**: 드래그 앤 드롭 방식의 쿼리 작성
- **결과 시각화**: 쿼리 결과의 자동 차트 생성

#### 4. 엔터프라이즈 기능
- **권한 관리**: 사용자별 데이터 접근 권한 제어
- **감사 로그**: 모든 쿼리 실행 이력 추적
- **성능 모니터링**: 쿼리 성능 및 리소스 사용량 모니터링

이 시스템을 통해 기업의 데이터 활용도를 크게 향상시키고, 모든 직원이 데이터 기반 의사결정을 할 수 있는 환경을 구축했습니다. 특히 Few-Shot Learning을 활용한 접근 방식은 적은 데이터로도 높은 성능을 달성할 수 있음을 보여주는 혁신적인 사례입니다.
