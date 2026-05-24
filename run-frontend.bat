@echo off
cd /d "%~dp0frontend"

if exist "node_modules" goto run_server

echo node_modules not found. Running 'npm install'...
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: npm was not found in the PATH.
    echo Please install Node.js and npm to set up the frontend.
    pause
    exit /b 1
)

call npm install
if %ERRORLEVEL% neq 0 (
    echo Error: 'npm install' failed.
    pause
    exit /b 1
)

:run_server
echo Starting frontend development server...
call npm run dev
pause