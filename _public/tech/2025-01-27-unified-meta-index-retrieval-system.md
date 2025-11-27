---
layout: post
title: "통합 메타 인덱스 조회 시스템 구축 가이드"
date: 2025-11-27 11:27:35 +0900
categories: tech
tags: [Azure AI Search, 메타데이터 검색, 하이브리드 검색, 벡터 검색, 시맨틱 검색]
excerpt: "Azure AI Search의 하이브리드 검색 기능을 활용하여 테이블 및 컬럼 메타데이터를 효율적으로 조회하는 시스템 구축 가이드입니다."
---

# 통합 메타 인덱스 조회 시스템

## 개요

통합 메타 인덱스에서 테이블 및 컬럼 메타데이터를 효율적으로 조회하는 시스템입니다. Azure AI Search의 하이브리드 검색 기능을 활용하여 사용자 질의에 최적화된 메타데이터를 제공합니다.

## 주요 기능

### 1. 하이브리드 검색
- **텍스트 검색**: 한국어 형태소 분석기를 활용한 정확한 키워드 매칭
- **벡터 검색**: 의미적 유사도 기반 검색
- **시맨틱 검색**: Azure AI의 시맨틱 랭킹 활용

### 2. 검색 컨텍스트 분리
- **테이블 검색**: 테이블명과 설명에 가중치 집중
- **컬럼 검색**: 컬럼명, 태그, 값 예시에 가중치 집중

### 3. 필터링 기능
- 도메인별 필터링
- 프로젝트별 필터링
- 사용 여부 필터링

## 사용 방법

### 기본 검색

```python
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

# 클라이언트 초기화
service_endpoint = "https://your-search-service.search.windows.net"
api_key = get_secret('azure-search-key')
index_name = "your-index-name"

search_client = SearchClient(
    endpoint=service_endpoint,
    index_name=index_name,
    credential=AzureKeyCredential(api_key)
)

# 기본 검색
results = search_client.search(
    search_text="고객 전화번호",
    top=10
)

for result in results:
    print(f"테이블: {result['TBL_LOGI_NM']}")
    print(f"컬럼: {result['ATTR_LOGI_NM']}")
    print(f"설명: {result['ATTR_DESCR']}")
    print("---")
```

### 테이블 검색 (Scoring Profile 적용)

```python
results = search_client.search(
    search_text="매출 집계 테이블",
    scoring_profile="table-scoring-profile",
    top=5
)
```

### 컬럼 검색 (시맨틱 검색 적용)

```python
results = search_client.search(
    search_text="고객 전화번호",
    scoring_profile="column-scoring-profile",
    query_type="semantic",
    semantic_configuration_name="column-semantic-config",
    top=30
)
```

### 벡터 검색

```python
from azure.search.documents.models import VectorizedQuery

# 임베딩 생성
query_vector = generate_embeddings("고객 정보")

# 벡터 쿼리 생성
vector_query = VectorizedQuery(
    vector=query_vector,
    k_nearest_neighbors=30,
    fields="ATTR_LOGI_NM_VECTOR"
)

# 하이브리드 검색 (텍스트 + 벡터)
results = search_client.search(
    search_text="고객 정보",
    vector_queries=[vector_query],
    scoring_profile="column-scoring-profile",
    top=30
)
```

### 필터링 적용

```python
# 특정 도메인만 검색
results = search_client.search(
    search_text="매출",
    filter="DOMAIN eq 'sales'",
    top=10
)

# 특정 테이블 내에서만 검색
results = search_client.search(
    search_text="고객번호",
    filter="TBL_PHYS_NM eq 'CUSTOMER_TABLE'",
    top=10
)

# 사용 중인 컬럼만 검색
results = search_client.search(
    search_text="주문일자",
    filter="USE_YN eq 'Y'",
    top=10
)
```

## 검색 결과 필드

| 필드명 | 설명 | 예시 |
|--------|------|------|
| `TBL_LOGI_NM` | 테이블 논리명 | "고객정보" |
| `TBL_PHYS_NM` | 테이블 물리명 | "CUSTOMER_INFO" |
| `TBL_DESCR` | 테이블 설명 | "고객의 기본 정보를 저장하는 테이블" |
| `ATTR_LOGI_NM` | 컬럼 논리명 | "고객번호" |
| `ATTR_PHYS_NM` | 컬럼 물리명 | "CUST_NO" |
| `ATTR_DESCR` | 컬럼 설명 | "고객을 식별하는 고유 번호" |
| `ATTR_VAL_EX` | 값 예시 | "C001, C002, C003" |
| `ATTR_TAG` | 태그 | "고객, 식별자, PK" |
| `DOMAIN` | 도메인 | "sales" |
| `USE_YN` | 사용 여부 | "Y" |

## 성능 최적화 팁

### 1. 검색 목적에 맞는 Scoring Profile 사용
- 테이블을 찾을 때: `table-scoring-profile`
- 컬럼을 찾을 때: `column-scoring-profile`

### 2. Top K 설정
- 테이블 검색: Top 5~10 권장
- SQL 작성용 컬럼 검색: Top 30 권장

### 3. 필터 활용
- 도메인이 명확한 경우 필터 적용으로 검색 범위 축소
- 특정 테이블 내 컬럼 검색 시 테이블 필터 적용

### 4. 하이브리드 검색 활용
- 정확한 키워드 매칭: 텍스트 검색
- 의미적 유사도: 벡터 검색
- 두 가지를 조합하면 최상의 결과

## 에러 처리

```python
from azure.core.exceptions import HttpResponseError

try:
    results = search_client.search(
        search_text="검색어",
        top=10
    )
    for result in results:
        print(result)
except HttpResponseError as e:
    print(f"검색 실패: {e.message}")
except Exception as e:
    print(f"예상치 못한 오류: {str(e)}")
```

## 참고 자료

- [Azure AI Search 공식 문서](https://learn.microsoft.com/azure/search/)
- [Python SDK 문서](https://learn.microsoft.com/python/api/overview/azure/search-documents-readme)
- 관련 문서: `create_unified_meta_index.md`, `meta_index_test_automated.md`
