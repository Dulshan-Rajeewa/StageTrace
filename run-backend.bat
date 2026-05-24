@echo off
cd /d "%~dp0backend"

if exist ".venv\Scripts\python.exe" goto run_server

echo Virtual environment not found. Initializing...
where uv >nul 2>nul
if %ERRORLEVEL% equ 0 goto use_uv

where python >nul 2>nul
if %ERRORLEVEL% equ 0 goto use_python

echo Error: Neither 'uv' nor 'python' was found in the PATH.
echo Please install Python (v3.13 or higher) or uv to set up the backend.
pause
exit /b 1

:use_uv
echo uv found, running 'uv sync'...
uv sync
if %ERRORLEVEL% neq 0 (
    echo Error: 'uv sync' failed.
    pause
    exit /b 1
)
goto run_server

:use_python
echo python found, creating virtual environment with 'python -m venv .venv'...
python -m venv .venv
if not exist ".venv\Scripts\python.exe" (
    echo Error: Failed to create virtual environment.
    pause
    exit /b 1
)
echo Extracting dependencies from pyproject.toml...
python -c "import tomllib; d=tomllib.load(open('pyproject.toml','rb')); open('temp_requirements.txt','w').write('\n'.join(d['project'].get('dependencies',[]) + d.get('dependency-groups',{}).get('dev',[])))"
echo Installing dependencies using pip...
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\python -m pip install -r temp_requirements.txt
del temp_requirements.txt
goto run_server

:run_server
echo Starting backend server on http://localhost:8000
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
pause