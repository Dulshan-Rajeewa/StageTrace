@echo off
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo Error: node_modules not found. Run 'npm install' in frontend/ first.
    pause
    exit /b 1
)
echo Starting frontend development server...
npm run dev
pause