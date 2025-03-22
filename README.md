# 엑셀 데이터 프로세서

엑셀 데이터 처리를 위한 웹 애플리케이션입니다. 이 애플리케이션은 Flask 백엔드와 React 프론트엔드로 구성되어 있으며, 깔끔한 UI로 데이터 변환 작업을 쉽게 수행할 수 있습니다.

## 주요 기능

1. **엑셀 파일 불러오기 및 내보내기**: 드래그 앤 드롭 기능 지원
2. **데이터 변환**: 특정 데이터를 다른 값으로 변경
3. **조건부 변환**: 여러 조건을 충족할 때 데이터 변경
4. **조건부 집계**: 특정 조건에 맞는 데이터 합산
5. **템플릿 기능**: 자주 사용하는 작업을 저장하고 재사용
6. **10가지 테마**: 다양한 UI 테마로 작업 환경 커스터마이징

## 설치 및 실행

### 필수 요구사항

- Python 3.6 이상
- Node.js 14 이상
- npm 6 이상

### 설치 방법

1. Python 가상환경 활성화:

```
# Windows
.\myenv\Scripts\activate

# macOS/Linux
source myenv/bin/activate
```

2. 백엔드 종속성 설치:

```
pip install flask flask-cors pandas openpyxl
```

3. 프론트엔드 종속성 설치:

```
cd frontend
npm install
cd ..
```

### 실행 방법

애플리케이션을 실행하는 방법:

```
python run.py
```

이 명령어는 Flask 백엔드와 React 프론트엔드를 모두 시작하고 자동으로 브라우저를 열어줍니다.

### 수동 실행

백엔드와 프론트엔드를 따로 실행하려면:

1. 백엔드 실행:
```
cd backend
python app.py
```

2. 프론트엔드 실행:
```
cd frontend
npm start
```

## 도커로 실행하기

### 필요 조건
- Docker 설치
- Docker Compose 설치

### 실행 방법

1. 프로젝트 루트 디렉토리에서 다음 명령어를 실행합니다:

```bash
docker-compose up -d
```

2. 애플리케이션은 다음 URL로 접근할 수 있습니다:
   - 웹 인터페이스: http://localhost
   - 백엔드 API: http://localhost/api

### 중지 방법

```bash
docker-compose down
```

### 로그 확인

```bash
docker-compose logs -f
```

### 개별 서비스 로그 확인

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 데이터 볼륨

다음 디렉토리들은 Docker 볼륨으로 마운트됩니다:
- `./instance`: 데이터베이스 파일
- `./uploads`: 업로드된 파일
- `./exports`: 내보내기된 파일
- `./aggregations`: 집계 결과

## 사용 방법

1. 엑셀 파일을 드래그 앤 드롭하거나 파일 선택 버튼을 클릭하여 업로드합니다.
2. 데이터 변환, 조건부 변환, 조건부 집계 등의 작업을 추가합니다.
3. "작업 실행" 버튼을 클릭하여 변환 작업을 수행합니다.
4. "결과 내보내기" 버튼을 클릭하여 변환된 데이터를 새 파일로 저장합니다.
5. 자주 사용하는 작업은 템플릿으로 저장하여 재사용할 수 있습니다.

## 테마 설정

우측 상단의 팔레트 아이콘을 클릭하여 10가지 테마 중 하나를 선택할 수 있습니다:

- 기본
- 다크
- 자연
- 바다
- 선셋
- 모노크롬
- 보라
- 핑크
- 다크 그린
- 블루베리 