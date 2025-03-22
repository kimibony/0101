#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import time
import webbrowser
import threading
import subprocess
import signal
import atexit
import socket
from pathlib import Path

# 브라우저가 이미 열렸는지 확인하는 플래그
browser_opened = False

def ensure_dirs():
    """필요한 디렉토리가 존재하는지 확인하고 없으면 생성합니다."""
    dirs = ['instance', 'uploads', 'templates', 'exports', 'aggregations']
    for d in dirs:
        Path(d).mkdir(exist_ok=True)
        print(f"디렉토리 확인: {d}")

def is_port_open(port, host='localhost'):
    """지정된 포트가 열려 있는지 확인합니다."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.connect((host, port))
            return True
        except:
            return False

def open_browser():
    """서버가 준비되면 브라우저를 엽니다."""
    global browser_opened
    
    # 플래그 확인 - 이미 브라우저가 열렸으면 함수 종료
    if browser_opened:
        return
    
    # 최대 15초 동안 서버가 시작되기를 기다림
    attempts = 30
    for i in range(attempts):
        if is_port_open(5000):
            print(f"서버가 준비되었습니다. 브라우저를 엽니다.")
            webbrowser.open('http://localhost:5000')
            browser_opened = True  # 플래그 설정
            print("브라우저가 열렸습니다.")
            return
        time.sleep(0.5)  # 0.5초 대기
    
    print("서버가 시작되지 않았습니다. 브라우저를 열지 않습니다.")

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
    """메인 함수: 서버 시작 및 브라우저 열기"""
    print("Excel Processor 애플리케이션을 시작합니다...")
    
    # 필요한 디렉토리 생성
    ensure_dirs()
    
    # 현재 디렉토리를 app.py가 있는 디렉토리로 변경
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
    os.chdir(backend_dir)
    
    # 이미 실행 중인 프로세스 확인
    if is_port_open(5000):
        print("포트 5000이 이미 사용 중입니다. 이전 프로세스를 종료하세요.")
        # 브라우저는 한 번만 열기
        if not browser_opened:
            open_browser()
        return
    
    # 백엔드 서버 시작
    try:
        # 환경 변수 설정
        env = os.environ.copy()
        env['FLASK_APP'] = 'app.py'
        env['FLASK_ENV'] = 'production'
        
        # 서버 프로세스 시작
        print("백엔드 서버를 시작합니다...")
        flask_process = subprocess.Popen([sys.executable, '-m', 'flask', 'run'], 
                                         env=env, 
                                         stdout=subprocess.PIPE,
                                         stderr=subprocess.PIPE,
                                         text=True)
        
        # 정리 함수 등록
        atexit.register(lambda: cleanup(flask_process))
        
        # 브라우저 열기 - 단 한 번만
        print("잠시 후 브라우저가 자동으로 열립니다...")
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()
        
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