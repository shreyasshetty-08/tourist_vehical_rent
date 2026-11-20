# DriveEase Backend Launcher for VS Code PowerShell Terminal
Write-Host "Starting DriveEase Python FastAPI Backend on port 8000..." -ForegroundColor Cyan
& ".\venv\Scripts\python.exe" -m uvicorn backend.main:app --reload --port 8000
