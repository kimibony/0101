# Excel Processor

엑셀 파일 처리를 위한 웹 애플리케이션입니다.

## 기능

- 엑셀 파일 업로드 및 처리
- 사용자 계정 관리
- 데이터 분석 및 가공
- 결과 파일 다운로드

## 기술 스택

- 백엔드: Flask (Python)
- 프론트엔드: React
- 데이터 처리: Pandas
- 데이터베이스: SQLite

## Docker로 실행하기

### 사전 요구사항

- [Docker](https://www.docker.com/products/docker-desktop) 설치
- [Docker Compose](https://docs.docker.com/compose/install/) 설치 (대부분의 Docker Desktop에 포함됨)

### 실행 방법

1. 저장소를 클론합니다.
   ```bash
   git clone <저장소 URL>
   cd excel-processor
   ```

2. Docker Compose를 사용하여 애플리케이션을 빌드하고 실행합니다.
   ```bash
   docker-compose up -d
   ```

3. 브라우저에서 애플리케이션에 접속합니다.
   ```
   http://localhost:5000
   ```

4. 종료하려면 다음 명령어를 실행합니다.
   ```bash
   docker-compose down
   ```

### 관리자 계정

- 이메일: admin@example.com
- 비밀번호: admin123

## 직접 실행하기

### 백엔드 설정

1. Python 3.9 이상을 설치합니다.

2. 필요한 패키지를 설치합니다.
   ```bash
   pip install -r requirements.txt
   ```

3. 백엔드 서버를 시작합니다.
   ```bash
   python start_backend.py
   ```

### 프론트엔드 설정

1. Node.js와 npm을 설치합니다.

2. 프론트엔드 의존성을 설치합니다.
   ```bash
   cd frontend
   npm install
   ```

3. 개발 서버를 시작합니다.
   ```bash
   npm start
   ```

4. 프로덕션용 빌드를 생성합니다.
   ```bash
   npm run build
   ```

## 라이센스

본 프로젝트는 MIT 라이센스 하에 배포됩니다. 