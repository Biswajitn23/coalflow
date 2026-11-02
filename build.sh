#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "========================================================"
echo " Building CoalFlow Full-Stack (React Vite + Python Flask)"
echo "========================================================"

echo ">>> [1/2] Installing frontend dependencies and building production bundle..."
cd frontend
npm install
npm run build
cd ..

echo ">>> [2/2] Installing backend Python dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "========================================================"
echo " Build successful! Ready for Gunicorn deployment."
echo "========================================================"
