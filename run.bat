@echo off

REM Start Frontend
start "Frontend" cmd /k "cd /d C:\Users\manis\OneDrive\Desktop\accunite-attendance-system pr\frontend && npm start"

REM Start Backend
start "Backend" cmd /k "cd /d C:\Users\manis\OneDrive\Desktop\accunite-attendance-system pr\backend && npm run dev"
