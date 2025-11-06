---
layout: post
title: "BigQuery 실행 시간 추정 자동화 시스템"
date: 2025-10-28 00:00:00 +0900
categories: tech
tags: [BigQuery, 실행 시간 추정, Dry Run, 로그 변환 모델, 자동화, 데이터 분석, 쿼리 최적화]
excerpt: "BigQuery 쿼리의 실행 시간을 사전에 정확하게 추정하기 위한 자동화 시스템으로, Dry Run을 활용하여 쿼리 실행 전에 예상 실행 시간을 계산하고 개발자들이 쿼리 최적화를 미리 수행할 수 있도록 도와줍니다."
---

# BigQuery 실행 시간 추정 자동화 시스템

## 개요

이 프로젝트는 **BigQuery** 쿼리의 실행 시간을 사전에 정확하게 추정하기 위한 자동화 시스템입니다. 기존에는 쿼리 실행 후에야 실제 실행 시간을 알 수 있었지만, 이 시스템을 통해 **Dry Run**을 활용하여 쿼리 실행 전에 예상 실행 시간을 계산할 수 있습니다. 이를 통해 개발자들이 쿼리 최적화를 미리 수행하고, 리소스 계획을 효율적으로 수립할 수 있도록 도와줍니다.

### 핵심 특징
- **Dry Run 기반 예측**: 실제 쿼리 실행 없이 실행 시간 추정
- **로그 변환 모델**: 실제 데이터를 기반으로 한 정확한 예측 모델
- **자동화된 데이터 수집**: BigQuery 작업 기록을 자동으로 수집 및 분석
- **시각화 지원**: 실행 시간과 데이터 처리량 간의 상관관계 시각화

## 문제 해결

### 기존 문제점
1. **실행 시간 예측 불가**: 쿼리 실행 전에 예상 실행 시간을 알 수 없음
2. **리소스 계획 어려움**: 예상치 못한 긴 실행 시간으로 인한 리소스 낭비
3. **쿼리 최적화 지연**: 실행 후에야 성능 문제를 발견하여 최적화 지연
4. **비용 관리 어려움**: 예상치 못한 BigQuery 비용 발생
5. **작업 스케줄링 어려움**: 실행 시간을 모르면 작업 순서 계획이 어려움

### 해결 효과
- **사전 최적화**: 쿼리 실행 전에 성능 문제를 미리 파악하고 최적화
- **리소스 효율성**: 예상 실행 시간을 바탕으로 효율적인 리소스 배치
- **비용 절감**: 불필요한 긴 실행 시간을 방지하여 BigQuery 비용 절약
- **작업 계획 개선**: 실행 시간 예측을 통한 효율적인 작업 스케줄링
- **개발 생산성 향상**: 빠른 피드백을 통한 쿼리 개발 속도 향상

## 구현 방식

### 1. 서비스 계정 및 환경 설정

#### 서비스 계정 확인
```python
import requests

def get_service_accounts():
    """Google Cloud VM에서 서비스 계정 정보를 가져오는 함수"""
    # 메타데이터 서버의 URL
    metadata_url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/"
    headers = {"Metadata-Flavor": "Google"}
    
    # 서비스 계정 정보 가져오기
    response = requests.get(metadata_url, headers=headers)
    
    if response.status_code == 200:
        service_accounts = response.text
        print("Service Accounts:", service_accounts)
        return service_accounts
    else:
        print(f"Failed to retrieve service accounts. Status code: {response.status_code}")
        return None

# 사용 예시
service_accounts = get_service_accounts()
```

#### BigQuery 클라이언트 초기화
```python
from google.cloud import bigquery

def initialize_bigquery_client():
    """BigQuery 클라이언트를 초기화하고 현재 사용자 확인"""
    client = bigquery.Client()
    
    # 현재 사용자 확인 쿼리
    query = "SELECT CURRENT_USER()"
    query_job = client.query(query)
    
    print(f"BigQuery Client: {client}")
    print(f"Query Job: {query_job}")
    
    return client

# 클라이언트 초기화
client = initialize_bigquery_client()
```

### 2. BigQuery 작업 기록 수집 시스템

#### 작업 기록 자동 수집
```python
from google.cloud import bigquery
from datetime import datetime, timedelta
import pandas as pd

def collect_bigquery_jobs(client, service_account_email, limit=500):
    """BigQuery 작업 기록을 수집하는 함수"""
    
    def replace_special_chars(input_string):
        """쿼리 문자열에서 특수 문자를 정리하는 함수"""
        return input_string.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    
    # 정보 스키마 쿼리 작성
    query = f"""
        SELECT
            cache_hit
            , user_email
            , project_id
            , start_time
            , creation_time
            , end_time
            , TIMESTAMP_DIFF(end_time, creation_time, MILLISECOND)/1000 AS execution_time_seconds
            , total_bytes_processed/1000000 AS execution_total_MB
            , query
        FROM
            region-asia-northeast3.INFORMATION_SCHEMA.JOBS
        WHERE
            1=1
            AND statement_type = 'SELECT'
            AND cache_hit = False
            AND user_email = '{service_account_email}'
            AND query not like '%--%'
            AND query not like '%#%'
            AND query not like '%INFORMATION_SCHEMA%'
        ORDER BY creation_time desc
        LIMIT {limit}
    """
    
    # 쿼리 실행
    query_job = client.query(query)
    
    # 데이터프레임으로 변환
    df = query_job.to_dataframe()
    
    # 데이터 정리
    df['query'] = df['query'].apply(replace_special_chars)
    df = df.dropna(subset=['execution_time_seconds'])
    df = df.dropna(subset=['execution_total_MB'])
    
    return df

# 사용 예시
service_account_email = "sa-dev-sa-sip-vm-user@gcp-dev-edp-sa-sip.iam.gserviceaccount.com"
df = collect_bigquery_jobs(client, service_account_email, limit=500)
print(f"수집된 작업 수: {len(df)}")
```

### 3. Dry Run 기반 실행 시간 예측 시스템

#### Dry Run 함수 구현
```python
def dry_run_query(client, query):
    """쿼리의 Dry Run을 수행하여 처리할 데이터 양을 예측하는 함수"""
    job_config = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
    
    # Dry Run 쿼리 실행
    query_job = client.query(query, job_config=job_config)
    
    # 처리할 데이터 양을 MB 단위로 반환
    return query_job.total_bytes_processed / 1000000

def batch_dry_run(df, client):
    """데이터프레임의 모든 쿼리에 대해 Dry Run을 수행하는 함수"""
    dry_run_results = []
    
    for idx, row in df.iterrows():
        try:
            dry_run_mb = dry_run_query(client, row['query'])
            dry_run_results.append(dry_run_mb)
            print(f"쿼리 {idx+1}/{len(df)} 처리 완료: {dry_run_mb:.2f} MB")
        except Exception as e:
            print(f"쿼리 {idx+1} 처리 실패: {e}")
            dry_run_results.append(None)
    
    df['dry_run_MB'] = dry_run_results
    return df

# 사용 예시
df_with_dry_run = batch_dry_run(df, client)
df_with_dry_run.to_csv('dry_run.csv', index=False)
```

### 4. 로그 변환 기반 예측 모델

#### 실행 시간 예측 함수
```python
import numpy as np

def predict_execution_time_seconds_log(dry_run_MB):
    """
    Dry Run MB 값을 기반으로 로그 변환 모델을 사용하여 실행 시간을 예측하는 함수
    
    이 함수는 60초 이하의 실행 시간으로 필터링된 데이터를 기반으로 한
    로그 변환 선형 회귀 모델을 사용합니다.
    
    Parameters:
    dry_run_MB (float): Dry Run에서 예측된 메모리 사용량 (MB)
    
    Returns:
    float: 예측된 실행 시간 (초)
    """
    log_slope = 1.67
    log_intercept = -7.52
    log_dry_run_MB = np.log1p(dry_run_MB)  # log(1 + x) 변환
    return log_slope * log_dry_run_MB + log_intercept

def predict_execution_time_batch(dry_run_values):
    """여러 Dry Run 값에 대해 배치로 실행 시간을 예측하는 함수"""
    predictions = []
    for dry_run_mb in dry_run_values:
        if dry_run_mb is not None and dry_run_mb > 0:
            prediction = predict_execution_time_seconds_log(dry_run_mb)
            predictions.append(prediction)
        else:
            predictions.append(None)
    return predictions

# 사용 예시
dry_run_mb = 100
predicted_time = predict_execution_time_seconds_log(dry_run_mb)
print(f"Dry Run: {dry_run_mb} MB -> 예측 실행 시간: {predicted_time:.2f} 초")

# 배치 예측
df['predicted_execution_time'] = predict_execution_time_batch(df['dry_run_MB'])
```

### 5. 데이터 시각화 및 분석 시스템

#### 상관관계 시각화
```python
import matplotlib.pyplot as plt

def visualize_execution_correlation(df):
    """실행 시간과 데이터 처리량 간의 상관관계를 시각화하는 함수"""
    
    # 데이터 정리 (None 값 제거)
    clean_df = df.dropna(subset=['execution_total_MB', 'execution_time_seconds'])
    
    # 그래프 설정
    plt.figure(figsize=(12, 8))
    
    # 실제 실행 시간 vs 데이터 처리량
    plt.subplot(2, 2, 1)
    plt.scatter(clean_df['execution_total_MB'], clean_df['execution_time_seconds'], 
                alpha=0.6, color='blue')
    plt.xlabel('실제 데이터 처리량 (MB)')
    plt.ylabel('실제 실행 시간 (초)')
    plt.title('실제 데이터 처리량 vs 실행 시간')
    plt.grid(True)
    
    # Dry Run vs 실제 실행 시간
    plt.subplot(2, 2, 2)
    clean_dry_run = df.dropna(subset=['dry_run_MB', 'execution_time_seconds'])
    plt.scatter(clean_dry_run['dry_run_MB'], clean_dry_run['execution_time_seconds'], 
                alpha=0.6, color='green')
    plt.xlabel('Dry Run 예측 데이터량 (MB)')
    plt.ylabel('실제 실행 시간 (초)')
    plt.title('Dry Run 예측 vs 실제 실행 시간')
    plt.grid(True)
    
    # 예측 시간 vs 실제 시간
    plt.subplot(2, 2, 3)
    clean_prediction = df.dropna(subset=['predicted_execution_time', 'execution_time_seconds'])
    plt.scatter(clean_prediction['predicted_execution_time'], 
                clean_prediction['execution_time_seconds'], 
                alpha=0.6, color='red')
    plt.xlabel('예측 실행 시간 (초)')
    plt.ylabel('실제 실행 시간 (초)')
    plt.title('예측 시간 vs 실제 시간')
    plt.grid(True)
    
    # 시간별 트렌드
    plt.subplot(2, 2, 4)
    plt.plot(clean_df['execution_total_MB'], clean_df['execution_time_seconds'], 
             marker='o', alpha=0.7)
    plt.xlabel('데이터 처리량 (MB)')
    plt.ylabel('실제 실행 시간 (초)')
    plt.title('데이터 처리량별 실행 시간 트렌드')
    plt.grid(True)
    
    plt.tight_layout()
    plt.show()
    
    return clean_df

# 사용 예시
visualization_data = visualize_execution_correlation(df)
```

#### 모델 성능 평가
```python
def evaluate_model_performance(df):
    """예측 모델의 성능을 평가하는 함수"""
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    
    # 유효한 예측값만 추출
    valid_data = df.dropna(subset=['predicted_execution_time', 'execution_time_seconds'])
    
    if len(valid_data) == 0:
        print("평가할 유효한 데이터가 없습니다.")
        return None
    
    actual = valid_data['execution_time_seconds']
    predicted = valid_data['predicted_execution_time']
    
    # 성능 지표 계산
    mae = mean_absolute_error(actual, predicted)
    mse = mean_squared_error(actual, predicted)
    rmse = np.sqrt(mse)
    r2 = r2_score(actual, predicted)
    
    # 결과 출력
    print("=== 모델 성능 평가 ===")
    print(f"평균 절대 오차 (MAE): {mae:.2f} 초")
    print(f"평균 제곱 오차 (MSE): {mse:.2f}")
    print(f"제곱근 평균 제곱 오차 (RMSE): {rmse:.2f} 초")
    print(f"결정 계수 (R²): {r2:.4f}")
    print(f"평가 데이터 수: {len(valid_data)}개")
    
    # 정확도 분석
    accuracy_within_10_percent = sum(abs(actual - predicted) / actual <= 0.1) / len(actual)
    accuracy_within_20_percent = sum(abs(actual - predicted) / actual <= 0.2) / len(actual)
    
    print(f"10% 이내 정확도: {accuracy_within_10_percent:.2%}")
    print(f"20% 이내 정확도: {accuracy_within_20_percent:.2%}")
    
    return {
        'mae': mae,
        'mse': mse,
        'rmse': rmse,
        'r2': r2,
        'accuracy_10': accuracy_within_10_percent,
        'accuracy_20': accuracy_within_20_percent
    }

# 사용 예시
performance_metrics = evaluate_model_performance(df)
```

### 6. 통합 실행 시간 예측 시스템

#### 완전한 예측 파이프라인
```python
class BigQueryExecutionTimePredictor:
    """BigQuery 실행 시간 예측을 위한 통합 클래스"""
    
    def __init__(self, service_account_email):
        self.service_account_email = service_account_email
        self.client = bigquery.Client()
        self.model_params = {
            'log_slope': 1.67,
            'log_intercept': -7.52
        }
    
    def predict_single_query(self, query):
        """단일 쿼리의 실행 시간을 예측하는 함수"""
        try:
            # Dry Run 수행
            dry_run_mb = dry_run_query(self.client, query)
            
            # 실행 시간 예측
            predicted_time = predict_execution_time_seconds_log(dry_run_mb)
            
            return {
                'query': query,
                'dry_run_mb': dry_run_mb,
                'predicted_execution_time_seconds': predicted_time,
                'status': 'success'
            }
        except Exception as e:
            return {
                'query': query,
                'error': str(e),
                'status': 'error'
            }
    
    def predict_multiple_queries(self, queries):
        """여러 쿼리의 실행 시간을 배치로 예측하는 함수"""
        results = []
        
        for i, query in enumerate(queries):
            print(f"쿼리 {i+1}/{len(queries)} 처리 중...")
            result = self.predict_single_query(query)
            results.append(result)
        
        return results
    
    def get_historical_data(self, limit=500):
        """과거 작업 데이터를 수집하는 함수"""
        return collect_bigquery_jobs(self.client, self.service_account_email, limit)
    
    def retrain_model(self, df):
        """새로운 데이터로 모델을 재훈련하는 함수"""
        # 로그 변환 선형 회귀 모델 재훈련
        from sklearn.linear_model import LinearRegression
        
        # 유효한 데이터만 추출
        valid_data = df.dropna(subset=['dry_run_MB', 'execution_time_seconds'])
        
        if len(valid_data) < 10:
            print("재훈련을 위한 충분한 데이터가 없습니다.")
            return False
        
        # 로그 변환
        X = np.log1p(valid_data['dry_run_MB']).values.reshape(-1, 1)
        y = valid_data['execution_time_seconds'].values
        
        # 모델 훈련
        model = LinearRegression()
        model.fit(X, y)
        
        # 새로운 파라미터 저장
        self.model_params['log_slope'] = model.coef_[0]
        self.model_params['log_intercept'] = model.intercept_
        
        print(f"모델 재훈련 완료:")
        print(f"새로운 기울기: {self.model_params['log_slope']:.2f}")
        print(f"새로운 절편: {self.model_params['log_intercept']:.2f}")
        
        return True

# 사용 예시
predictor = BigQueryExecutionTimePredictor(service_account_email)

# 단일 쿼리 예측
sample_query = """
SELECT COUNT(*) 
FROM `your-gcp-project.your-dataset.your-table-name` 
WHERE P_YYYYMMDD BETWEEN '2024-04-01' AND '2024-04-30'
"""
result = predictor.predict_single_query(sample_query)
print(f"예측 결과: {result}")
```

## 리팩토링 제안

### 1. 모델 개선 및 정확도 향상

#### 고급 머신러닝 모델 도입
```python
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
import joblib

class AdvancedExecutionTimePredictor:
    """고급 머신러닝 모델을 사용한 실행 시간 예측기"""
    
    def __init__(self):
        self.models = {
            'linear': LinearRegression(),
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingRegressor(random_state=42)
        }
        self.scaler = StandardScaler()
        self.best_model = None
        self.feature_names = ['log_dry_run_mb', 'query_length', 'table_count', 'join_count']
    
    def extract_features(self, query, dry_run_mb):
        """쿼리에서 추가 특성을 추출하는 함수"""
        features = {
            'log_dry_run_mb': np.log1p(dry_run_mb),
            'query_length': len(query),
            'table_count': query.upper().count('FROM'),
            'join_count': query.upper().count('JOIN')
        }
        return [features[name] for name in self.feature_names]
    
    def train_models(self, df):
        """여러 모델을 훈련하고 최적 모델을 선택하는 함수"""
        # 특성 추출
        X = []
        y = []
        
        for _, row in df.iterrows():
            if pd.notna(row['dry_run_MB']) and pd.notna(row['execution_time_seconds']):
                features = self.extract_features(row['query'], row['dry_run_MB'])
                X.append(features)
                y.append(row['execution_time_seconds'])
        
        X = np.array(X)
        y = np.array(y)
        
        # 데이터 분할
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # 특성 스케일링
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # 모델 훈련 및 평가
        best_score = -np.inf
        best_model_name = None
        
        for name, model in self.models.items():
            if name == 'linear':
                model.fit(X_train_scaled, y_train)
                score = model.score(X_test_scaled, y_test)
            else:
                model.fit(X_train, y_train)
                score = model.score(X_test, y_test)
            
            print(f"{name} 모델 R² 점수: {score:.4f}")
            
            if score > best_score:
                best_score = score
                best_model_name = name
                self.best_model = model
        
        print(f"최적 모델: {best_model_name} (R² = {best_score:.4f})")
        
        # 교차 검증
        if best_model_name == 'linear':
            cv_scores = cross_val_score(self.best_model, X_train_scaled, y_train, cv=5)
        else:
            cv_scores = cross_val_score(self.best_model, X_train, y_train, cv=5)
        
        print(f"교차 검증 평균 점수: {cv_scores.mean():.4f} (±{cv_scores.std() * 2:.4f})")
        
        return best_model_name, best_score
    
    def predict(self, query, dry_run_mb):
        """최적 모델을 사용하여 실행 시간을 예측하는 함수"""
        if self.best_model is None:
            raise ValueError("모델이 훈련되지 않았습니다. train_models()를 먼저 호출하세요.")
        
        features = self.extract_features(query, dry_run_mb)
        
        if hasattr(self.best_model, 'predict'):
            if isinstance(self.best_model, LinearRegression):
                features_scaled = self.scaler.transform([features])
                prediction = self.best_model.predict(features_scaled)[0]
            else:
                prediction = self.best_model.predict([features])[0]
        else:
            prediction = self.best_model.predict([features])[0]
        
        return max(0, prediction)  # 음수 예측 방지
    
    def save_model(self, filepath):
        """훈련된 모델을 저장하는 함수"""
        model_data = {
            'best_model': self.best_model,
            'scaler': self.scaler,
            'feature_names': self.feature_names
        }
        joblib.dump(model_data, filepath)
        print(f"모델이 {filepath}에 저장되었습니다.")
    
    def load_model(self, filepath):
        """저장된 모델을 로드하는 함수"""
        model_data = joblib.load(filepath)
        self.best_model = model_data['best_model']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        print(f"모델이 {filepath}에서 로드되었습니다.")
```

### 2. 실시간 모니터링 및 알림 시스템

#### 실행 시간 모니터링
```python
import time
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class ExecutionTimeMonitor:
    """실행 시간 모니터링 및 알림 시스템"""
    
    def __init__(self, predictor, threshold_seconds=300):
        self.predictor = predictor
        self.threshold_seconds = threshold_seconds
        self.monitoring_log = []
    
    def monitor_query_execution(self, query, user_email=None):
        """쿼리 실행을 모니터링하고 임계값 초과 시 알림을 보내는 함수"""
        # 실행 시간 예측
        dry_run_mb = dry_run_query(self.predictor.client, query)
        predicted_time = self.predictor.predict_single_query(query)
        
        if predicted_time['status'] == 'error':
            print(f"예측 실패: {predicted_time['error']}")
            return None
        
        predicted_seconds = predicted_time['predicted_execution_time_seconds']
        
        # 임계값 확인
        if predicted_seconds > self.threshold_seconds:
            alert_message = self._create_alert_message(query, predicted_seconds, dry_run_mb)
            print(f"⚠️ 경고: 예상 실행 시간이 {self.threshold_seconds}초를 초과합니다!")
            print(f"예상 실행 시간: {predicted_seconds:.2f}초")
            print(f"처리할 데이터량: {dry_run_mb:.2f} MB")
            
            # 알림 전송
            if user_email:
                self._send_alert_email(user_email, alert_message)
            
            # 모니터링 로그에 기록
            self._log_monitoring_event(query, predicted_seconds, dry_run_mb, 'threshold_exceeded')
        
        return {
            'predicted_time': predicted_seconds,
            'dry_run_mb': dry_run_mb,
            'threshold_exceeded': predicted_seconds > self.threshold_seconds
        }
    
    def _create_alert_message(self, query, predicted_time, dry_run_mb):
        """알림 메시지를 생성하는 함수"""
        message = f"""
BigQuery 쿼리 실행 시간 경고

예상 실행 시간: {predicted_time:.2f}초
처리할 데이터량: {dry_run_mb:.2f} MB
임계값: {self.threshold_seconds}초

쿼리:
{query[:500]}{'...' if len(query) > 500 else ''}

권장사항:
1. 쿼리 최적화 검토
2. 파티션 필터 추가
3. 불필요한 컬럼 제거
4. 적절한 인덱스 사용 확인
        """
        return message
    
    def _send_alert_email(self, user_email, message):
        """이메일 알림을 전송하는 함수"""
        try:
            # SMTP 설정 (실제 환경에서는 환경변수 사용)
            smtp_server = "smtp.gmail.com"
            smtp_port = 587
            sender_email = "your-email@gmail.com"
            sender_password = "your-password"
            
            # 이메일 구성
            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = user_email
            msg['Subject'] = "BigQuery 실행 시간 경고"
            
            msg.attach(MIMEText(message, 'plain'))
            
            # 이메일 전송
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender_email, sender_password)
            text = msg.as_string()
            server.sendmail(sender_email, user_email, text)
            server.quit()
            
            print(f"경고 이메일이 {user_email}로 전송되었습니다.")
            
        except Exception as e:
            print(f"이메일 전송 실패: {e}")
    
    def _log_monitoring_event(self, query, predicted_time, dry_run_mb, event_type):
        """모니터링 이벤트를 로그에 기록하는 함수"""
        event = {
            'timestamp': datetime.now(),
            'query_hash': hash(query),
            'predicted_time': predicted_time,
            'dry_run_mb': dry_run_mb,
            'event_type': event_type
        }
        self.monitoring_log.append(event)
    
    def get_monitoring_summary(self):
        """모니터링 요약 정보를 반환하는 함수"""
        if not self.monitoring_log:
            return "모니터링 로그가 없습니다."
        
        total_events = len(self.monitoring_log)
        threshold_exceeded = sum(1 for event in self.monitoring_log if event['event_type'] == 'threshold_exceeded')
        avg_predicted_time = sum(event['predicted_time'] for event in self.monitoring_log) / total_events
        
        return {
            'total_monitored_queries': total_events,
            'threshold_exceeded_count': threshold_exceeded,
            'threshold_exceeded_rate': threshold_exceeded / total_events,
            'average_predicted_time': avg_predicted_time,
            'last_monitoring_time': self.monitoring_log[-1]['timestamp'] if self.monitoring_log else None
        }
```

### 3. 쿼리 최적화 제안 시스템

#### 자동 최적화 제안
```python
import re
from typing import List, Dict, Any

class QueryOptimizationAdvisor:
    """쿼리 최적화 제안을 제공하는 클래스"""
    
    def __init__(self):
        self.optimization_rules = {
            'partition_filter': {
                'pattern': r'WHERE\s+.*?P_YYYYMMDD\s*[<>=]+\s*[\'"]?\d{4}-\d{2}-\d{2}[\'"]?',
                'suggestion': '파티션 필터가 적절히 사용되고 있습니다.',
                'priority': 'high'
            },
            'select_star': {
                'pattern': r'SELECT\s+\*',
                'suggestion': 'SELECT * 대신 필요한 컬럼만 선택하여 데이터 전송량을 줄이세요.',
                'priority': 'medium'
            },
            'missing_limit': {
                'pattern': r'SELECT.*(?!LIMIT\s+\d+)',
                'suggestion': '결과 집합이 클 경우 LIMIT을 추가하여 실행 시간을 단축하세요.',
                'priority': 'low'
            },
            'complex_join': {
                'pattern': r'JOIN.*JOIN.*JOIN',
                'suggestion': '복잡한 JOIN이 감지되었습니다. 인덱스와 조인 순서를 확인하세요.',
                'priority': 'high'
            }
        }
    
    def analyze_query(self, query: str) -> List[Dict[str, Any]]:
        """쿼리를 분석하고 최적화 제안을 반환하는 함수"""
        suggestions = []
        
        for rule_name, rule in self.optimization_rules.items():
            if re.search(rule['pattern'], query, re.IGNORECASE):
                suggestions.append({
                    'rule': rule_name,
                    'suggestion': rule['suggestion'],
                    'priority': rule['priority'],
                    'query_snippet': self._extract_relevant_snippet(query, rule['pattern'])
                })
        
        # 추가 분석
        suggestions.extend(self._analyze_query_structure(query))
        
        return sorted(suggestions, key=lambda x: self._priority_score(x['priority']))
    
    def _extract_relevant_snippet(self, query: str, pattern: str) -> str:
        """쿼리에서 관련 부분을 추출하는 함수"""
        match = re.search(pattern, query, re.IGNORECASE)
        if match:
            start = max(0, match.start() - 50)
            end = min(len(query), match.end() + 50)
            return query[start:end]
        return ""
    
    def _analyze_query_structure(self, query: str) -> List[Dict[str, Any]]:
        """쿼리 구조를 분석하는 함수"""
        suggestions = []
        
        # 테이블 수 분석
        table_count = len(re.findall(r'FROM\s+\w+', query, re.IGNORECASE))
        if table_count > 5:
            suggestions.append({
                'rule': 'many_tables',
                'suggestion': f'{table_count}개의 테이블이 사용되었습니다. 쿼리를 분할하는 것을 고려하세요.',
                'priority': 'medium',
                'query_snippet': 'Multiple tables detected'
            })
        
        # 서브쿼리 분석
        subquery_count = len(re.findall(r'\(SELECT', query, re.IGNORECASE))
        if subquery_count > 3:
            suggestions.append({
                'rule': 'complex_subqueries',
                'suggestion': f'{subquery_count}개의 서브쿼리가 있습니다. CTE나 임시 테이블 사용을 고려하세요.',
                'priority': 'medium',
                'query_snippet': 'Multiple subqueries detected'
            })
        
        return suggestions
    
    def _priority_score(self, priority: str) -> int:
        """우선순위를 점수로 변환하는 함수"""
        priority_scores = {'high': 3, 'medium': 2, 'low': 1}
        return priority_scores.get(priority, 0)
    
    def generate_optimization_report(self, query: str, predicted_time: float) -> str:
        """최적화 보고서를 생성하는 함수"""
        suggestions = self.analyze_query(query)
        
        report = f"""
=== BigQuery 쿼리 최적화 보고서 ===

예상 실행 시간: {predicted_time:.2f}초

최적화 제안:
"""
        
        for i, suggestion in enumerate(suggestions, 1):
            priority_emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}[suggestion['priority']]
            report += f"""
{i}. {priority_emoji} {suggestion['suggestion']}
   규칙: {suggestion['rule']}
"""
        
        if not suggestions:
            report += "\n현재 쿼리는 잘 최적화되어 있습니다!"
        
        return report

# 사용 예시
advisor = QueryOptimizationAdvisor()
sample_query = """
SELECT * FROM `your-gcp-project.your-dataset.your-table-name` 
WHERE P_YYYYMMDD BETWEEN '2024-04-01' AND '2024-04-30'
"""
suggestions = advisor.analyze_query(sample_query)
report = advisor.generate_optimization_report(sample_query, 45.2)
print(report)
```

### 4. 웹 대시보드 및 API 서비스

#### FastAPI 기반 REST API
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(title="BigQuery Execution Time Predictor API")

class QueryRequest(BaseModel):
    query: str
    user_email: Optional[str] = None

class PredictionResponse(BaseModel):
    predicted_execution_time_seconds: float
    dry_run_mb: float
    threshold_exceeded: bool
    optimization_suggestions: List[dict]

class BatchPredictionRequest(BaseModel):
    queries: List[str]

class BatchPredictionResponse(BaseModel):
    results: List[dict]
    summary: dict

# 전역 예측기 인스턴스
predictor = None
monitor = None
advisor = None

@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 초기화"""
    global predictor, monitor, advisor
    
    service_account_email = "sa-dev-sa-sip-vm-user@gcp-dev-edp-sa-sip.iam.gserviceaccount.com"
    predictor = BigQueryExecutionTimePredictor(service_account_email)
    monitor = ExecutionTimeMonitor(predictor, threshold_seconds=300)
    advisor = QueryOptimizationAdvisor()
    
    print("BigQuery Execution Time Predictor API가 시작되었습니다.")

@app.post("/predict", response_model=PredictionResponse)
async def predict_execution_time(request: QueryRequest):
    """단일 쿼리의 실행 시간을 예측하는 엔드포인트"""
    try:
        # 실행 시간 예측
        prediction_result = predictor.predict_single_query(request.query)
        
        if prediction_result['status'] == 'error':
            raise HTTPException(status_code=400, detail=prediction_result['error'])
        
        predicted_time = prediction_result['predicted_execution_time_seconds']
        dry_run_mb = prediction_result['dry_run_mb']
        
        # 모니터링
        monitor_result = monitor.monitor_query_execution(request.query, request.user_email)
        
        # 최적화 제안
        suggestions = advisor.analyze_query(request.query)
        
        return PredictionResponse(
            predicted_execution_time_seconds=predicted_time,
            dry_run_mb=dry_run_mb,
            threshold_exceeded=monitor_result['threshold_exceeded'] if monitor_result else False,
            optimization_suggestions=suggestions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch_execution_time(request: BatchPredictionRequest):
    """여러 쿼리의 실행 시간을 배치로 예측하는 엔드포인트"""
    try:
        results = []
        total_predicted_time = 0
        threshold_exceeded_count = 0
        
        for query in request.queries:
            prediction_result = predictor.predict_single_query(query)
            
            if prediction_result['status'] == 'success':
                predicted_time = prediction_result['predicted_execution_time_seconds']
                total_predicted_time += predicted_time
                
                if predicted_time > monitor.threshold_seconds:
                    threshold_exceeded_count += 1
                
                results.append({
                    'query': query,
                    'predicted_execution_time_seconds': predicted_time,
                    'dry_run_mb': prediction_result['dry_run_mb'],
                    'threshold_exceeded': predicted_time > monitor.threshold_seconds,
                    'status': 'success'
                })
            else:
                results.append({
                    'query': query,
                    'error': prediction_result['error'],
                    'status': 'error'
                })
        
        summary = {
            'total_queries': len(request.queries),
            'successful_predictions': len([r for r in results if r['status'] == 'success']),
            'total_predicted_time': total_predicted_time,
            'threshold_exceeded_count': threshold_exceeded_count,
            'average_predicted_time': total_predicted_time / len([r for r in results if r['status'] == 'success']) if results else 0
        }
        
        return BatchPredictionResponse(results=results, summary=summary)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/monitoring/summary")
async def get_monitoring_summary():
    """모니터링 요약 정보를 반환하는 엔드포인트"""
    try:
        summary = monitor.get_monitoring_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy", "service": "BigQuery Execution Time Predictor"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 학습 내용

### 기술적 인사이트

#### 1. Dry Run의 활용 가치
- **비용 효율성**: 실제 쿼리 실행 없이 리소스 사용량을 예측할 수 있어 비용 절약
- **성능 예측**: 처리할 데이터 양을 기반으로 실행 시간을 정확하게 예측 가능
- **사전 최적화**: 실행 전에 성능 문제를 파악하고 최적화할 수 있는 기회 제공

#### 2. 로그 변환 모델의 효과
- **선형 관계 변환**: 로그 변환을 통해 비선형 관계를 선형으로 변환하여 모델링 정확도 향상
- **이상치 처리**: 로그 변환이 극값의 영향을 줄여 모델의 안정성 향상
- **실용적 정확도**: 실제 운영 환경에서 사용 가능한 수준의 예측 정확도 달성

#### 3. 데이터 기반 모델링의 중요성
- **실제 데이터 활용**: 과거 실행 기록을 기반으로 한 현실적인 모델 구축
- **지속적 개선**: 새로운 데이터를 통한 모델 재훈련으로 정확도 지속 향상
- **도메인 특화**: BigQuery 특성에 맞는 맞춤형 예측 모델 개발

### 비즈니스 가치

#### 1. 비용 절감 효과
- **예상치 못한 비용 방지**: 긴 실행 시간으로 인한 예상치 못한 BigQuery 비용 발생 방지
- **리소스 최적화**: 효율적인 리소스 배치를 통한 전체적인 비용 절감
- **예산 계획 개선**: 정확한 실행 시간 예측을 통한 예산 계획 수립

#### 2. 개발 생산성 향상
- **빠른 피드백**: 쿼리 실행 전에 성능 문제를 미리 파악하여 개발 속도 향상
- **자동화된 최적화**: 수동 최적화 과정을 자동화하여 개발자 시간 절약
- **학습 효과**: 최적화 제안을 통한 개발자의 쿼리 작성 기술 향상

#### 3. 운영 효율성 증대
- **작업 스케줄링**: 정확한 실행 시간 예측을 통한 효율적인 작업 계획
- **모니터링 강화**: 실시간 모니터링을 통한 문제 조기 발견 및 대응
- **품질 관리**: 일관된 성능 기준을 통한 쿼리 품질 관리

### 향후 발전 방향

#### 1. 고도화된 예측 모델
- **딥러닝 모델 도입**: LSTM, Transformer 등을 활용한 시계열 예측 모델
- **다중 특성 모델**: 쿼리 복잡도, 데이터 분포, 시간대 등을 고려한 종합 모델
- **실시간 학습**: 스트리밍 데이터를 활용한 실시간 모델 업데이트

#### 2. 지능형 최적화 시스템
- **자동 쿼리 리라이팅**: AI를 활용한 쿼리 자동 최적화
- **인덱스 추천**: 데이터 특성을 분석한 최적 인덱스 자동 추천
- **파티션 전략**: 데이터 분포를 분석한 최적 파티션 전략 제안

#### 3. 통합 플랫폼 구축
- **웹 대시보드**: 시각적 모니터링 및 관리 인터페이스
- **API 생태계**: 다양한 도구와의 연동을 위한 RESTful API
- **알림 시스템**: Slack, Teams 등 다양한 채널을 통한 알림 통합

이 실행 시간 추정 자동화 시스템을 통해 BigQuery 사용자들이 더욱 효율적이고 예측 가능한 데이터 분석 환경을 구축할 수 있습니다. 특히 Dry Run을 활용한 사전 예측과 데이터 기반 모델링을 통해 실제 비즈니스 가치를 창출하는 혁신적인 접근 방식을 보여주는 프로젝트입니다.
