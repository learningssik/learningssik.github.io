---
layout: post
title: "Azure AI Search 메타데이터 인덱스 최적화 가이드"
date: 2025-11-27 11:23:42 +0900
categories: tech
tags: [Azure AI Search, 인덱싱, 한국어 검색, 벡터 검색, 메타데이터, 최적화]
excerpt: "메타데이터 검색 시스템의 품질 향상과 비용 효율성을 위한 Azure AI Search 인덱스 구성 최적화 가이드입니다. 한국어 형태소 분석기 적용, 검색 문맥 분리, 벡터 검색 효율화 등을 다룹니다."
---

# Azure AI Search 메타데이터 인덱스 최적화 가이드

본 문서는 메타데이터(테이블, 컬럼 정보) 검색 시스템의 품질 향상과 비용 효율성을 위해 Azure AI Search 인덱스 구성을 최적화한 내용을 담고 있습니다.

## 1. 주요 수정 및 개선 사항

### 1) 한국어 형태소 분석기 적용 (`ko.microsoft`)
- **변경 전:** `standard.lucene` (기본값) 사용. 띄어쓰기 단위로 단어를 분리하여 "매출은", "매출이"가 다른 단어로 인식됨.
- **변경 후:** `ko.microsoft` 적용. **"매출은"**을 검색해도 **"매출"**을 찾을 수 있어 한국어 검색 재현율(Recall)이 비약적으로 상승.

### 2) 검색 문맥(Context) 분리 (테이블 vs 컬럼)
사용자의 검색 의도에 따라 최적의 결과를 주기 위해 **Scoring Profile**과 **Semantic Configuration**을 두 가지 전략으로 분리했습니다.
- **Table Context:** 테이블 이름과 설명에 가중치를 집중.
- **Column Context:** 컬럼(속성) 이름, 태그, 값 예시에 가중치를 집중.

### 3) 벡터 검색 효율화
- **HNSW 파라미터 최적화:** 3072차원 고차원 벡터의 특성을 고려하여 `m=16` (연결성 강화)으로 상향 조정하여 검색 정확도 확보.
- **불필요한 데이터 전송 방지:** 벡터 필드는 검색용으로만 사용하고 결과로 반환할 필요가 없으므로 `retrievable=False` 설정. (네트워크 대역폭 및 응답 속도 개선)

### 4) 가중치(Scoring Profile) 세분화
- 단순 텍스트 매칭뿐만 아니라, **논리명(Logical Name)**, **물리명(Physical Name)**, **태그(Tag)** 등 핵심 필드에 높은 가중치를 부여하여 설명(Description)에 우연히 섞인 단어보다 정확한 대상을 상위에 노출.

---

## 2. 최종 수정된 Python 코드

> **참고:** `azure-search-documents` 라이브러리 버전 호환성을 위해 `VectorCompression`(압축) 기능은 제외된 안정적인 버전입니다. (추후 라이브러리 업데이트 시 압축 적용 권장)

```python
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    HnswAlgorithmConfiguration,
    HnswParameters,
    SearchField,
    SearchableField,
    SearchFieldDataType,
    SearchIndex,
    SemanticConfiguration,
    SemanticField,
    SemanticPrioritizedFields,
    SemanticSearch,
    SimpleField,
    VectorSearch,
    VectorSearchAlgorithmKind,
    VectorSearchAlgorithmMetric,
    VectorSearchProfile,
    ScoringProfile,
    TextWeights
)

# ====================================================
# 1. 필드 정의 (Fields Configuration)
# ====================================================
col_fields = [
    # 식별자
    SimpleField(name="id", type=SearchFieldDataType.String, key=True, sortable=True, retrievable=True, filterable=True, facetable=True),
    
    # 단순 필터링/반환용 메타데이터
    SimpleField(name="PJT_NM", type=SearchFieldDataType.String, filterable=True, facetable=True),
    SimpleField(name="DATA_SET_NM", type=SearchFieldDataType.String, filterable=True, facetable=True),

    # [핵심] 한국어 분석기(ko.microsoft)가 적용된 검색 필드
    SearchableField(name="TBL_LOGI_NM", type=SearchFieldDataType.String, analyzer_name="ko.microsoft", searchable=True, retrievable=True, filterable=True),
    SearchableField(name="TBL_PHYS_NM", type=SearchFieldDataType.String, analyzer_name="standard.lucene", searchable=True, retrievable=True, filterable=True), # 영문/코드는 standard 권장
    SearchableField(name="TBL_DESCR", type=SearchFieldDataType.String, analyzer_name="ko.microsoft", searchable=True, retrievable=True, filterable=True),
    
    SearchableField(name="ATTR_LOGI_NM", type=SearchFieldDataType.String, analyzer_name="ko.microsoft", searchable=True, retrievable=True, filterable=True),
    SearchableField(name="ATTR_PHYS_NM", type=SearchFieldDataType.String, analyzer_name="standard.lucene", searchable=True, retrievable=True, filterable=True),
    SearchableField(name="ATTR_DESCR", type=SearchFieldDataType.String, analyzer_name="ko.microsoft", searchable=True, retrievable=True, filterable=True),
    
    SearchableField(name="ATTR_VAL_EX", type=SearchFieldDataType.String, analyzer_name="ko.microsoft", searchable=True, retrievable=True, filterable=True),
    SearchableField(name="ATTR_TAG", type=SearchFieldDataType.String, analyzer_name="ko.microsoft", searchable=True, retrievable=True, filterable=True),

    # 상태 및 날짜 메타데이터
    SimpleField(name="ATTR_DATA_TYP", type=SearchFieldDataType.String, filterable=True, facetable=True),
    SimpleField(name="USE_YN", type=SearchFieldDataType.String, filterable=True, facetable=True),
    SimpleField(name="ALL_USE_YN", type=SearchFieldDataType.String, filterable=True, facetable=True),
    SimpleField(name="CREATE_DATE", type=SearchFieldDataType.String, sortable=True, filterable=True, facetable=True),
    SimpleField(name="UPDATE_DATE", type=SearchFieldDataType.String, sortable=True, filterable=True, facetable=True),
    SimpleField(name="DOMAIN", type=SearchFieldDataType.String, filterable=True, facetable=True),
    SimpleField(name="SOURCE", type=SearchFieldDataType.String, filterable=True, facetable=True),
    SimpleField(name="LOADING_CYCLE", type=SearchFieldDataType.String, filterable=True, facetable=True),
    SimpleField(name="LOADING_CYCLE_BQ_CONDITION", type=SearchFieldDataType.String, filterable=True, facetable=True),

    # [최적화] 벡터 필드: retrievable=False (결과값 반환 안 함, 검색에만 사용)
    SearchField(name="ATTR_LOGI_NM_VECTOR", type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                searchable=True, retrievable=False, vector_search_dimensions=3072, vector_search_profile_name="my-vector-config"),
    SearchField(name="ATTR_DESCR_VECTOR", type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                searchable=True, retrievable=False, vector_search_dimensions=3072, vector_search_profile_name="my-vector-config"),
    SearchField(name="ATTR_TAG_VECTOR", type=SearchFieldDataType.Collection(SearchFieldDataType.Single), 
                searchable=True, retrievable=False, vector_search_dimensions=3072, vector_search_profile_name="my-vector-config"),
    SearchField(name="TBL_LOGI_NM_VECTOR", type=SearchFieldDataType.Collection(SearchFieldDataType.Single), 
                searchable=True, retrievable=False, vector_search_dimensions=3072, vector_search_profile_name="my-vector-config"),
    SearchField(name="TBL_DESCR_VECTOR", type=SearchFieldDataType.Collection(SearchFieldDataType.Single), 
                searchable=True, retrievable=False, vector_search_dimensions=3072, vector_search_profile_name="my-vector-config")
]

# ====================================================
# 2. 벡터 검색 구성 (Vector Search Configuration)
# ====================================================
col_vector_search = VectorSearch(
    algorithms=[
        HnswAlgorithmConfiguration(
            name="my-hnsw",
            kind=VectorSearchAlgorithmKind.HNSW,
            parameters=HnswParameters(
                m=16, # [최적화] 3072차원 벡터의 연결성 보장을 위해 4 -> 16 상향
                ef_construction=400,
                ef_search=500,
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

# ====================================================
# 3. 시맨틱 검색 구성 (Semantic Search Configuration)
# ====================================================
col_semantic_search = SemanticSearch(
    configurations=[
        # (A) 테이블 검색용 구성
        SemanticConfiguration(
            name="table-semantic-config",
            prioritized_fields=SemanticPrioritizedFields(
                title_field=SemanticField(field_name="TBL_LOGI_NM"),
                keywords_fields=[SemanticField(field_name="TBL_PHYS_NM")],
                content_fields=[SemanticField(field_name="TBL_DESCR")],
            ),
        ),
        # (B) 컬럼(속성) 검색용 구성
        SemanticConfiguration(
            name="column-semantic-config",
            prioritized_fields=SemanticPrioritizedFields(
                title_field=SemanticField(field_name="ATTR_LOGI_NM"),
                keywords_fields=[
                    SemanticField(field_name="ATTR_TAG"),
                    SemanticField(field_name="ATTR_PHYS_NM"),
                    SemanticField(field_name="TBL_LOGI_NM") # 컬럼의 소속 테이블 정보도 중요 키워드
                ],
                content_fields=[
                    SemanticField(field_name="ATTR_DESCR"),
                    SemanticField(field_name="ATTR_VAL_EX")
                ],
            ),
        )
    ]
)

# ====================================================
# 4. 스코어링 프로필 (Scoring Profiles) - 가중치 설정
# ====================================================
col_scoring_profiles = [
    # (A) 테이블 검색 가중치 전략
    ScoringProfile(
        name="table-scoring-profile",
        text_weights=TextWeights(
            weights={
                "TBL_LOGI_NM": 10.0, # 테이블 논리명 최우선
                "TBL_PHYS_NM": 8.0,
                "TBL_DESCR": 3.0,
                # 컬럼 정보는 보조적인 역할로 점수 낮춤
                "ATTR_LOGI_NM": 0.5, "ATTR_PHYS_NM": 0.5, "ATTR_TAG": 0.5
            }
        )
    ),
    # (B) 컬럼 검색 가중치 전략
    ScoringProfile(
        name="column-scoring-profile",
        text_weights=TextWeights(
            weights={
                "ATTR_LOGI_NM": 10.0, # 속성 논리명 최우선
                "ATTR_PHYS_NM": 8.0,
                "ATTR_TAG": 6.0,      # 태그 중요
                "ATTR_VAL_EX": 5.0,
                "TBL_LOGI_NM": 3.0,   # 소속 테이블 정보도 어느 정도 중요
                "ATTR_DESCR": 1.0
            }
        )
    )
]

# ====================================================
# 5. 인덱스 생성 함수
# ====================================================
def create_col_index(index_name):
    # 실제 환경에 맞는 Endpoint/Key 설정 필요
    service_endpoint = "https://your-search-service.search.windows.net"
    # api_key = get_secret('azure-search-key') 
    # credential = AzureKeyCredential(api_key)
    # index_client = SearchIndexClient(endpoint=service_endpoint, credential=credential)

    col_index = SearchIndex(
        name=index_name,
        fields=col_fields,
        vector_search=col_vector_search,
        semantic_search=col_semantic_search,
        scoring_profiles=col_scoring_profiles,
        # 기본적으로 컬럼 검색 빈도가 높다면 설정 (검색 시 지정 가능)
        default_scoring_profile="column-scoring-profile"
    )

    # index_client.create_or_update_index(col_index)
    print(f"Index '{index_name}' configuration is ready.")
    return

# 실행
create_col_index('test-col-index-dev')
```

---

## 3. 검색 활용 방법 (Python 예시)

인덱스가 생성된 후, 상황에 맞춰 파라미터를 다르게 호출해야 최상의 성능을 냅니다.

### Case A: 테이블을 찾고 싶을 때
> "매출 집계 테이블 찾아줘"

```python
results = search_client.search(
    search_text="매출 집계",
    scoring_profile="table-scoring-profile",       # [중요] 테이블 가중치 적용
    query_type="semantic",                         # 시맨틱 검색 사용 시
    semantic_configuration_name="table-semantic-config", # [중요] 테이블 시맨틱 구성
    top=5
)
```

### Case B: 특정 컬럼(속성)을 찾고 싶을 때
> "고객 전화번호 컬럼 어디 있어?"

```python
results = search_client.search(
    search_text="고객 전화번호",
    scoring_profile="column-scoring-profile",      # [중요] 컬럼 가중치 적용
    query_type="semantic",                         # 시맨틱 검색 사용 시
    semantic_configuration_name="column-semantic-config", # [중요] 컬럼 시맨틱 구성
    top=5
)
```