@echo off
title CoalFlow - NTPC Kaniha Full-Stack Production Server
echo ========================================================
echo  CoalFlow - NTPC Kaniha Full-Stack Production Server
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/2] Checking frontend production bundle...
if not exist "frontend\dist\index.html" (
    echo Building frontend...
    cd frontend
    call npm run build
    cd ..
)

echo.
echo [2/2] Starting unified server on http://localhost:5000 ...
echo (Both React frontend UI and Flask REST API running together)
echo.

cd backend
if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe app.py
) else (
    python app.py
)

pause
