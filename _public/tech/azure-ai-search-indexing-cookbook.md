---
layout: post
title: "Azure AI Search 인덱싱 관리 쿡북"
date: 2025-01-21 00:00:00 +0900
categories: tech
tags: [Azure AI Search, 인덱싱, 쿡북, Python, API 관리, 데이터 백업, 인덱스 복사]
excerpt: "Azure AI Search 인덱스의 전체 생명주기를 효율적으로 관리하기 위한 재사용 가능한 기능들의 모음으로, 인덱스 생성, 조회, 저장, 삭제, 복사 등 모든 인덱스 관리 작업을 표준화된 함수로 제공합니다."
---

# Azure AI Search 인덱싱 관리 쿡북

## 개요

이 프로젝트는 **Azure AI Search** 인덱스의 전체 생명주기를 효율적으로 관리하기 위한 재사용 가능한 기능들의 모음입니다. 인덱스 생성, 조회, 저장, 삭제, 복사 등 모든 인덱스 관리 작업을 표준화된 함수로 제공하여 개발자들이 복잡한 Azure Search API를 직접 다루지 않고도 쉽게 인덱스를 관리할 수 있도록 도와줍니다.

### 핵심 특징
- **완전한 인덱스 생명주기 관리**: 생성부터 삭제까지 모든 단계를 커버
- **자동화된 데이터 백업**: CSV 형태로 자동 백업 및 GCS 업로드
- **템플릿 기반 인덱스 생성**: 테이블, 컬럼, Few-shot 인덱스 표준 템플릿 제공
- **인덱스 복사 및 동기화**: 개발/운영 환경 간 완전한 인덱스 복제
- **모니터링 및 현황 파악**: 전체 인덱스 현황을 한눈에 확인

## 문제 해결

### 기존 문제점
1. **복잡한 Azure Search API**: 인덱스 관리 작업마다 복잡한 API 호출 필요
2. **반복적인 코드 작성**: 동일한 인덱스 작업을 매번 처음부터 작성
3. **수동 백업 관리**: 인덱스 데이터 백업을 수동으로 수행해야 함
4. **환경 간 동기화 어려움**: 개발/운영 환경 간 인덱스 동기화의 복잡성
5. **인덱스 현황 파악 어려움**: 전체 인덱스 상태를 한눈에 보기 어려움

### 해결 효과
- **개발 생산성 향상**: 재사용 가능한 함수로 빠른 인덱스 관리
- **자동화된 백업**: 정기적인 데이터 백업으로 데이터 손실 방지
- **표준화된 인덱스 구조**: 일관된 인덱스 스키마로 검색 품질 향상
- **환경 동기화 자동화**: 개발/운영 환경 간 자동 동기화
- **운영 효율성 증대**: 중앙화된 인덱스 관리로 운영 부담 감소

## 구현 방식

### 1. 인덱스 현황 모니터링 시스템

#### 전체 인덱스 현황 조회
```python
def get_index_overview():
    """전체 인덱스 목록과 문서 수를 한눈에 확인하는 함수"""
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents.indexes import SearchIndexClient
    from azure.search.documents import SearchClient
    
    # Azure AI Search 인스턴스 설정
    service_endpoint = "https://index-aqua.search.windows.net"
    api_key = secret_manage('index-aqua')
    credential = AzureKeyCredential(api_key)
    
    # 인덱스 클라이언트 생성
    index_client = SearchIndexClient(endpoint=service_endpoint, credential=credential)
    
    # 인덱스 목록 가져오기
    indexes = list(index_client.list_index_names())
    print(f"인덱스 갯수: {len(indexes)}")
    print(f"인덱스 리스트: {', '.join(indexes)}")
    
    # 각 인덱스별 문서 수 및 최대 ID 확인
    col_list = []
    for index_name in indexes:
        # 특정 인덱스만 필터링 (edu, open, guide, test, flywheel 제외)
        if all(x not in index_name for x in ['edu', 'open', 'guide', 'test', 'flywheel']):
            search_client = SearchClient(endpoint=service_endpoint, index_name=index_name, credential=credential)
            document_count = search_client.get_document_count()
            document_max_id = get_max_id_from_index(search_client, index_name)
            print(f"📄 인덱스 이름: '{index_name}', 문서 수: {document_count}, 최대 ID: {document_max_id}")
            col_list.append(index_name)
    
    return col_list

def get_max_id_from_index(search_client, index_name):
    """인덱스에서 가장 큰 ID를 가져오는 함수"""
    results = search_client.search(
        search_text="*", 
        select=["id"], 
        top=10000  # 가져올 최대 문서 수
    )
    
    # 숫자형 ID만 추출하여 최대값 반환
    id_list = [int(item['id']) for item in results if item['id'].isdigit()]
    return max(id_list) if id_list else 0
```

### 2. 인덱스 메타데이터 조회 시스템

#### 상세 인덱스 구성 정보 조회
```python
def get_index_metadata(index_name):
    """인덱스의 상세 구성 정보를 JSON 형태로 조회하는 함수"""
    import json
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents.indexes import SearchIndexClient
    
    # Azure AI Search 인스턴스 설정
    service_endpoint = "https://index-aqua.search.windows.net"
    api_key = secret_manage('index-aqua')
    credential = AzureKeyCredential(api_key)
    
    # 인덱스 클라이언트 생성
    index_client = SearchIndexClient(endpoint=service_endpoint, credential=credential)
    index_info = index_client.get_index(index_name)
    
    # 필드 정보 정리
    fields_config = {}
    for field in index_info.fields:
        field_class = type(field).__name__
        fields_config[field.name] = {
            "field_class": field_class,
            "type": field.type,
            "key": "Y" if field.key else "N",
            "searchable": "Y" if field.searchable else "N",
            "filterable": "Y" if field.filterable else "N",
            "sortable": "Y" if field.sortable else "N",
            "facetable": "Y" if field.facetable else "N",
            "retrievable": "Y" if getattr(field, "retrievable", True) else "N",
            "analyzer": getattr(field, "analyzer_name", ""),
            "synonym_map": getattr(field, "synonym_map_names", []),
        }
    
    # 스코어링 프로파일 구성
    scoring_profiles = [
        {
            "name": sp.name,
            "text_weights": getattr(sp, "text_weights", None),
            "function": getattr(sp, "functions", None)
        }
        for sp in getattr(index_info, "scoring_profiles", [])
    ]
    
    # 시맨틱 구성
    semantic_config = {}
    if getattr(index_info, "semantic_settings", None):
        semantic_config = {
            "default_config": index_info.semantic_settings.default_configuration_name,
            "configurations": [
                {
                    "name": config.name,
                    "prioritized_fields": {
                        "title_field": getattr(config.prioritized_fields, "title_field", None),
                        "content_fields": getattr(config.prioritized_fields, "content_fields", []),
                        "keywords_fields": getattr(config.prioritized_fields, "keywords_fields", [])
                    }
                } for config in index_info.semantic_settings.configurations
            ]
        }
    
    # 벡터 검색 구성
    vector_config = {}
    if getattr(index_info, "vector_search", None):
        vector_config = {
            "algorithm_configurations": [
                {
                    "name": algo.name,
                    "kind": algo.kind,
                    "hnsw_parameters": getattr(algo, "hnsw_parameters", None),
                    "exhaustive_knn_parameters": getattr(algo, "exhaustive_knn_parameters", None)
                } for algo in index_info.vector_search.algorithms
            ],
            "profiles": [
                {
                    "name": profile.name,
                    "algorithm": profile.algorithm_configuration_name,
                    "vectorizer": getattr(profile, "vectorizer", None)
                } for profile in index_info.vector_search.profiles
            ]
        }
    
    # 최종 메타데이터 구성
    index_metadata = {
        "index_name": index_info.name,
        "fields": fields_config,
        "scoring_profiles": scoring_profiles,
        "semantic_config": semantic_config,
        "vector_config": vector_config,
        "suggesters": [s.name for s in getattr(index_info, "suggesters", []) or []],
        "analyzers": [a.name for a in getattr(index_info, "analyzers", []) or []],
        "encryption_key": str(index_info.encryption_key) if index_info.encryption_key else None,
        "cors_options": str(index_info.cors_options) if index_info.cors_options else None,
    }
    
    print(json.dumps(index_metadata, indent=4, ensure_ascii=False))
    return index_metadata
```

#### 인덱스 간 차이점 비교
```python
def compare_indexes(index_source, index_target):
    """두 인덱스 간의 차이점을 비교하는 함수"""
    import json
    from deepdiff import DeepDiff
    
    # 소스와 타겟 인덱스 메타데이터 조회
    source_metadata = get_index_metadata(index_source)
    target_metadata = get_index_metadata(index_target)
    
    # Deep 비교 수행
    diff = DeepDiff(source_metadata, target_metadata, ignore_order=True)
    
    # 차이점 출력
    print(json.dumps(diff, indent=4, ensure_ascii=False))
    return diff
```

### 3. 인덱스 데이터 백업 시스템

#### 자동 CSV 백업 및 GCS 업로드
```python
def load_to_gcs(index_name):
    """인덱스 데이터를 CSV로 추출하여 GCS에 자동 저장하는 함수"""
    from azure.search.documents import SearchClient
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents.indexes import SearchIndexClient
    from google.cloud import storage
    import csv
    import os
    from datetime import datetime
    
    # Azure AI Search 인스턴스 설정
    service_endpoint = "https://index-aqua.search.windows.net"
    api_key = secret_manage('index-aqua')
    credential = AzureKeyCredential(api_key)
    
    # 클라이언트 생성
    index_client = SearchIndexClient(endpoint=service_endpoint, credential=credential)
    search_client = SearchClient(endpoint=service_endpoint, index_name=index_name, credential=credential)
    
    # 파일명 정의
    today_date_csv = datetime.today().strftime("%Y%m%d%H%M%S")
    modified_index_name = index_name.replace("-prod", "").replace("-dev", "").replace("col", "meta")
    csv_filename = f"{modified_index_name}.csv"
    
    # 인덱스 타입에 따른 필드 자동 선택
    if 'fewshot' in index_name:
        headers_list = ["id", "SOURCE", "DOMAIN", "USER_QUESTION", "SEARCH_QUESTION", 
                       "QRY_WRITING_TIP", "CORR_QRY", "USE_YN", "ALL_USE_YN", 
                       "IS_QUESTION_ELIGIBLE", "CREATE_DATE", "UPDATE_DATE"]
    elif 'col' in index_name:
        headers_list = ["id", "PJT_NM", "DATA_SET_NM", "TBL_LOGI_NM", "TBL_PHYS_NM", 
                       "TBL_DESCR", "ATTR_LOGI_NM", "ATTR_PHYS_NM", "ATTR_DESCR", 
                       "ATTR_VAL_EX", "ATTR_TAG", "ATTR_DATA_TYP", "USE_YN", 
                       "ALL_USE_YN", "CREATE_DATE", "UPDATE_DATE", "DOMAIN", "SOURCE", 
                       "LOADING_CYCLE", "LOADING_CYCLE_BQ_CONDITION"]
    elif 'tbl' in index_name:
        headers_list = ["id", "PJT_NM", "DATA_SET_NM", "TBL_LOGI_NM", "TBL_PHYS_NM", "TBL_DESCR"]
    else:
        # 전체 필드 자동 감지
        index_info = index_client.get_index(index_name)
        headers_list = [field.name for field in index_info.fields]
    
    # CSV 헤더 초기화
    with open(csv_filename, "w", encoding="utf-8-sig", newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers_list)
        writer.writeheader()
    
    # 배치 처리로 데이터 추출
    total_fetched = 0
    batch = []
    batch_size = 10
    
    results = search_client.search(search_text="*")  # 전체 문서 스트리밍
    
    for doc in results:
        row = {key: doc.get(key, "") for key in headers_list}
        batch.append(row)
        
        if len(batch) >= batch_size:
            with open(csv_filename, "a", encoding="utf-8-sig", newline='') as f:
                writer = csv.DictWriter(f, fieldnames=headers_list)
                writer.writerows(batch)
            total_fetched += len(batch)
            print(f"📦 누적 가져온 문서 수: {total_fetched}")
            batch = []
    
    # 마지막 배치 쓰기
    if batch:
        with open(csv_filename, "a", encoding="utf-8-sig", newline='') as f:
            writer = csv.DictWriter(f, fieldnames=headers_list)
            writer.writerows(batch)
        total_fetched += len(batch)
        print(f"📦 마지막 배치 포함 총: {total_fetched}건 완료")
    
    # GCS 업로드
    gcs_client = storage.Client()
    bucket = gcs_client.bucket("bucket-dev-aqua-index-hist")
    blob = bucket.blob(csv_filename)
    blob.upload_from_filename(csv_filename)
    print(f"✅ GCS 업로드 완료: {csv_filename}")
    
    # 로컬 파일 삭제
    os.remove(csv_filename)
    print(f"🧹 로컬 파일 삭제 완료: {csv_filename}")
    
    return total_fetched
```

### 4. 인덱스 업데이트 시스템

✅ 목적: 인덱스 업데이트

| 목적 | 설명 |
| ------------- | ------------------------------------- |
| 🔄 최신 데이터 반영 | 소스 시스템 변경 사항을 인덱스에 반영하여 검색 결과 최신성 확보 |
| ⚙️ 성능 최적화 | 불필요한 필드 제거 및 필요한 필드만 유지해 검색 속도와 효율 개선 |
| 🧩 데이터 일관성 유지 | 잘못된 값 수정 및 규칙 기반 업데이트로 인덱스 품질 보장 |
| 📊 분석 활용성 강화 | 신규 속성 추가·갱신을 통해 검색 및 분석 활용 범위 확대 |

#### 개별 문서 업데이트
```python
def update_document(index_name, document_id, update_fields):
    """인덱스 내 특정 문서를 업데이트하는 함수"""
    from azure.search.documents import SearchClient
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents.indexes import SearchIndexClient
    
    # Azure AI Search 인스턴스 설정
    service_endpoint = "https://index-aqua.search.windows.net"
    api_key = secret_manage('index-aqua')
    credential = AzureKeyCredential(api_key)
    
    # 클라이언트 생성
    index_client = SearchIndexClient(endpoint=service_endpoint, credential=credential)
    search_client = SearchClient(endpoint=service_endpoint, index_name=index_name, credential=credential)
    
    # 기존 문서 조회
    results = search_client.search(
        search_text="*",
        filter=f"id eq '{document_id}'"
    )
    
    doc = None
    for result in results:
        doc = dict(result)  # 문서를 dict로 변환
        break
    
    if not doc:
        raise ValueError(f"문서 ID '{document_id}'를 찾을 수 없습니다.")
    
    print("Before update:", doc)
    
    # 원하는 필드만 수정
    for field, value in update_fields.items():
        doc[field] = value
    
    # 수정된 문서 다시 업서트
    index_client.merge_or_upload_documents([doc])
    
    # 업데이트 후 확인
    updated_results = search_client.search(
        search_text="*",
        filter=f"id eq '{document_id}'",
        select=list(update_fields.keys())
    )
    
    for u in updated_results:
        print("After update:", u)
    
    return doc
```

#### 예시: id와 TBL_PHYS_NM로 특정 문서 업데이트
```python
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient

# Azure AI Search 인스턴스 설정
service_endpoint = "https://index-aqua.search.windows.net"
api_key = secret_manage('index-aqua')
credential = AzureKeyCredential(api_key)

index_name = 'csqt-tbl-index-dev'

# 인덱스 클라이언트 생성
index_client = SearchIndexClient(endpoint=service_endpoint, credential=credential)
search_client = SearchClient(endpoint=service_endpoint, index_name=index_name, credential=credential)

# 1) 기존 문서 조회 (id=60, TBL_PHYS_NM='L0NML_F_QMS_CC_HSD_01D_A_CZ')
results = search_client.search(
    search_text="*",
    filter="id eq '60' and TBL_PHYS_NM eq 'L0NML_F_QMS_CC_HSD_01D_A_CZ'"
)

doc = None
for result in results:
    doc = dict(result)
    break

if not doc:
    raise ValueError("문서를 찾을 수 없습니다.")

print("Before update:", doc)

# 2) 원하는 필드만 수정
doc["DATA_SET_NM"] = "DLKVW"

# 3) 수정된 문서 다시 업서트
index_client.merge_or_upload_documents([doc])

# 4) 업데이트 후 확인
updated_results = search_client.search(
    search_text="*",
    filter="id eq '60' and TBL_PHYS_NM eq 'L0NML_F_QMS_CC_HSD_01D_A_CZ'",
    select=["id", "TBL_PHYS_NM", "DATA_SET_NM"]
)

for u in updated_results:
    print("After update:", u)
```

### 5. 인덱스 삭제 시스템

#### 전체 인덱스 삭제
```python
def delete_index(index_name):
    """인덱스를 완전히 삭제하는 함수"""
    from azure.search.documents import SearchClient
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents.indexes import SearchIndexClient
    from azure.core.exceptions import ResourceNotFoundError
    
    # Azure AI Search 인스턴스 설정
    service_endpoint = "https://index-aqua.search.windows.net"
    api_key = secret_manage('index-aqua')
    credential = AzureKeyCredential(api_key)
    
    # 인덱스 클라이언트 생성
    index_client = SearchIndexClient(endpoint=service_endpoint, credential=credential)
    
    try:
        # 존재 여부 먼저 확인
        index_client.get_index(index_name)
    except ResourceNotFoundError:
        print(f"❌ Index '{index_name}' does not exist.")
        return
    
    # 존재하면 삭제 시도
    try:
        index_client.delete_index(index_name)
        print(f"✅ Index '{index_name}' has been deleted successfully.")
    except Exception as e:
        print(f"⚠️ Error deleting index '{index_name}': {str(e)}")
    
    return
```

#### 인덱스 내 특정 문서 삭제
```python
def delete_documents_by_filter(index_name, filter_query):
    """필터 조건에 맞는 문서들을 삭제하는 함수"""
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents.indexes import SearchIndexClient
    from azure.search.documents import SearchClient
    
    service_endpoint = "https://index-aqua.search.windows.net"
    api_key = secret_manage('index-aqua')
    credential = AzureKeyCredential(api_key)
    
    search_client = SearchClient(service_endpoint, index_name, credential=credential)
    
    # 필터 조건에 맞는 문서 조회
    existing_docs = list(search_client.search(filter=filter_query, select="id"))
    print(f"삭제 대상 문서 수: {len(existing_docs)}")
    
    if existing_docs:
        for doc in existing_docs:
            existing_id = doc["id"]
            search_client.delete_documents(documents=[{"id": existing_id}])
            print(f"Deleted document with id: {existing_id}")
    else:
        print("No existing document found to delete.")
    
    return len(existing_docs)
```

#### 인덱스 초기화 (데이터만 삭제)
```python
def delete_all_documents(index_name):
    """인덱스 구조는 유지하고 모든 문서만 삭제하는 함수"""
    from azure.search.documents import SearchClient
    from azure.core.credentials import AzureKeyCredential
    from azure.core.exceptions import ResourceNotFoundError
    
    # Azure Search 설정
    service_endpoint = "https://index-aqua.search.windows.net"
    api_key = secret_manage("index-aqua")
    credential = AzureKeyCredential(api_key)
    
    # SearchClient 생성
    search_client = SearchClient(endpoint=service_endpoint, index_name=index_name, credential=credential)
    
    try:
        print(f"📥 Fetching all document IDs from index '{index_name}'...")
        results = search_client.search(search_text="*", select=["id"], top=10000)
        
        # 모든 문서 ID 수집
        doc_ids = [result["id"] for result in results]
        
        total_docs = len(doc_ids)
        if total_docs == 0:
            print(f"✅ Index '{index_name}' is already empty.")
            return
        
        print(f"🔍 Found {total_docs} documents. Starting batch deletion...")
        
        # 최대 1000개씩 나눠서 삭제
        for i in range(0, total_docs, 1000):
            batch = [{"@search.action": "delete", "id": doc_id} for doc_id in doc_ids[i:i+1000]]
            result = search_client.upload_documents(documents=batch)
            print(f"🧹 Deleted batch {i//1000 + 1} ({len(batch)} docs)")
        
        print(f"✅ All documents deleted from index '{index_name}'.")
        
    except ResourceNotFoundError:
        print(f"❌ Index '{index_name}' not found.")
    except Exception as e:
        print(f"⚠️ Error deleting documents: {str(e)}")
    
    return total_docs
```

### 6. 인덱스 복사 및 동기화 시스템

#### 완전한 인덱스 복사
```python
def copy_paste_index(source_index, target_index):
    """인덱스 스키마와 데이터를 완전히 복사하는 함수"""
    from azure.search.documents.indexes import SearchIndexClient
    from azure.search.documents import SearchClient
    from azure.search.documents.indexes.models import SearchIndex
    from azure.core.credentials import AzureKeyCredential
    
    print("start copy and paste")
    print(f"source_index: {source_index}")
    print(f"target_index: {target_index}")
    
    service_endpoint = "https://index-aqua.search.windows.net"
    api_key = secret_manage("index-aqua")
    credential = AzureKeyCredential(api_key)
    
    # 클라이언트 설정
    index_client = SearchIndexClient(endpoint=service_endpoint, credential=credential)
    source_client = SearchClient(service_endpoint, source_index, credential=credential)
    target_client = SearchClient(service_endpoint, target_index, credential=credential)
    
    # 1. 기존 타겟 인덱스 삭제
    try:
        index_client.delete_index(target_index)
        print(f"✅ 기존 인덱스 '{target_index}' 삭제 완료")
    except Exception as e:
        print(f"⚠ 인덱스 삭제 실패 (이미 삭제되었거나 오류 발생): {e}")
    
    # 2. 소스 인덱스의 스키마 가져오기
    source_index_schema = index_client.get_index(source_index)
    
    # 3. 벡터 검색, 시맨틱 검색, 스코어링 프로파일 설정 가져오기
    vector_search_config = source_index_schema.vector_search
    semantic_search_config = source_index_schema.semantic_search
    scoring_profiles = getattr(source_index_schema, "scoring_profiles", None)
    
    # 4. 신규 타겟 인덱스 생성
    new_index = SearchIndex(
        name=target_index,
        fields=source_index_schema.fields,
        vector_search=vector_search_config,
        semantic_search=semantic_search_config,
        scoring_profiles=scoring_profiles
    )
    
    index_client.create_index(new_index)
    print(f"✅ 새로운 인덱스 '{target_index}' 생성 완료")
    
    # 5. 소스 인덱스에서 데이터 가져오기 (배치 처리)
    batch_size = 10
    offset = 0
    total_uploaded = 0
    
    while True:
        results = source_client.search(search_text="*", top=batch_size, skip=offset)
        docs = list(results)
        
        if not docs:
            break
        
        if docs:
            try:
                target_client.upload_documents(docs)
                total_uploaded += len(docs)
                print(f"📦 업로드 완료: {total_uploaded}건 누적")
            except Exception as upload_error:
                print(f"❌ 업로드 실패 (offset={offset}): {upload_error}")
        
        offset += batch_size
    
    print(f"🎉 모든 문서 복사 완료. 총 {total_uploaded}건 업로드됨.")
    return total_uploaded
```

### 7. 인덱스 생성 템플릿 시스템

#### 테이블 인덱스 생성 템플릿
```python
def create_tbl_index(index_name):
    """테이블 메타데이터용 인덱스 생성 템플릿"""
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
    )
    
    # 테이블 인덱스 필드 정의
    tbl_fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True, sortable=True, filterable=True, facetable=True),
        SearchableField(name="PJT_NM", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="DATA_SET_NM", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="TBL_LOGI_NM", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="TBL_PHYS_NM", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="TBL_DESCR", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="ATTR_LOGI_NM_SET", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="ATTR_PHYS_NM_SET", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SimpleField(name="CREATE_DATE", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="UPDATE_DATE", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="DOMAIN", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="SOURCE", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        # 벡터 필드들
        SearchField(name="TBL_LOGI_NM_VECTOR", type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                   searchable=True, vector_search_dimensions=3072, vector_search_profile_name="my-vector-config"),
        SearchField(name="TBL_DESCR_VECTOR", type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                   searchable=True, vector_search_dimensions=3072, vector_search_profile_name="my-vector-config"),
        SearchField(name="ATTR_LOGI_NM_SET_VECTOR", type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                   searchable=True, vector_search_dimensions=3072, vector_search_profile_name="my-vector-config")
    ]
    
    # 벡터 검색 구성
    tbl_vector_search = VectorSearch(
        algorithms=[
            HnswAlgorithmConfiguration(
                name="my-hnsw",
                kind=VectorSearchAlgorithmKind.HNSW,
                parameters=HnswParameters(
                    m=4,
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
    
    # 시맨틱 검색 구성
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
    
    # 인덱스 생성
    service_endpoint = "https://index-aqua.search.windows.net"
    api_key = secret_manage('index-aqua')
    credential = AzureKeyCredential(api_key)
    
    index_client = SearchIndexClient(endpoint=service_endpoint, credential=credential)
    
    tbl_index = SearchIndex(
        name=index_name,
        fields=tbl_fields,
        vector_search=tbl_vector_search,
        semantic_search=tbl_semantic_search,
    )
    
    index_client.create_or_update_index(tbl_index)
    print(f"{index_name} created")
    return
```

#### 컬럼 인덱스 생성 템플릿
```python
def create_col_index(index_name):
    """컬럼 메타데이터용 인덱스 생성 템플릿"""
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
    )
    
    # 컬럼 인덱스 필드 정의
    col_fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True, sortable=True, filterable=True, facetable=True),
        SearchableField(name="TBL_PHYS_NM", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="ATTR_LOGI_NM", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="ATTR_PHYS_NM", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="ATTR_DESCR", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="ATTR_VAL_EX", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="ATTR_TAG", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SimpleField(name="PJT_NM", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="DATA_SET_NM", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="TBL_LOGI_NM", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="TBL_DESCR", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="ATTR_DATA_TYP", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="USE_YN", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="ALL_USE_YN", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="CREATE_DATE", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="UPDATE_DATE", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="DOMAIN", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        SimpleField(name="SOURCE", type=SearchFieldDataType.String, sortable=True, retrievable=True, filterable=True, facetable=True),
        # 벡터 필드들
        SearchField(name="ATTR_LOGI_NM_VECTOR", type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                   searchable=True, vector_search_dimensions=3072, vector_search_profile_name="my-vector-config"),
        SearchField(name="ATTR_DESCR_VECTOR", type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                   searchable=True, vector_search_dimensions=3072, vector_search_profile_name="my-vector-config")
    ]
    
    # 벡터 검색 구성 (테이블과 동일)
    col_vector_search = VectorSearch(
        algorithms=[
            HnswAlgorithmConfiguration(
                name="my-hnsw",
                kind=VectorSearchAlgorithmKind.HNSW,
                parameters=HnswParameters(
                    m=4,
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
    
    # 시맨틱 검색 구성
    col_semantic_search = SemanticSearch(
        configurations=[
            SemanticConfiguration(
                name="semantic-config",
                prioritized_fields=SemanticPrioritizedFields(
                    title_field=SemanticField(field_name="ATTR_LOGI_NM"),
                    keywords_fields=[SemanticField(field_name="ATTR_TAG")],
                    content_fields=[SemanticField(field_name="ATTR_DESCR")],
                ),
            )
        ]
    )
    
    # 인덱스 생성
    service_endpoint = "https://index-aqua.search.windows.net"
    api_key = secret_manage('index-aqua')
    credential = AzureKeyCredential(api_key)
    
    index_client = SearchIndexClient(endpoint=service_endpoint, credential=credential)
    
    col_index = SearchIndex(
        name=index_name,
        fields=col_fields,
        vector_search=col_vector_search,
        semantic_search=col_semantic_search,
    )
    
    index_client.create_or_update_index(col_index)
    print(f"{index_name} created")
    return
```

#### Few-shot 인덱스 생성 템플릿
```python
def create_fewshot_index(index_name):
    """Few-shot 학습용 인덱스 생성 템플릿"""
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
    )
    
    # Few-shot 인덱스 필드 정의
    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True, sortable=True, filterable=True, facetable=True),
        SimpleField(name="SOURCE", type=SearchFieldDataType.String, filterable=True, sortable=True),
        SimpleField(name="DOMAIN", type=SearchFieldDataType.String, filterable=True, sortable=True),
        SearchableField(name="USER_QUESTION", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="SEARCH_QUESTION", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="QRY_WRITING_TIP", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SearchableField(name="CORR_QRY", type=SearchFieldDataType.String, searchable=True, retrievable=True, filterable=True),
        SimpleField(name="USE_YN", type=SearchFieldDataType.String, retrievable=True, filterable=True, sortable=True),
        SimpleField(name="ALL_USE_YN", type=SearchFieldDataType.String, retrievable=True, filterable=True, sortable=True),
        SimpleField(name="IS_QUESTION_ELIGIBLE", type=SearchFieldDataType.String, retrievable=True, filterable=True, sortable=True),
        SimpleField(name="CREATE_DATE", type=SearchFieldDataType.String, retrievable=True, filterable=True, sortable=True),
        SimpleField(name="UPDATE_DATE", type=SearchFieldDataType.String, retrievable=True, filterable=True, sortable=True),
        # 벡터 필드
        SearchField(name="QUESTION_VECTOR", type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                   searchable=True, vector_search_dimensions=3072, vector_search_profile_name="my-vector-config")
    ]
    
    # 벡터 검색 구성
    vector_search = VectorSearch(
        algorithms=[
            HnswAlgorithmConfiguration(
                name="my-hnsw",
                kind=VectorSearchAlgorithmKind.HNSW,
                parameters=HnswParameters(
                    m=4,
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
    
    # 시맨틱 검색 구성
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
    
    # 인덱스 생성
    service_endpoint = "https://index-aqua.search.windows.net"
    api_key = secret_manage('index-aqua')
    credential = AzureKeyCredential(api_key)
    
    index_client = SearchIndexClient(endpoint=service_endpoint, credential=credential)
    
    index = SearchIndex(
        name=index_name,
        fields=fields,
        vector_search=vector_search,
        semantic_search=semantic_search,
    )
    
    index_client.create_or_update_index(index)
    print(f"{index_name} created")
    return
```

## 리팩토링 제안

### 1. 모듈화 및 클래스 기반 구조

#### 인덱스 관리자 클래스
```python
class IndexManager:
    """Azure AI Search 인덱스 관리를 위한 통합 클래스"""
    
    def __init__(self, service_endpoint: str, api_key: str):
        self.service_endpoint = service_endpoint
        self.api_key = api_key
        self.credential = AzureKeyCredential(api_key)
        self.index_client = SearchIndexClient(endpoint=service_endpoint, credential=self.credential)
    
    def get_overview(self) -> Dict[str, Any]:
        """전체 인덱스 현황 조회"""
        indexes = list(self.index_client.list_index_names())
        overview = {
            "total_count": len(indexes),
            "indexes": []
        }
        
        for index_name in indexes:
            if self._should_include_index(index_name):
                search_client = SearchClient(endpoint=self.service_endpoint, index_name=index_name, credential=self.credential)
                document_count = search_client.get_document_count()
                document_max_id = self._get_max_id_from_index(search_client, index_name)
                
                overview["indexes"].append({
                    "name": index_name,
                    "document_count": document_count,
                    "max_id": document_max_id
                })
        
        return overview
    
    def get_metadata(self, index_name: str) -> Dict[str, Any]:
        """인덱스 메타데이터 조회"""
        # 기존 get_index_metadata 로직을 클래스 메서드로 변환
        pass
    
    def create_from_template(self, index_name: str, template_type: str) -> bool:
        """템플릿 기반 인덱스 생성"""
        if template_type == "table":
            return self._create_table_index(index_name)
        elif template_type == "column":
            return self._create_column_index(index_name)
        elif template_type == "fewshot":
            return self._create_fewshot_index(index_name)
        else:
            raise ValueError(f"지원하지 않는 템플릿 타입: {template_type}")
    
    def copy_index(self, source_index: str, target_index: str) -> int:
        """인덱스 복사"""
        # 기존 copy_paste_index 로직을 클래스 메서드로 변환
        pass
    
    def delete_index(self, index_name: str) -> bool:
        """인덱스 삭제"""
        # 기존 delete_index 로직을 클래스 메서드로 변환
        pass
    
    def backup_to_gcs(self, index_name: str, bucket_name: str) -> int:
        """GCS 백업"""
        # 기존 load_to_gcs 로직을 클래스 메서드로 변환
        pass
    
    def _should_include_index(self, index_name: str) -> bool:
        """인덱스 포함 여부 판단"""
        exclude_keywords = ['edu', 'open', 'guide', 'test', 'flywheel']
        return not any(keyword in index_name for keyword in exclude_keywords)
    
    def _get_max_id_from_index(self, search_client: SearchClient, index_name: str) -> int:
        """인덱스에서 최대 ID 조회"""
        # 기존 get_max_id_from_index 로직
        pass
```

### 2. 설정 관리 개선

#### 환경별 설정 관리
```python
from dataclasses import dataclass
from typing import Dict, Any, Optional

@dataclass
class AzureSearchConfig:
    """Azure AI Search 설정 관리"""
    service_endpoint: str
    api_key_secret: str
    project_id: str = "55942789702"
    
    @classmethod
    def from_environment(cls, env: str = "dev"):
        """환경별 설정 생성"""
        configs = {
            "dev": {
                "service_endpoint": "https://index-aqua.search.windows.net",
                "api_key_secret": "index-aqua"
            },
            "prod": {
                "service_endpoint": "https://index-aqua-prod.search.windows.net",
                "api_key_secret": "index-aqua-prod"
            }
        }
        
        config = configs.get(env)
        if not config:
            raise ValueError(f"지원하지 않는 환경: {env}")
        
        return cls(**config)

@dataclass
class IndexTemplateConfig:
    """인덱스 템플릿 설정"""
    vector_dimensions: int = 3072
    hnsw_m: int = 4
    hnsw_ef_construction: int = 400
    hnsw_ef_search: int = 500
    batch_size: int = 10
    
    def get_vector_search_config(self) -> VectorSearch:
        """벡터 검색 설정 생성"""
        return VectorSearch(
            algorithms=[
                HnswAlgorithmConfiguration(
                    name="my-hnsw",
                    kind=VectorSearchAlgorithmKind.HNSW,
                    parameters=HnswParameters(
                        m=self.hnsw_m,
                        ef_construction=self.hnsw_ef_construction,
                        ef_search=self.hnsw_ef_search,
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

### 3. 에러 처리 및 로깅 강화

#### 통합 에러 처리
```python
import logging
from functools import wraps
from typing import Callable, Any, Optional
from azure.core.exceptions import ResourceNotFoundError, HttpResponseError

class IndexManagerError(Exception):
    """인덱스 관리 관련 커스텀 예외"""
    pass

def handle_azure_search_errors(func: Callable) -> Callable:
    """Azure Search 관련 에러를 통합 처리하는 데코레이터"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ResourceNotFoundError as e:
            logging.error(f"리소스를 찾을 수 없습니다: {e}")
            raise IndexManagerError(f"리소스 없음: {e}")
        except HttpResponseError as e:
            logging.error(f"HTTP 응답 오류: {e}")
            raise IndexManagerError(f"HTTP 오류: {e}")
        except Exception as e:
            logging.error(f"예상치 못한 오류: {e}")
            raise IndexManagerError(f"시스템 오류: {e}")
    return wrapper

class IndexManagerLogger:
    """인덱스 관리 작업 로깅"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # 파일 핸들러 추가
        file_handler = logging.FileHandler(f'{name}.log')
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
    
    def log_index_operation(self, operation: str, index_name: str, details: Dict[str, Any]):
        """인덱스 작업 로깅"""
        log_data = {
            "operation": operation,
            "index_name": index_name,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.logger.info(json.dumps(log_data, ensure_ascii=False))
    
    def log_backup_operation(self, index_name: str, document_count: int, success: bool):
        """백업 작업 로깅"""
        log_data = {
            "operation": "backup",
            "index_name": index_name,
            "document_count": document_count,
            "success": success,
            "timestamp": datetime.now().isoformat()
        }
        self.logger.info(json.dumps(log_data, ensure_ascii=False))
```

### 4. 성능 최적화

#### 비동기 처리 도입
```python
import asyncio
import aiohttp
from typing import List, Dict, Any

class AsyncIndexManager:
    """비동기 인덱스 관리자"""
    
    def __init__(self, service_endpoint: str, api_key: str):
        self.service_endpoint = service_endpoint
        self.api_key = api_key
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def batch_upload_documents(self, index_name: str, documents: List[Dict[str, Any]], batch_size: int = 100):
        """비동기 배치 업로드"""
        url = f"{self.service_endpoint}/indexes/{index_name}/docs/index"
        headers = {
            "Content-Type": "application/json",
            "api-key": self.api_key
        }
        
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            payload = {"value": batch}
            
            async with self.session.post(url, json=payload, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise IndexManagerError(f"업로드 실패: {error_text}")
                
                result = await response.json()
                print(f"배치 {i//batch_size + 1} 업로드 완료: {len(batch)}개 문서")
    
    async def parallel_backup(self, index_names: List[str], bucket_name: str):
        """여러 인덱스 병렬 백업"""
        tasks = [self.backup_single_index(index_name, bucket_name) for index_name in index_names]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"인덱스 {index_names[i]} 백업 실패: {result}")
            else:
                print(f"인덱스 {index_names[i]} 백업 완료: {result}개 문서")
        
        return results
```

#### 캐싱 시스템
```python
from functools import lru_cache
import redis
import json
from typing import Optional, Dict, Any

class IndexCacheManager:
    """인덱스 메타데이터 캐싱 관리"""
    
    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379):
        self.redis_client = redis.Redis(host=redis_host, port=redis_port, db=0)
        self.cache_ttl = 3600  # 1시간
    
    def cache_index_metadata(self, index_name: str, metadata: Dict[str, Any], ttl: Optional[int] = None):
        """인덱스 메타데이터 캐싱"""
        key = f"index_metadata:{index_name}"
        ttl = ttl or self.cache_ttl
        self.redis_client.setex(key, ttl, json.dumps(metadata))
    
    def get_cached_index_metadata(self, index_name: str) -> Optional[Dict[str, Any]]:
        """캐시된 인덱스 메타데이터 조회"""
        key = f"index_metadata:{index_name}"
        cached = self.redis_client.get(key)
        if cached:
            return json.loads(cached)
        return None
    
    def cache_index_overview(self, overview: Dict[str, Any], ttl: Optional[int] = None):
        """인덱스 개요 캐싱"""
        key = "index_overview"
        ttl = ttl or self.cache_ttl
        self.redis_client.setex(key, ttl, json.dumps(overview))
    
    def get_cached_index_overview(self) -> Optional[Dict[str, Any]]:
        """캐시된 인덱스 개요 조회"""
        key = "index_overview"
        cached = self.redis_client.get(key)
        if cached:
            return json.loads(cached)
        return None
    
    @lru_cache(maxsize=1000)
    def cached_document_count(self, index_name: str) -> int:
        """문서 수 캐싱"""
        # 실제 문서 수 조회 로직
        pass
```

### 5. 테스트 및 검증 시스템

#### 단위 테스트 프레임워크
```python
import unittest
from unittest.mock import Mock, patch, MagicMock
from cookbook.indexing_manager import IndexManager

class TestIndexManager(unittest.TestCase):
    """인덱스 관리자 단위 테스트"""
    
    def setUp(self):
        self.index_manager = IndexManager(
            service_endpoint="https://test.search.windows.net",
            api_key="test-key"
        )
    
    @patch('cookbook.indexing_manager.SearchIndexClient')
    def test_get_overview(self, mock_client):
        """인덱스 개요 조회 테스트"""
        # Mock 설정
        mock_client.return_value.list_index_names.return_value = ["test-index-1", "test-index-2"]
        
        # 테스트 실행
        result = self.index_manager.get_overview()
        
        # 검증
        self.assertIsNotNone(result)
        self.assertEqual(result["total_count"], 2)
        self.assertIn("test-index-1", [idx["name"] for idx in result["indexes"]])
    
    @patch('cookbook.indexing_manager.SearchIndexClient')
    def test_create_table_index(self, mock_client):
        """테이블 인덱스 생성 테스트"""
        # Mock 설정
        mock_index_client = Mock()
        mock_client.return_value = mock_index_client
        
        # 테스트 실행
        result = self.index_manager.create_from_template("test-table", "table")
        
        # 검증
        self.assertTrue(result)
        mock_index_client.create_or_update_index.assert_called_once()
    
    def test_should_include_index(self):
        """인덱스 포함 여부 판단 테스트"""
        # 포함되어야 하는 인덱스
        self.assertTrue(self.index_manager._should_include_index("c360-col-index-dev"))
        self.assertTrue(self.index_manager._should_include_index("csqt-tbl-index-prod"))
        
        # 제외되어야 하는 인덱스
        self.assertFalse(self.index_manager._should_include_index("test-col-index-dev"))
        self.assertFalse(self.index_manager._should_include_index("edu-fewshot-index"))
        self.assertFalse(self.index_manager._should_include_index("open-tbl-index"))
```

#### 통합 테스트
```python
class TestIndexManagerIntegration(unittest.TestCase):
    """인덱스 관리자 통합 테스트"""
    
    def setUp(self):
        self.test_index_name = "test-cookbook-integration"
        self.index_manager = IndexManager(
            service_endpoint="https://index-aqua.search.windows.net",
            api_key=secret_manage('index-aqua')
        )
    
    def tearDown(self):
        # 테스트 후 정리
        try:
            self.index_manager.delete_index(self.test_index_name)
        except:
            pass
    
    def test_full_index_lifecycle(self):
        """인덱스 전체 생명주기 테스트"""
        # 1. 인덱스 생성
        self.index_manager.create_from_template(self.test_index_name, "table")
        
        # 2. 메타데이터 조회
        metadata = self.index_manager.get_metadata(self.test_index_name)
        self.assertIsNotNone(metadata)
        self.assertEqual(metadata["index_name"], self.test_index_name)
        
        # 3. 데이터 업로드 (실제 구현 필요)
        test_documents = [
            {
                "id": "1",
                "TBL_LOGI_NM": "테스트 테이블",
                "TBL_DESCR": "테스트용 테이블입니다"
            }
        ]
        # upload_documents 메서드 구현 필요
        
        # 4. 백업 테스트
        document_count = self.index_manager.backup_to_gcs(self.test_index_name, "test-bucket")
        self.assertGreaterEqual(document_count, 0)
        
        # 5. 인덱스 삭제
        result = self.index_manager.delete_index(self.test_index_name)
        self.assertTrue(result)
```

## 학습 내용

### 기술적 인사이트

#### 1. 재사용 가능한 코드의 중요성
- **DRY 원칙**: Don't Repeat Yourself - 동일한 Azure Search 작업의 반복을 피하고 함수화
- **템플릿 패턴**: 테이블, 컬럼, Few-shot 인덱스의 공통 구조를 템플릿으로 만들어 일관성 확보
- **모듈화**: 기능별로 분리하여 독립적인 테스트와 유지보수 가능

#### 2. Azure AI Search 관리의 복잡성
- **스키마 관리**: 필드 타입, 검색 가능 여부, 벡터 설정 등 복잡한 구성 요소들
- **데이터 동기화**: 개발/운영 환경 간 인덱스 동기화의 중요성과 복잡성
- **성능 최적화**: 배치 처리, 캐싱, 비동기 처리 등을 통한 효율성 향상

#### 3. 자동화의 가치
- **백업 자동화**: 정기적인 데이터 백업으로 데이터 손실 방지
- **환경 동기화**: 개발/운영 환경 간 자동 동기화로 일관성 확보
- **모니터링**: 전체 인덱스 현황을 한눈에 파악할 수 있는 시스템

### 비즈니스 가치

#### 1. 개발 생산성 향상
- **빠른 프로토타이핑**: 재사용 가능한 함수로 신속한 인덱스 관리
- **일관된 품질**: 표준화된 템플릿으로 인덱스 품질 향상
- **학습 비용 절감**: 복잡한 Azure Search API 사용법을 추상화

#### 2. 운영 효율성 증대
- **자동화된 관리**: 반복 작업의 자동화로 인력 절약
- **중앙화된 관리**: 모든 인덱스 작업을 하나의 시스템에서 관리
- **모니터링 강화**: 체계적인 로깅과 모니터링으로 문제 조기 발견

#### 3. 확장성과 유지보수성
- **모듈화된 구조**: 기능별 분리로 독립적인 개발 및 배포
- **테스트 가능성**: 단위 테스트와 통합 테스트를 통한 품질 보장
- **설정 관리**: 중앙화된 설정으로 환경별 관리 용이

### 향후 발전 방향

#### 1. 고도화된 자동화
- **CI/CD 통합**: GitHub Actions를 활용한 자동 배포
- **인프라 as Code**: Terraform을 활용한 인프라 자동화
- **모니터링 대시보드**: Grafana를 활용한 실시간 모니터링

#### 2. AI 기능 강화
- **자동 스키마 추론**: 데이터만으로 인덱스 스키마 자동 생성
- **품질 평가**: AI를 활용한 인덱스 품질 자동 평가
- **최적화 제안**: 성능 분석을 통한 자동 최적화 제안

#### 3. 사용자 경험 개선
- **웹 인터페이스**: Streamlit을 활용한 관리 대시보드
- **API 문서화**: FastAPI를 활용한 자동 API 문서 생성
- **대화형 도움말**: 챗봇을 활용한 사용법 안내

이 인덱싱 쿡북을 통해 Azure AI Search 인덱스의 전체 생명주기를 효율적으로 관리할 수 있습니다. 특히 재사용 가능한 함수들과 표준화된 템플릿을 제공함으로써 개발자들이 복잡한 인덱스 관리 작업에 신경 쓰지 않고 비즈니스 로직에 집중할 수 있도록 도와줍니다.
