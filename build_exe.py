#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import subprocess
import shutil
import tempfile

def print_step(message):
    """단계 메시지를 출력합니다."""
    print("\n" + "=" * 70)
    print(message)
    print("=" * 70)

def run_command(command, cwd=None):
    """명령을 실행하고 결과를 출력합니다."""
    print(f"실행: {command}")
    result = subprocess.run(command, shell=True, cwd=cwd, text=True)
    if result.returncode != 0:
        print(f"오류: 명령 실행 실패 (코드: {result.returncode})")
        sys.exit(1)
    return result

def main():
    """메인 함수: exe 빌드 과정을 수행합니다."""
    # 현재 디렉토리 확인
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    print_step("엑셀 프로세서 앱 exe 빌드 시작")
    print(f"작업 디렉토리: {current_dir}")
    
    # 필요한 디렉토리 생성
    for folder in ['build', 'dist']:
        if os.path.exists(folder):
            print(f"{folder} 디렉토리 삭제 중...")
            shutil.rmtree(folder)
    
    # 프론트엔드 빌드 유무 확인
    frontend_build_dir = os.path.join(current_dir, 'frontend', 'build')
    if not os.path.exists(frontend_build_dir):
        print_step("프론트엔드 빌드 필요")
        
        # frontend 디렉토리로 이동하여 빌드
        frontend_dir = os.path.join(current_dir, 'frontend')
        try:
            run_command("npm run build", cwd=frontend_dir)
        except Exception as e:
            print(f"프론트엔드 빌드 중 오류 발생: {e}")
            sys.exit(1)
    else:
        print("프론트엔드 빌드가 이미 존재합니다.")
    
    print_step("PyInstaller로 실행 파일 생성 중")
    
    # 임시 spec 파일 작성
    spec_content = """
# -*- mode: python ; coding: utf-8 -*-

import sys
import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# 필요한 패키지 모듈 수집
hidden_imports = collect_submodules('flask') + collect_submodules('werkzeug') + collect_submodules('sqlalchemy')

# 데이터 파일 추가
frontend_build = os.path.join('frontend', 'build')
frontend_files = [(os.path.join(frontend_build, file), os.path.join('frontend', 'build', os.path.dirname(file))) 
                 for file in os.listdir(frontend_build) if os.path.isfile(os.path.join(frontend_build, file))]

for root, dirs, files in os.walk(os.path.join(frontend_build, 'static')):
    for file in files:
        file_path = os.path.join(root, file)
        rel_path = os.path.relpath(file_path, frontend_build)
        frontend_files.append((file_path, os.path.join('frontend', 'build', os.path.dirname(rel_path))))

a = Analysis(
    ['run_app.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('backend', 'backend'),
        (frontend_build, os.path.join('frontend', 'build')),
    ],
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'PyQt5', 'PySide6', 'tkinter'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ExcelProcessor',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
"""
    
    spec_path = os.path.join(current_dir, 'ExcelProcessor.spec')
    with open(spec_path, 'w', encoding='utf-8') as f:
        f.write(spec_content)
    
    print(f"spec 파일이 생성되었습니다: {spec_path}")
    
    # PyInstaller 실행
    run_command(f"{sys.executable} -m PyInstaller ExcelProcessor.spec --clean")
    
    print_step("빌드 완료")
    exe_path = os.path.join(current_dir, 'dist', 'ExcelProcessor.exe')
    
    if os.path.exists(exe_path):
        print(f"실행 파일이 생성되었습니다: {exe_path}")
        print("\n사용 방법: dist 폴더의 ExcelProcessor.exe를 실행하세요.")
    else:
        print("오류: 실행 파일이 생성되지 않았습니다.")
        sys.exit(1)

if __name__ == "__main__":
    main() 