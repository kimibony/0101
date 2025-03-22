FROM node:16-alpine as frontend-build

WORKDIR /app/frontend

# frontend 의존성 설치 및 빌드
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.9-slim

WORKDIR /app

# 필요한 패키지 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 코드 복사
COPY backend/ backend/

# 빌드된 프론트엔드 복사
COPY --from=frontend-build /app/frontend/build backend/static/

# Docker용 실행 스크립트 복사
COPY run_app_docker.py .

# 필요한 디렉토리 생성
RUN mkdir -p instance uploads templates exports aggregations

# 포트 설정
EXPOSE 5000

# 애플리케이션 실행
CMD ["python", "run_app_docker.py"] 