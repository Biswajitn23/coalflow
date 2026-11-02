@echo off
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  py -m venv .venv
  if errorlevel 1 python -m venv .venv
)
call .venv\Scripts\activate.bat
echo Installing backend requirements...
python -m pip install --upgrade pip
pip install -r requirements.txt
echo.
echo CoalFlow API starting at http://127.0.0.1:5000
python app.py
pause
