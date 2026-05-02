# -*- mode: python ; coding: utf-8 -*-
#
# PyInstaller spec for app.py.
#
# Why a spec file (not just CLI flags): PyInstaller's static analysis follows
# import statements but misses modules loaded dynamically (importlib, getattr
# on a package, plugin systems, etc.). When app.py is split into helper
# modules and one of those uses a dynamic import, the bundled binary crashes
# on first run with ModuleNotFoundError.
#
# Add any such modules to `hiddenimports` below. Same goes for non-Python
# data files (templates, JSON configs) — list them in `datas`.

block_cipher = None

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='app',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    icon='public/favicon.ico',
)

# One-dir build (NOT one-file). main.js looks for the executable at
# resources/app/app(.exe), which COLLECT produces. Switching to one-file
# would put the binary at resources/app.exe and break the production
# Flask spawn in main.js.
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='app',
)
