@echo off
start "CoalFlow API" cmd /k call "%~dp0start_backend.bat"
start "CoalFlow Dashboard" cmd /k call "%~dp0start_frontend.bat"
timeout /t 8 >nul
start http://localhost:5173
