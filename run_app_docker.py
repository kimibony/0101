#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import time
import subprocess
import signal
import atexit
from pathlib import Path

def ensure_dirs():
    """필요한 디렉토리가 존재하는지 확인하고 없으면 생성합니다."""
    dirs = ['instance', 'uploads', 'templates', 'exports', 'aggregations']
    for d in dirs:
        Path(d).mkdir(exist_ok=True)
        print(f"디렉토리 확인: {d}")

def cleanup(process=None):
    """종료 시 프로세스를 정리합니다."""
    if process:
        try:
            # Windows에서는 SIGTERM 대신 taskkill 사용
            if sys.platform == 'win32':
                subprocess.run(['taskkill', '/F', '/T', '/PID', str(process.pid)], 
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        except Exception as e:
            print(f"프로세스 종료 중 오류: {e}")

def main():
    """메인 함수: 서버 시작"""
    print("Excel Processor 애플리케이션을 시작합니다...")
    
    # 필요한 디렉토리 생성
    ensure_dirs()
    
    # 현재 디렉토리를 app.py가 있는 디렉토리로 변경
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
    os.chdir(backend_dir)
    
    # 백엔드 서버 시작
    try:
        # 환경 변수 설정
        env = os.environ.copy()
        env['FLASK_APP'] = 'app.py'
        env['FLASK_ENV'] = 'production'
        
        # 서버 프로세스 시작 - 0.0.0.0으로 바인딩하여 외부 접속 허용
        print("백엔드 서버를 시작합니다...")
        port = int(os.environ.get("PORT", "5000"))
        flask_process = subprocess.Popen([
            sys.executable, 
            '-m', 'flask', 
            'run', 
            '--host=0.0.0.0'
            f'--port={port}'
        ], 
        env=env, 
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True)
        
        # 정리 함수 등록
        atexit.register(lambda: cleanup(flask_process))
        
        print("애플리케이션이 실행 중입니다. 종료하려면 Ctrl+C를 누르세요.")
        
        # 서버 로그 출력
        while True:
            line = flask_process.stdout.readline()
            if not line and flask_process.poll() is not None:
                print("서버가 종료되었습니다.")
                break
            
            if line:
                print(line.strip())
    
    except KeyboardInterrupt:
        print("\n사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"오류 발생: {e}")
    finally:
        cleanup(flask_process if 'flask_process' in locals() else None)
        print("애플리케이션이 종료되었습니다.")

if __name__ == "__main__":
    main() 