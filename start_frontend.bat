@echo off
cd /d "%~dp0frontend"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required. Install the current Node.js LTS release first.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing frontend packages...
  npm install
)
echo.
echo CoalFlow dashboard starting at http://localhost:5173
npm run dev
pause
