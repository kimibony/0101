import os
import subprocess
import time
import sys
import webbrowser

def create_directories():
    """필요한 디렉토리 생성"""
    directories = ['uploads', 'templates', 'exports', 'aggregations']
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"디렉토리 생성: {directory}")

def run_backend():
    """Flask 백엔드 실행"""
    print("Flask 백엔드 시작 중...")
    # os.chdir('backend')
    # subprocess.Popen(['python', 'app.py'])
    # os.chdir('..')
    
    # 상대 경로 임포트 문제 해결을 위해 직접 Flask 앱 실행
    import flask
    from werkzeug.serving import run_simple
    
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
    
    # 현재 디렉토리를 backend로 설정
    os.environ['FLASK_APP'] = 'backend.app'
    
    # 백엔드 서버 새 프로세스로 실행
    if os.name == 'nt':  # Windows
        subprocess.Popen(['python', '-m', 'flask', 'run'], shell=True)
    else:
        subprocess.Popen(['python', '-m', 'flask', 'run'])
    
    time.sleep(2)  # 백엔드가 시작될 때까지 대기

def run_frontend():
    """React 프론트엔드 실행"""
    print("React 프론트엔드 시작 중...")
    os.chdir('frontend')
    
    # Windows에서 React 앱 실행
    if os.name == 'nt':
        subprocess.Popen(['npm', 'start'], shell=True)
    else:
        subprocess.Popen(['npm', 'start'])
    
    os.chdir('..')

def open_browser():
    """브라우저에서 애플리케이션 열기"""
    print("브라우저에서 애플리케이션 여는 중...")
    time.sleep(5)  # 프론트엔드가 시작될 때까지 대기
    webbrowser.open("http://localhost:3000")

def main():
    """애플리케이션 실행 메인 함수"""
    create_directories()
    run_backend()
    run_frontend()
    open_browser()
    
    print("\n애플리케이션이 실행 중입니다.")
    print("백엔드: http://localhost:5000")
    print("프론트엔드: http://localhost:3000")
    print("\n종료하려면 Ctrl+C를 누르세요.")
    
    try:
        # 사용자가 Ctrl+C를 누를 때까지 대기
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n애플리케이션을 종료합니다...")

if __name__ == "__main__":
    main() 