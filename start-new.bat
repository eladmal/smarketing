@echo off
echo =========================================
echo   Smarketing v2 - NestJS + PostgreSQL
echo =========================================

echo.
echo [1/2] Starting NestJS Backend...
cd backend-nest
start "Smarketing Backend (NestJS)" cmd /k "npm run start:dev"
cd ..

echo.
echo [2/2] Starting Frontend (React)...
cd frontend
start "Smarketing Frontend" cmd /k "npm run dev"
cd ..

echo.
echo =========================================
echo  Frontend:  http://localhost:5173
echo  API:       http://localhost:8000/api/v1
echo  Swagger:   http://localhost:8000/docs
echo =========================================
echo.
echo NOTE: Make sure PostgreSQL is running
echo and DATABASE_URL is set in backend-nest/.env
echo =========================================
pause
