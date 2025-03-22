#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import subprocess
import sys

# 현재 디렉토리 확인
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(current_dir, 'frontend')

try:
    print("프론트엔드로 이동 중...")
    os.chdir(frontend_dir)
    
    print("프론트엔드 서버 시작 중...")
    print("프론트엔드 URL: http://localhost:3000")
    
    # Windows에서 npm start 실행
    # 실행 후 스크립트가 종료되지 않도록 wait=True 설정
    if os.name == 'nt':  # Windows
        os.system("npm start")
    else:
        subprocess.run(["npm", "start"], check=True)
    
except Exception as e:
    print(f"오류 발생: {str(e)}")
    input("아무 키나 눌러 종료하세요...") 