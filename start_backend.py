import os
import sys
import subprocess
import time

# 현재 디렉토리 확인
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')

print("Starting Flask backend server...")
print(f"현재 디렉토리: {current_dir}")
print(f"백엔드 디렉토리: {backend_dir}")

# 필요한 디렉토리 생성
def create_directories():
    directories = ['uploads', 'templates', 'exports', 'aggregations', 'instance']
    for directory in directories:
        dir_path = os.path.join(current_dir, directory)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
            print(f"디렉토리 생성: {dir_path}")

create_directories()

# 백엔드 패키지를 임포트할 수 있도록 시스템 경로에 추가
sys.path.insert(0, current_dir)

# 백엔드 디렉토리로 이동
os.chdir(backend_dir)

# Python 인코딩 설정
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 데이터베이스 파일 경로
db_path = os.path.join(current_dir, 'instance', 'excel_app.db')

# 데이터베이스 파일이 있으면 삭제
if os.path.exists(db_path):
    try:
        # 파일 사용 중이면 대기
        max_attempts = 5
        for attempt in range(max_attempts):
            try:
                os.remove(db_path)
                print(f"기존 데이터베이스 파일 삭제됨: {db_path}")
                break
            except PermissionError:
                if attempt < max_attempts - 1:
                    print(f"데이터베이스 파일이 사용 중입니다. 재시도 중... ({attempt+1}/{max_attempts})")
                    time.sleep(1)  # 1초 대기
                else:
                    raise
    except Exception as e:
        print(f"데이터베이스 파일 삭제 중 오류: {str(e)}")
        
        # 대안: 파일 이름 변경 후 삭제 시도
        try:
            backup_path = db_path + '.bak'
            if os.path.exists(backup_path):
                os.remove(backup_path)
            os.rename(db_path, backup_path)
            print(f"데이터베이스 파일 이름 변경됨: {db_path} -> {backup_path}")
        except Exception as e2:
            print(f"데이터베이스 파일 이름 변경 중 오류: {str(e2)}")
            print("주의: 데이터베이스 파일을 삭제하지 못했습니다. 수동으로 삭제해주세요.")

# 네트워크 지연 대기
print("네트워크 초기화 중...")
time.sleep(2)  # 네트워크 초기화 대기

print("백엔드 서버 시작 중...")
print("백엔드 URL: http://localhost:5000")

# Flask 앱 실행
os.environ['FLASK_APP'] = 'app.py'
os.environ['FLASK_ENV'] = 'development'
os.environ['FLASK_DEBUG'] = '1'

# app.py 직접 실행
try:
    # 디버그 모드로 Flask 실행
    os.system("flask run --debug")
    
except Exception as e:
    print(f"오류 발생: {str(e)}")
    input("아무 키나 눌러 종료하세요...") 