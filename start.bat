@echo off
echo =========================================
echo   Smarketing - NestJS + SQLite + React
echo =========================================

echo.
echo [1/2] Starting NestJS Backend (port 8000)...
cd backend-nest
start "Smarketing Backend" cmd /k "node dist/main.js"
cd ..

echo.
echo [2/2] Starting Frontend (port 5173)...
cd frontend
start "Smarketing Frontend" cmd /k "npm run dev"
cd ..

echo.
echo =========================================
echo  Frontend:   http://localhost:5173
echo  API:        http://localhost:8000/api/v1
echo  Swagger:    http://localhost:8000/docs
echo  Pricing:    http://localhost:5173/pricing
echo  Billing:    http://localhost:5173/billing
echo =========================================
echo.
echo  DB: SQLite (smarketing.db) - no setup needed
echo  For dev mode: npm run start:dev in backend-nest
echo =========================================
pause
