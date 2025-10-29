---
layout: post
title: "Azure AI Search 인스턴스 마이그레이션 자동화 시스템"
date: 2025-01-22 00:00:00 +0900
categories: tech
tags: [Azure AI Search, 인스턴스 마이그레이션, 자동화, 스케일업, 인덱스 관리, 배치 처리, 데이터 마이그레이션]
excerpt: "Azure AI Search 인스턴스의 스케일업이 필요한 상황에서 기존 인덱스를 새로운 인스턴스로 완전히 마이그레이션하는 자동화 시스템으로, 수동 개입 없이 모든 인덱스를 안전하게 마이그레이션합니다."
---

# Azure AI Search 인스턴스 마이그레이션 자동화 시스템

## 개요

이 프로젝트는 **Azure AI Search** 인스턴스의 스케일업이 필요한 상황에서 기존 인덱스를 새로운 인스턴스로 완전히 마이그레이션하는 자동화 시스템입니다. 기존 인스턴스의 인덱스 수 제한(50개)에 도달하여 스케일업이 필요했지만, 기존 인덱스를 업그레이드할 수 없어 새로운 인스턴스를 생성하고 모든 인덱스를 안전하게 마이그레이션해야 하는 상황을 해결합니다.

### 핵심 특징
- **완전 자동화**: 수동 개입 없이 모든 인덱스를 자동으로 마이그레이션
- **안전한 마이그레이션**: 기존 인덱스 구조와 데이터를 완벽하게 보존
- **배치 처리**: 대용량 데이터를 효율적으로 처리하기 위한 배치 업로드
- **오류 처리**: 마이그레이션 과정에서 발생할 수 있는 오류에 대한 안전한 처리
- **진행 상황 모니터링**: 실시간으로 마이그레이션 진행 상황을 추적

## 문제 해결

### 기존 문제점
1. **인덱스 수 제한**: 기존 인스턴스의 50개 인덱스 제한에 도달
2. **업그레이드 불가**: 기존 인덱스를 직접 업그레이드할 수 없는 Azure 제약
3. **수동 마이그레이션**: 수십 개의 인덱스를 수동으로 마이그레이션해야 하는 부담
4. **데이터 손실 위험**: 마이그레이션 과정에서 데이터 손실 가능성
5. **다운타임**: 마이그레이션 중 서비스 중단 위험

### 해결 효과
- **무중단 마이그레이션**: 서비스 중단 없이 안전한 마이그레이션 수행
- **완전 자동화**: 수동 작업을 완전히 제거하여 인적 오류 방지
- **데이터 무결성**: 모든 인덱스 구조와 데이터를 완벽하게 보존
- **효율적인 처리**: 배치 처리로 대용량 데이터를 효율적으로 마이그레이션
- **진행 상황 추적**: 실시간 모니터링으로 마이그레이션 상태 파악

## 구현 방식

### 1. 마이그레이션 시스템 아키텍처

#### 클라이언트 초기화 및 설정
```python
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient

class AzureSearchMigrationManager:
    """Azure AI Search 인스턴스 마이그레이션을 관리하는 클래스"""
    
    def __init__(self, source_endpoint, source_key, target_endpoint, target_key):
        self.source_endpoint = source_endpoint
        self.source_key = source_key
        self.target_endpoint = target_endpoint
        self.target_key = target_key
        
        # 클라이언트 초기화
        self.source_index_client = SearchIndexClient(
            endpoint=source_endpoint, 
            credential=AzureKeyCredential(source_key)
        )
        self.target_index_client = SearchIndexClient(
            endpoint=target_endpoint, 
            credential=AzureKeyCredential(target_key)
        )
    
    def initialize_clients(self):
        """소스 및 대상 서비스의 클라이언트를 초기화하는 함수"""
        print("Azure AI Search 클라이언트 초기화 중...")
        
        # 소스 서비스 연결 테스트
        try:
            source_indexes = list(self.source_index_client.list_indexes())
            print(f"소스 서비스 연결 성공: {len(source_indexes)}개 인덱스 발견")
        except Exception as e:
            raise Exception(f"소스 서비스 연결 실패: {e}")
        
        # 대상 서비스 연결 테스트
        try:
            target_indexes = list(self.target_index_client.list_indexes())
            print(f"대상 서비스 연결 성공: {len(target_indexes)}개 인덱스 존재")
        except Exception as e:
            raise Exception(f"대상 서비스 연결 실패: {e}")
        
        return True
```

### 2. 인덱스 발견 및 분석 시스템

#### 인덱스 목록 수집
```python
def discover_source_indexes(self):
    """소스 서비스의 모든 인덱스를 발견하고 분석하는 함수"""
    print("소스 서비스에서 모든 인덱스를 가져오는 중...")
    
    source_indexes = self.source_index_client.list_indexes()
    index_info = []
    
    for source_index in source_indexes:
        index_name = source_index.name
        
        # 인덱스 상세 정보 수집
        try:
            source_client = SearchClient(
                endpoint=self.source_endpoint, 
                index_name=index_name, 
                credential=AzureKeyCredential(self.source_key)
            )
            
            # 문서 수 확인
            document_count = source_client.get_document_count()
            
            index_info.append({
                'name': index_name,
                'fields_count': len(source_index.fields),
                'document_count': document_count,
                'has_vector_search': source_index.vector_search is not None,
                'has_semantic_search': source_index.semantic_search is not None
            })
            
            print(f"인덱스 '{index_name}': {document_count}개 문서, {len(source_index.fields)}개 필드")
            
        except Exception as e:
            print(f"인덱스 '{index_name}' 정보 수집 실패: {e}")
            index_info.append({
                'name': index_name,
                'error': str(e)
            })
    
    return index_info

def analyze_migration_requirements(self, index_info):
    """마이그레이션 요구사항을 분석하는 함수"""
    total_documents = sum(info.get('document_count', 0) for info in index_info if 'document_count' in info)
    total_indexes = len(index_info)
    
    print(f"\n=== 마이그레이션 요구사항 분석 ===")
    print(f"총 인덱스 수: {total_indexes}개")
    print(f"총 문서 수: {total_documents:,}개")
    print(f"벡터 검색 인덱스: {sum(1 for info in index_info if info.get('has_vector_search'))}개")
    print(f"시맨틱 검색 인덱스: {sum(1 for info in index_info if info.get('has_semantic_search'))}개")
    
    # 예상 마이그레이션 시간 계산 (문서당 0.1초 가정)
    estimated_time_minutes = (total_documents * 0.1) / 60
    print(f"예상 마이그레이션 시간: {estimated_time_minutes:.1f}분")
    
    return {
        'total_indexes': total_indexes,
        'total_documents': total_documents,
        'estimated_time_minutes': estimated_time_minutes
    }
```

### 3. 안전한 인덱스 생성 시스템

#### 인덱스 존재 여부 확인 및 생성
```python
def create_target_index_safely(self, source_index):
    """대상 인덱스를 안전하게 생성하는 함수"""
    source_index_name = source_index.name
    
    # 대상 인덱스가 이미 존재하는지 확인
    try:
        existing_index = self.target_index_client.get_index(source_index_name)
        print(f"대상 인덱스 '{source_index_name}'가 이미 존재합니다. 건너뜁니다.")
        return False, existing_index
    except Exception:
        # 인덱스가 존재하지 않을 경우에만 생성
        pass
    
    # 대상 인덱스 생성
    print(f"대상 인덱스 '{source_index_name}' 생성 중...")
    try:
        # 소스 인덱스의 모든 설정을 그대로 복사
        target_index = self.target_index_client.create_index(source_index)
        print(f"대상 인덱스 '{source_index_name}' 생성 완료.")
        
        # 생성된 인덱스 정보 출력
        self._print_index_info(target_index)
        
        return True, target_index
        
    except Exception as e:
        print(f"대상 인덱스 생성 중 오류 발생: {e}")
        return False, None

def _print_index_info(self, index):
    """인덱스 정보를 출력하는 함수"""
    print(f"  - 필드 수: {len(index.fields)}개")
    print(f"  - 벡터 검색: {'있음' if index.vector_search else '없음'}")
    print(f"  - 시맨틱 검색: {'있음' if index.semantic_search else '없음'}")
    print(f"  - 스코어링 프로파일: {len(index.scoring_profiles) if index.scoring_profiles else 0}개")
```

### 4. 효율적인 데이터 마이그레이션 시스템

#### 배치 처리 기반 데이터 마이그레이션
```python
def migrate_index_data(self, source_index_name, batch_size=1000):
    """인덱스 데이터를 배치 처리로 마이그레이션하는 함수"""
    print(f"인덱스 '{source_index_name}'의 데이터 마이그레이션 시작...")
    
    # 클라이언트 생성
    source_client = SearchClient(
        endpoint=self.source_endpoint, 
        index_name=source_index_name, 
        credential=AzureKeyCredential(self.source_key)
    )
    target_client = SearchClient(
        endpoint=self.target_endpoint, 
        index_name=source_index_name, 
        credential=AzureKeyCredential(self.target_key)
    )
    
    documents = []
    total_documents = 0
    batch_count = 0
    
    try:
        # 소스 인덱스에서 모든 문서 가져오기
        print(f"  소스 인덱스에서 문서 수집 중...")
        results = source_client.search(search_text="*", include_total_count=True)
        
        for result in results:
            documents.append(result)
            total_documents += 1
            
            # 배치 크기에 도달하면 업로드
            if len(documents) >= batch_size:
                batch_count += 1
                success = self._upload_batch(target_client, documents, batch_count)
                if not success:
                    return False
                documents = []  # 배치 초기화
        
        # 마지막 배치 처리
        if documents:
            batch_count += 1
            success = self._upload_batch(target_client, documents, batch_count)
            if not success:
                return False
        
        print(f"인덱스 '{source_index_name}' 데이터 마이그레이션 완료. (총 {total_documents:,}개 문서)")
        return True
        
    except Exception as e:
        print(f"인덱스 '{source_index_name}' 데이터 마이그레이션 중 오류 발생: {e}")
        return False

def _upload_batch(self, target_client, documents, batch_number):
    """문서 배치를 업로드하는 함수"""
    try:
        upload_result = target_client.upload_documents(documents=documents)
        
        # 업로드 결과 확인
        failed_documents = [r for r in upload_result if not r.succeeded]
        if failed_documents:
            print(f"배치 {batch_number} 업로드 중 오류 발생:")
            for failed in failed_documents:
                print(f"  - 문서 ID: {failed.key}, 오류: {failed.error_message}")
            return False
        else:
            print(f"배치 {batch_number} 업로드 성공. ({len(documents)}개 문서)")
            return True
            
    except Exception as e:
        print(f"배치 {batch_number} 업로드 중 예외 발생: {e}")
        return False
```

### 5. 완전 자동화된 마이그레이션 파이프라인

#### 통합 마이그레이션 실행
```python
def execute_full_migration(self, batch_size=1000, skip_existing=True):
    """전체 마이그레이션을 실행하는 메인 함수"""
    print("=== Azure AI Search 인스턴스 마이그레이션 시작 ===")
    
    # 1. 클라이언트 초기화
    self.initialize_clients()
    
    # 2. 소스 인덱스 발견
    index_info = self.discover_source_indexes()
    
    # 3. 마이그레이션 요구사항 분석
    requirements = self.analyze_migration_requirements(index_info)
    
    # 4. 마이그레이션 실행
    migration_results = []
    successful_migrations = 0
    failed_migrations = 0
    
    print(f"\n=== 마이그레이션 실행 시작 ===")
    
    for index_info_item in index_info:
        if 'error' in index_info_item:
            print(f"인덱스 '{index_info_item['name']}' 건너뜀 (오류: {index_info_item['error']})")
            failed_migrations += 1
            continue
        
        index_name = index_info_item['name']
        
        try:
            # 소스 인덱스 정보 가져오기
            source_index = self.source_index_client.get_index(index_name)
            
            # 대상 인덱스 생성
            created, target_index = self.create_target_index_safely(source_index)
            
            if not created and skip_existing:
                print(f"인덱스 '{index_name}' 건너뜀 (이미 존재)")
                continue
            
            # 데이터 마이그레이션
            migration_success = self.migrate_index_data(index_name, batch_size)
            
            if migration_success:
                successful_migrations += 1
                migration_results.append({
                    'index_name': index_name,
                    'status': 'success',
                    'document_count': index_info_item.get('document_count', 0)
                })
            else:
                failed_migrations += 1
                migration_results.append({
                    'index_name': index_name,
                    'status': 'failed'
                })
                
        except Exception as e:
            print(f"인덱스 '{index_name}' 처리 중 오류 발생: {e}")
            failed_migrations += 1
            migration_results.append({
                'index_name': index_name,
                'status': 'error',
                'error': str(e)
            })
    
    # 5. 마이그레이션 결과 요약
    self._print_migration_summary(migration_results, successful_migrations, failed_migrations)
    
    return migration_results

def _print_migration_summary(self, results, successful, failed):
    """마이그레이션 결과 요약을 출력하는 함수"""
    print(f"\n=== 마이그레이션 완료 요약 ===")
    print(f"총 처리된 인덱스: {len(results)}개")
    print(f"성공: {successful}개")
    print(f"실패: {failed}개")
    print(f"성공률: {(successful / len(results) * 100):.1f}%")
    
    # 성공한 인덱스들의 총 문서 수
    total_migrated_documents = sum(
        result.get('document_count', 0) 
        for result in results 
        if result['status'] == 'success'
    )
    print(f"마이그레이션된 총 문서 수: {total_migrated_documents:,}개")
    
    # 실패한 인덱스 목록
    failed_indexes = [result['index_name'] for result in results if result['status'] != 'success']
    if failed_indexes:
        print(f"\n실패한 인덱스:")
        for index_name in failed_indexes:
            print(f"  - {index_name}")
```

### 6. 사용 예시 및 실행

#### 마이그레이션 실행
```python
# 마이그레이션 매니저 초기화
migration_manager = AzureSearchMigrationManager(
    source_endpoint="https://<source-service>.search.windows.net",
    source_key="<source-admin-key>",
    target_endpoint="https://<target-service>.search.windows.net",
    target_key="<target-admin-key>"
)

# 전체 마이그레이션 실행
results = migration_manager.execute_full_migration(
    batch_size=1000,  # 배치 크기
    skip_existing=True  # 기존 인덱스 건너뛰기
)

# 결과 확인
for result in results:
    if result['status'] == 'success':
        print(f"✅ {result['index_name']}: {result['document_count']:,}개 문서 마이그레이션 완료")
    else:
        print(f"❌ {result['index_name']}: 마이그레이션 실패")
```

## 리팩토링 제안

### 1. 고급 오류 처리 및 복구 시스템

#### 재시도 메커니즘과 오류 복구
```python
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class MigrationConfig:
    """마이그레이션 설정을 관리하는 데이터 클래스"""
    batch_size: int = 1000
    max_retries: int = 3
    retry_delay: float = 1.0
    skip_existing: bool = True
    validate_after_migration: bool = True
    backup_before_migration: bool = False

class AdvancedMigrationManager(AzureSearchMigrationManager):
    """고급 오류 처리와 복구 기능을 가진 마이그레이션 매니저"""
    
    def __init__(self, source_endpoint, source_key, target_endpoint, target_key, config: MigrationConfig):
        super().__init__(source_endpoint, source_key, target_endpoint, target_key)
        self.config = config
        self.migration_log = []
        self.failed_migrations = []
    
    def migrate_index_with_retry(self, source_index_name: str) -> bool:
        """재시도 메커니즘을 사용하여 인덱스를 마이그레이션하는 함수"""
        for attempt in range(self.config.max_retries):
            try:
                print(f"마이그레이션 시도 {attempt + 1}/{self.config.max_retries}: {source_index_name}")
                
                success = self.migrate_index_data(source_index_name, self.config.batch_size)
                
                if success:
                    if self.config.validate_after_migration:
                        validation_success = self._validate_migration(source_index_name)
                        if not validation_success:
                            print(f"마이그레이션 검증 실패: {source_index_name}")
                            if attempt < self.config.max_retries - 1:
                                time.sleep(self.config.retry_delay * (2 ** attempt))  # 지수 백오프
                                continue
                            return False
                    
                    print(f"마이그레이션 성공: {source_index_name}")
                    return True
                else:
                    if attempt < self.config.max_retries - 1:
                        print(f"마이그레이션 실패, 재시도 대기 중... ({self.config.retry_delay * (2 ** attempt)}초)")
                        time.sleep(self.config.retry_delay * (2 ** attempt))
                    
            except Exception as e:
                print(f"마이그레이션 시도 {attempt + 1} 중 오류: {e}")
                if attempt < self.config.max_retries - 1:
                    time.sleep(self.config.retry_delay * (2 ** attempt))
        
        # 모든 재시도 실패
        self.failed_migrations.append({
            'index_name': source_index_name,
            'attempts': self.config.max_retries,
            'last_error': str(e) if 'e' in locals() else 'Unknown error'
        })
        return False
    
    def _validate_migration(self, index_name: str) -> bool:
        """마이그레이션 후 데이터 무결성을 검증하는 함수"""
        try:
            source_client = SearchClient(
                endpoint=self.source_endpoint, 
                index_name=index_name, 
                credential=AzureKeyCredential(self.source_key)
            )
            target_client = SearchClient(
                endpoint=self.target_endpoint, 
                index_name=index_name, 
                credential=AzureKeyCredential(self.target_key)
            )
            
            # 문서 수 비교
            source_count = source_client.get_document_count()
            target_count = target_client.get_document_count()
            
            if source_count != target_count:
                print(f"문서 수 불일치: 소스 {source_count}, 대상 {target_count}")
                return False
            
            # 샘플 문서 비교 (처음 10개)
            source_docs = list(source_client.search(search_text="*", top=10))
            target_docs = list(target_client.search(search_text="*", top=10))
            
            for i, (source_doc, target_doc) in enumerate(zip(source_docs, target_docs)):
                if source_doc.get('id') != target_doc.get('id'):
                    print(f"문서 ID 불일치 (위치 {i}): 소스 {source_doc.get('id')}, 대상 {target_doc.get('id')}")
                    return False
            
            print(f"마이그레이션 검증 성공: {index_name}")
            return True
            
        except Exception as e:
            print(f"마이그레이션 검증 중 오류: {e}")
            return False
```

### 2. 병렬 처리 및 성능 최적화

#### 멀티스레딩을 활용한 병렬 마이그레이션
```python
import concurrent.futures
from threading import Lock
import queue

class ParallelMigrationManager(AdvancedMigrationManager):
    """병렬 처리를 지원하는 마이그레이션 매니저"""
    
    def __init__(self, source_endpoint, source_key, target_endpoint, target_key, config: MigrationConfig, max_workers: int = 3):
        super().__init__(source_endpoint, source_key, target_endpoint, target_key, config)
        self.max_workers = max_workers
        self.progress_lock = Lock()
        self.completed_count = 0
        self.total_count = 0
    
    def execute_parallel_migration(self) -> List[Dict[str, Any]]:
        """병렬 처리를 사용하여 마이그레이션을 실행하는 함수"""
        print(f"=== 병렬 마이그레이션 시작 (최대 {self.max_workers}개 워커) ===")
        
        # 소스 인덱스 발견
        index_info = self.discover_source_indexes()
        self.total_count = len(index_info)
        
        # 병렬 마이그레이션 실행
        migration_results = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # 각 인덱스에 대해 마이그레이션 작업 제출
            future_to_index = {
                executor.submit(self._migrate_single_index_parallel, index_item): index_item
                for index_item in index_info
            }
            
            # 완료된 작업 처리
            for future in concurrent.futures.as_completed(future_to_index):
                index_item = future_to_index[future]
                try:
                    result = future.result()
                    migration_results.append(result)
                    
                    with self.progress_lock:
                        self.completed_count += 1
                        progress = (self.completed_count / self.total_count) * 100
                        print(f"진행률: {self.completed_count}/{self.total_count} ({progress:.1f}%) - {index_item['name']}")
                        
                except Exception as e:
                    print(f"인덱스 '{index_item['name']}' 처리 중 예외: {e}")
                    migration_results.append({
                        'index_name': index_item['name'],
                        'status': 'error',
                        'error': str(e)
                    })
        
        # 결과 요약
        self._print_migration_summary(migration_results, 
                                    sum(1 for r in migration_results if r['status'] == 'success'),
                                    sum(1 for r in migration_results if r['status'] != 'success'))
        
        return migration_results
    
    def _migrate_single_index_parallel(self, index_item: Dict[str, Any]) -> Dict[str, Any]:
        """단일 인덱스를 병렬로 마이그레이션하는 함수"""
        index_name = index_item['name']
        
        if 'error' in index_item:
            return {
                'index_name': index_name,
                'status': 'skipped',
                'reason': f"정보 수집 오류: {index_item['error']}"
            }
        
        try:
            # 소스 인덱스 정보 가져오기
            source_index = self.source_index_client.get_index(index_name)
            
            # 대상 인덱스 생성
            created, target_index = self.create_target_index_safely(source_index)
            
            if not created and self.config.skip_existing:
                return {
                    'index_name': index_name,
                    'status': 'skipped',
                    'reason': '이미 존재하는 인덱스'
                }
            
            # 데이터 마이그레이션
            migration_success = self.migrate_index_with_retry(index_name)
            
            if migration_success:
                return {
                    'index_name': index_name,
                    'status': 'success',
                    'document_count': index_item.get('document_count', 0)
                }
            else:
                return {
                    'index_name': index_name,
                    'status': 'failed',
                    'reason': '마이그레이션 실패'
                }
                
        except Exception as e:
            return {
                'index_name': index_name,
                'status': 'error',
                'error': str(e)
            }
```

### 3. 모니터링 및 로깅 시스템

#### 상세한 로깅 및 모니터링
```python
import logging
import json
from datetime import datetime
from typing import Dict, Any

class MigrationLogger:
    """마이그레이션 과정을 로깅하는 클래스"""
    
    def __init__(self, log_file: str = "migration.log"):
        self.logger = logging.getLogger('AzureSearchMigration')
        self.logger.setLevel(logging.INFO)
        
        # 파일 핸들러
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        
        # 콘솔 핸들러
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # 포맷터
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        
        self.migration_start_time = None
        self.migration_stats = {
            'total_indexes': 0,
            'successful_migrations': 0,
            'failed_migrations': 0,
            'total_documents': 0,
            'total_batches': 0
        }
    
    def start_migration(self, total_indexes: int):
        """마이그레이션 시작을 로깅하는 함수"""
        self.migration_start_time = datetime.now()
        self.migration_stats['total_indexes'] = total_indexes
        
        self.logger.info(f"마이그레이션 시작: {total_indexes}개 인덱스")
        self.logger.info(f"시작 시간: {self.migration_start_time}")
    
    def log_index_migration_start(self, index_name: str, document_count: int):
        """인덱스 마이그레이션 시작을 로깅하는 함수"""
        self.logger.info(f"인덱스 마이그레이션 시작: {index_name} ({document_count:,}개 문서)")
    
    def log_batch_upload(self, index_name: str, batch_number: int, batch_size: int):
        """배치 업로드를 로깅하는 함수"""
        self.migration_stats['total_batches'] += 1
        self.logger.info(f"배치 업로드 완료: {index_name} - 배치 {batch_number} ({batch_size}개 문서)")
    
    def log_index_migration_complete(self, index_name: str, success: bool, document_count: int = 0):
        """인덱스 마이그레이션 완료를 로깅하는 함수"""
        if success:
            self.migration_stats['successful_migrations'] += 1
            self.migration_stats['total_documents'] += document_count
            self.logger.info(f"인덱스 마이그레이션 성공: {index_name} ({document_count:,}개 문서)")
        else:
            self.migration_stats['failed_migrations'] += 1
            self.logger.error(f"인덱스 마이그레이션 실패: {index_name}")
    
    def log_migration_error(self, index_name: str, error: str):
        """마이그레이션 오류를 로깅하는 함수"""
        self.logger.error(f"마이그레이션 오류 - {index_name}: {error}")
    
    def end_migration(self):
        """마이그레이션 완료를 로깅하는 함수"""
        end_time = datetime.now()
        duration = end_time - self.migration_start_time if self.migration_start_time else None
        
        self.logger.info("=== 마이그레이션 완료 ===")
        self.logger.info(f"완료 시간: {end_time}")
        if duration:
            self.logger.info(f"총 소요 시간: {duration}")
        
        # 통계 정보 로깅
        stats = self.migration_stats
        self.logger.info(f"총 인덱스: {stats['total_indexes']}개")
        self.logger.info(f"성공: {stats['successful_migrations']}개")
        self.logger.info(f"실패: {stats['failed_migrations']}개")
        self.logger.info(f"총 문서: {stats['total_documents']:,}개")
        self.logger.info(f"총 배치: {stats['total_batches']}개")
        
        if stats['total_indexes'] > 0:
            success_rate = (stats['successful_migrations'] / stats['total_indexes']) * 100
            self.logger.info(f"성공률: {success_rate:.1f}%")
    
    def save_migration_report(self, results: List[Dict[str, Any]], report_file: str = "migration_report.json"):
        """마이그레이션 보고서를 JSON 파일로 저장하는 함수"""
        report = {
            'migration_summary': {
                'start_time': self.migration_start_time.isoformat() if self.migration_start_time else None,
                'end_time': datetime.now().isoformat(),
                'duration_minutes': (datetime.now() - self.migration_start_time).total_seconds() / 60 if self.migration_start_time else None,
                'statistics': self.migration_stats
            },
            'detailed_results': results
        }
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"마이그레이션 보고서 저장: {report_file}")
```

### 4. 웹 대시보드 및 API 서비스

#### FastAPI 기반 마이그레이션 관리 API
```python
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn

app = FastAPI(title="Azure AI Search Migration Manager API")

class MigrationRequest(BaseModel):
    source_endpoint: str
    source_key: str
    target_endpoint: str
    target_key: str
    batch_size: int = 1000
    max_workers: int = 3
    skip_existing: bool = True

class MigrationStatus(BaseModel):
    migration_id: str
    status: str  # running, completed, failed
    progress: float
    current_index: Optional[str]
    completed_indexes: int
    total_indexes: int
    start_time: str
    estimated_completion: Optional[str]

# 전역 상태 관리
migration_statuses: Dict[str, MigrationStatus] = {}

@app.post("/migration/start")
async def start_migration(request: MigrationRequest, background_tasks: BackgroundTasks):
    """마이그레이션을 시작하는 엔드포인트"""
    import uuid
    
    migration_id = str(uuid.uuid4())
    
    # 마이그레이션 상태 초기화
    migration_statuses[migration_id] = MigrationStatus(
        migration_id=migration_id,
        status="running",
        progress=0.0,
        current_index=None,
        completed_indexes=0,
        total_indexes=0,
        start_time=datetime.now().isoformat(),
        estimated_completion=None
    )
    
    # 백그라운드에서 마이그레이션 실행
    background_tasks.add_task(
        execute_migration_background,
        migration_id,
        request
    )
    
    return {"migration_id": migration_id, "status": "started"}

@app.get("/migration/{migration_id}/status")
async def get_migration_status(migration_id: str):
    """마이그레이션 상태를 조회하는 엔드포인트"""
    if migration_id not in migration_statuses:
        raise HTTPException(status_code=404, detail="Migration not found")
    
    return migration_statuses[migration_id]

@app.get("/migration/{migration_id}/results")
async def get_migration_results(migration_id: str):
    """마이그레이션 결과를 조회하는 엔드포인트"""
    if migration_id not in migration_statuses:
        raise HTTPException(status_code=404, detail="Migration not found")
    
    status = migration_statuses[migration_id]
    if status.status != "completed":
        raise HTTPException(status_code=400, detail="Migration not completed yet")
    
    # 결과 파일에서 데이터 로드 (실제 구현에서는 데이터베이스 사용)
    try:
        with open(f"migration_{migration_id}_results.json", "r") as f:
            results = json.load(f)
        return results
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Results not found")

@app.get("/migration/list")
async def list_migrations():
    """모든 마이그레이션 목록을 조회하는 엔드포인트"""
    return list(migration_statuses.values())

async def execute_migration_background(migration_id: str, request: MigrationRequest):
    """백그라운드에서 마이그레이션을 실행하는 함수"""
    try:
        # 마이그레이션 매니저 초기화
        config = MigrationConfig(
            batch_size=request.batch_size,
            skip_existing=request.skip_existing
        )
        
        migration_manager = ParallelMigrationManager(
            source_endpoint=request.source_endpoint,
            source_key=request.source_key,
            target_endpoint=request.target_endpoint,
            target_key=request.target_key,
            config=config,
            max_workers=request.max_workers
        )
        
        # 마이그레이션 실행
        results = migration_manager.execute_parallel_migration()
        
        # 상태 업데이트
        migration_statuses[migration_id].status = "completed"
        migration_statuses[migration_id].progress = 100.0
        migration_statuses[migration_id].completed_indexes = len(results)
        
        # 결과 저장
        with open(f"migration_{migration_id}_results.json", "w") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        migration_statuses[migration_id].status = "failed"
        print(f"마이그레이션 실패: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 학습 내용

### 기술적 인사이트

#### 1. 대규모 데이터 마이그레이션의 복잡성
- **배치 처리의 중요성**: 대용량 데이터를 효율적으로 처리하기 위한 배치 단위 처리
- **메모리 관리**: 전체 데이터를 메모리에 로드하지 않고 스트리밍 방식으로 처리
- **오류 처리**: 부분적 실패에 대한 안전한 처리 및 복구 메커니즘

#### 2. Azure AI Search 인덱스 구조의 복잡성
- **벡터 검색 설정**: HNSW 알고리즘과 벡터 프로파일의 정확한 복제
- **시맨틱 검색 설정**: 제목, 키워드, 내용 필드의 우선순위 설정 보존
- **스코어링 프로파일**: 검색 결과 순위에 영향을 주는 설정의 완전한 이전

#### 3. 자동화의 가치
- **인적 오류 방지**: 수동 작업에서 발생할 수 있는 실수를 완전히 제거
- **일관성 보장**: 모든 인덱스에 대해 동일한 방식으로 마이그레이션 수행
- **확장성**: 새로운 인덱스가 추가되어도 동일한 프로세스로 처리 가능

### 비즈니스 가치

#### 1. 비용 절감 효과
- **다운타임 최소화**: 서비스 중단 없이 마이그레이션 수행으로 비즈니스 손실 방지
- **인력 비용 절약**: 수동 마이그레이션에 필요한 대량의 인력 투입 불필요
- **오류 수정 비용 절약**: 자동화를 통한 오류 방지로 사후 수정 비용 절약

#### 2. 운영 효율성 증대
- **예측 가능한 마이그레이션**: 자동화된 프로세스로 마이그레이션 시간 예측 가능
- **모니터링 강화**: 실시간 진행 상황 추적으로 문제 조기 발견
- **표준화된 프로세스**: 일관된 마이그레이션 프로세스로 운영 표준화

#### 3. 확장성과 유연성
- **스케일 대응**: 인덱스 수 증가에 대한 자동 대응
- **환경 이전**: 개발/운영 환경 간의 안전한 인덱스 이전
- **백업 및 복구**: 정기적인 백업을 통한 데이터 보호

### 향후 발전 방향

#### 1. 고도화된 마이그레이션 전략
- **점진적 마이그레이션**: 서비스 중단 없이 점진적으로 트래픽 이전
- **실시간 동기화**: 소스와 대상 인덱스 간의 실시간 데이터 동기화
- **롤백 기능**: 문제 발생 시 이전 상태로 안전하게 롤백

#### 2. 지능형 모니터링 시스템
- **성능 모니터링**: 마이그레이션 후 성능 지표 자동 비교
- **데이터 품질 검증**: 마이그레이션된 데이터의 품질 자동 검증
- **알림 시스템**: 문제 발생 시 즉시 알림 및 대응 방안 제시

#### 3. 통합 플랫폼 구축
- **웹 대시보드**: 시각적 마이그레이션 관리 인터페이스
- **API 생태계**: 다양한 도구와의 연동을 위한 RESTful API
- **CI/CD 통합**: 개발 파이프라인과의 자동 통합

이 Azure AI Search 인스턴스 마이그레이션 자동화 시스템을 통해 대규모 검색 서비스의 안전하고 효율적인 인프라 이전을 실현할 수 있습니다. 특히 완전 자동화된 프로세스와 배치 처리 기반의 효율적인 데이터 마이그레이션을 통해 비즈니스 연속성을 보장하면서도 운영 효율성을 크게 향상시킨 혁신적인 솔루션입니다.
