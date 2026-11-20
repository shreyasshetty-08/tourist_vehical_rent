@echo off
echo Starting DriveEase Python FastAPI Backend on http://127.0.0.1:8000
.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
pause
