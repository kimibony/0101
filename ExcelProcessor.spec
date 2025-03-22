
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
