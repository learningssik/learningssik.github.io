---
layout: post
title: "Text-to-SQL 정확도 향상을 위한 메타데이터 검색 품질 검증 자동화"
date: 2025-11-27 11:26:28 +0900
categories: tech
tags: [Azure AI Search, Text-to-SQL, RAG, 메타데이터 검색, 자동화 테스트, MRR, Recall]
excerpt: "RAG 기반 Text-to-SQL 시스템에서 LLM에게 정확한 테이블과 컬럼 정보를 제공하기 위한 메타데이터 검색 품질 검증 자동화 파이프라인 구축 과정을 공유합니다."
---

블로그나 포트폴리오에 그대로 사용하실 수 있도록, **배경 설명부터 논리적 설계, 코드, 결과 해석**까지 체계적으로 정리한 최종 Markdown 파일입니다.

---

# [Azure AI Search] Text-to-SQL 정확도 향상을 위한 메타데이터 검색 품질 검증 자동화

RAG(Retrieval-Augmented Generation) 기반의 Text-to-SQL 시스템을 구축할 때 가장 큰 난관은 **"LLM에게 얼마나 정확한 테이블과 컬럼 정보를 제공하는가"**입니다. 검색 단계에서 필요한 컬럼이 누락되면, 아무리 뛰어난 LLM이라도 올바른 SQL을 작성할 수 없습니다.

본 포스팅에서는 Azure AI Search의 다양한 기능(Vector, Semantic, Scoring Profile)을 조합하여 최적의 검색 성능을 찾기 위한 **자동화 테스트 파이프라인 구축 과정**을 공유합니다.

---

## 1. 테스트 전략: 두 가지 검색 목적의 분리

우리가 구축한 메타데이터 검색 엔진은 두 가지 서로 다른 목적을 동시에 충족해야 합니다. 이에 따라 **평가 기준(Top-K)**과 **처리 로직**을 이원화했습니다.

| 구분 | **1. 테이블 검색 (Lookup)** | **2. 컬럼 검색 (Text-to-SQL)** |
| :--- | :--- | :--- |
| **사용자 질문** | "매출 집계 테이블 찾아줘" | "고객별 최근 3개월 주문 총액 SQL 짜줘" |
| **검색 목적** | 정확한 대상 하나를 찾는 것 | SQL 작성에 필요한 **모든 재료(컬럼)**를 모으는 것 |
| **평가 범위** | **Top 5** (상위 5개) | **Top 30** (상위 30개) |
| **핵심 지표** | **MRR** (1등이 정확한가?) | **Recall** (빠짐없이 가져왔는가?) |
| **후처리 로직** | **중복 제거 (Deduplication)**<br>*(동일 테이블의 여러 컬럼이 나와도 1개로 압축)* | **중복 제거 없음**<br>*(필요한 컬럼은 모두 후보에 포함)* |

---

## 2. 핵심 측정 지표 (Metrics)

### ① Recall (재현율) - [Text-to-SQL 핵심]
*   **정의:** 정답으로 나와야 할 컬럼이 10개라면, 검색 결과(Top 30) 안에 그중 몇 개가 포함되었는가?
*   **목표:** **0.9 이상** (LLM에게 필요한 재료를 90% 이상 전달해야 함)

### ② MRR (Mean Reciprocal Rank) - [검색 정확도 핵심]
*   **정의:** 가장 관련성 높은 첫 번째 정답이 몇 번째 순위에 등장했는가?
*   **목표:** **0.8 이상** (최소 1~2위 내 등극)

---

## 3. 정답 데이터셋 구성 (`test_dataset.json`)

- 테스트를 위해 질문과 정답을 정의한 `Golden Dataset`을 작성합니다.
- 테스트 데이터셋은 expected_meta 필드 하나로 통합하여 관리합니다.
검색 유형(`type`)에 따라 정답을 판별하는 필드가 다르므로 주의해야 합니다.

*   **`컬럼 검색 (type: column)`**: t(테이블), c(컬럼) 모두 작성.
*   **`테이블 검색 (type: table)`**: t(테이블)만 작성.
*   **`필터링 (tbl)`**: 특정 테이블 내에서 검색해야 할 경우 작성, 아니면 빈 값.

```json
[
  {
    "query": "ENTR_TRM_SGMT_NM 컬럼 있는 테이블 찾아줘",
    "type": "column",
    "expected_meta": [
      {"t": "SAMPLE_TABLE_1", "c": "ENTR_TRM_SGMT_NM"}
    ],
    "tbl": "",
    "note": "[Lookup] 특정 컬럼을 보유한 테이블 찾기 (필터 없음)"
  },
  {
    "query": "신규 요금제 가입자 수",
    "type": "column",
    "expected_meta": [
      {"t": "SAMPLE_TABLE_1", "c": "ENTR_NO"},
      {"t": "SAMPLE_TABLE_1", "c": "P_YYYYMM"},
      {"t": "SAMPLE_TABLE_1", "c": "BGN_YN"},
      {"t": "SAMPLE_TABLE_1", "c": "PP_SALE_STRT_DT"}
    ],
    "tbl": "SAMPLE_TABLE_2",
    "note": "[Text-to-SQL] 특정 테이블(tbl) 내에서 SQL용 컬럼 찾기"
  },
  {
    "query": "해지자 확인할 수 있는 테이블 찾아줘",
    "type": "table",
    "expected_meta": [
      {"t": "SAMPLE_TABLE_3"}
    ],
    "tbl": "",
    "note": "[Table Search] 테이블 메타 검색 (테이블명만 정답 체크)"
  }
]
```

---

## 4. 자동화 테스트 스크립트 (`run_test_scenarios.py`)

- 이 스크립트는 **12가지 하이브리드 검색 시나리오**를 자동으로 순회하며 성능을 측정합니다.
- expected_meta 구조를 해석하고, 테이블/컬럼 검색 로직을 분기 처리하는 최종 스크립트입니다.

**[주요 로직]**
1.  **테이블 검색 시 Fetch 전략:** API에서는 `Top 50`으로 넉넉하게 가져온 뒤, 파이썬에서 **중복 테이블을 제거**하고 최종적으로 `Top 5`만 남겨서 평가합니다.
2.  **필터링 자동 적용:** 데이터셋에 `tbl` 값이 있으면 자동으로 OData Filter를 생성합니다.

``` python
import json
import statistics
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.models import VectorizedQuery

# ================= 설정 (Configuration) =================
ENDPOINT = "https://your-search-service.search.windows.net"
API_KEY = "your-api-key"
INDEX_NAME = "your-index-name"
DATASET_FILE = "test_dataset.json"

# 평가 기준 (Top K)
TOP_K_TABLE = 5      # 테이블 검색 평가 범위
TOP_K_COLUMN = 30    # 컬럼 검색 평가 범위
# ======================================================

def get_embedding(text):
    # [TODO] OpenAI Embedding API 연결 필요
    return [0.01] * 3072 

def calculate_metrics(results, dataset_item):
    """
    검색 결과(results)와 정답(expected_meta)을 비교하여 지표 계산
    """
    q_type = dataset_item.get('type', 'column')
    raw_expected = dataset_item.get('expected_meta', [])
    
    # 1. 정답 셋(Set) 및 결과 키(Key) 구성
    if q_type == 'table':
        # [테이블 검색] 't' 값만 추출하여 비교
        expected_set = set(item['t'] for item in raw_expected)
        result_keys = [r.get('TBL_PHYS_NM') for r in results]
    else:
        # [컬럼 검색] ('t', 'c') 튜플로 비교
        expected_set = set((item['t'], item['c']) for item in raw_expected)
        result_keys = [(r.get('TBL_PHYS_NM'), r.get('ATTR_PHYS_NM')) for r in results]

    if not expected_set: return 0.0, 0.0, False

    # 2. MRR (Mean Reciprocal Rank)
    first_rank = 0
    for rank, key in enumerate(result_keys, 1):
        if key in expected_set:
            first_rank = rank
            break
    mrr = 1.0 / first_rank if first_rank > 0 else 0.0
    
    # 3. Recall (재현율)
    found_count = sum(1 for key in result_keys if key in expected_set)
    recall = found_count / len(expected_set)
    
    return mrr, recall, (found_count > 0)

def deduplicate_tables(results):
    """
    [테이블 검색 전용] 동일 테이블 중복 제거
    """
    seen_tables = set()
    unique_results = []
    for r in results:
        t_name = r.get('TBL_PHYS_NM')
        if t_name and t_name not in seen_tables:
            unique_results.append(r)
            seen_tables.add(t_name)
    return unique_results

def build_search_params(scenario, query, q_type, tbl_filter=None, fetch_k=30):
    params = {"search_text": query, "top": fetch_k, "include_total_count": True}
    
    # 1. 필드 제한
    f_descr = ["TBL_LOGI_NM", "TBL_PHYS_NM", "TBL_DESCR"] if q_type == 'table' else ["ATTR_LOGI_NM", "ATTR_PHYS_NM", "ATTR_DESCR"]
    f_tag = ["TBL_LOGI_NM", "TBL_PHYS_NM", "TBL_DESCR"] if q_type == 'table' else ["ATTR_LOGI_NM", "ATTR_PHYS_NM", "ATTR_TAG"]
    
    if scenario in [2, 4, 5, 6, 9, 10, 11, 12]: params["search_fields"] = f_descr
    elif scenario == 3: params["search_fields"] = f_tag
    
    # 2. 필터 (tbl 값이 있으면 적용)
    if tbl_filter and tbl_filter.strip():
        params["filter"] = f"TBL_PHYS_NM eq '{tbl_filter.strip()}'"

    # 3. Scoring Profile
    if scenario in [4, 6, 10, 12]:
        params["scoring_profile"] = "table-scoring-profile" if q_type == 'table' else "column-scoring-profile"
        
    # 4. Semantic Search
    if scenario in [5, 6, 7, 11, 12]:
        params["query_type"] = "semantic"
        params["semantic_configuration_name"] = "table-semantic-config" if q_type == 'table' else "column-semantic-config"
        
    # 5. Vector Search
    if scenario in [8, 9, 10, 11, 12]:
        vec_field = "TBL_LOGI_NM_VECTOR" if q_type == 'table' else "ATTR_LOGI_NM_VECTOR"
        vector = get_embedding(query)
        params["vector_queries"] = [VectorizedQuery(vector=vector, k_nearest_neighbors=fetch_k, fields=vec_field)]
        if scenario == 8: params["search_text"] = None

    return params

def run_all_tests():
    try:
        with open(DATASET_FILE, 'r', encoding='utf-8') as f: dataset = json.load(f)
    except FileNotFoundError: return print("Error: 데이터셋 파일이 없습니다.")
    
    client = SearchClient(ENDPOINT, INDEX_NAME, AzureKeyCredential(API_KEY))
    
    scenarios = {
        1: "Text(All)", 2: "Text(Descr)", 3: "Text(Tag)", 
        4: "Text(Descr)+Profile", 5: "Text(Descr)+Sem", 6: "Text(Descr+Prof)+Sem", 
        7: "Semantic Only", 8: "Vector Only", 
        9: "Text(Descr)+Vec", 10: "Text(Descr+Prof)+Vec", 
        11: "Text(Descr)+Sem+Vec", 12: "Hybrid(Full Spec)"
    }
    
    print(f"{'Scenario':<25} | {'MRR':<6} | {'Recall':<6} | {'Hit Rate':<8}")
    print("-" * 60)
    
    for s_id in range(1, 13):
        scores_mrr, scores_recall, hits = [], [], 0
        
        for item in dataset:
            try:
                q_type = item.get('type', 'column')
                tbl_val = item.get('tbl', '')
                
                # [설정] 조회 개수 및 평가 개수 설정
                if q_type == 'table':
                    target_k = TOP_K_TABLE
                    fetch_k = 50 
                else:
                    target_k = TOP_K_COLUMN
                    fetch_k = 30
                
                # 1. 검색
                params = build_search_params(s_id, item['query'], q_type, tbl_val, fetch_k)
                raw_results = list(client.search(**params))
                
                # 2. 후처리 (테이블 중복 제거)
                if q_type == 'table':
                    processed = deduplicate_tables(raw_results)
                else:
                    processed = raw_results
                
                final_results = processed[:target_k]

                # 3. 지표 계산 (expected_meta 활용)
                mrr, recall, is_hit = calculate_metrics(final_results, item)
                scores_mrr.append(mrr)
                scores_recall.append(recall)
                if is_hit: hits += 1
                
            except Exception: 
                scores_mrr.append(0); scores_recall.append(0)
            
        avg_mrr = statistics.mean(scores_mrr) if scores_mrr else 0
        avg_recall = statistics.mean(scores_recall) if scores_recall else 0
        hit_rate = (hits / len(dataset)) * 100
        
        print(f"#{s_id:<2} {scenarios[s_id]:<21} | {avg_mrr:.3f}  | {avg_recall:.3f}   | {hit_rate:.1f}%")

if __name__ == "__main__":
    run_all_tests()
```

---

## 5. 결과 분석 및 활용 가이드

테스트 실행 결과는 아래와 같은 형태로 출력됩니다.

```text
Scenario                  | MRR    | Recall | Hit Rate
------------------------------------------------------------
#1  Text(All)             | 0.450  | 0.300  | 40.0%
#4  Text(Descr)+Profile   | 0.750  | 0.550  | 70.0%
#12 Hybrid(Full Spec)     | 0.920  | 0.950  | 98.0%
```

### 결과 해석
1.  **MRR이 낮다?** → 사용자가 원하는 테이블을 바로 찾지 못함. **Scoring Profile** 가중치를 조절하세요.
2.  **Recall이 낮다?** → Text-to-SQL 재료가 누락됨. **Semantic Search**나 **Vector Search** 비중을 높이세요.
3.  **최종 목표:** 일반적으로 `#12 Hybrid(Full Spec)` 시나리오에서 **MRR 0.8 이상, Recall 0.9 이상**을 달성하는 것이 이상적입니다.

이 테스트 파이프라인을 통해, 우리는 감에 의존하지 않고 **데이터에 기반하여 검색 엔진을 지속적으로 개선**할 수 있는 환경을 마련했습니다.