@echo off
REM Dental Clinic CRM - Start Script for Windows CMD
REM Usage: start.bat [command]

title Dental Clinic CRM

echo.
echo ========================================
echo   Dental Clinic CRM - Startup Script
echo ========================================
echo.

if "%~1"=="" goto :dev
if /I "%~1"=="dev" goto :dev
if /I "%~1"=="start" goto :dev
if /I "%~1"=="backend" goto :backend
if /I "%~1"=="be" goto :backend
if /I "%~1"=="frontend" goto :frontend
if /I "%~1"=="fe" goto :frontend
if /I "%~1"=="setup" goto :setup
if /I "%~1"=="install" goto :setup
if /I "%~1"=="db" goto :db
if /I "%~1"=="database" goto :db
if /I "%~1"=="seed" goto :seed
if /I "%~1"=="studio" goto :studio
if /I "%~1"=="clean" goto :clean
if /I "%~1"=="check" goto :check
if /I "%~1"=="help" goto :help
if /I "%~1"=="--help" goto :help
if /I "%~1"=="-h" goto :help

echo [ERROR] Unknown command: %~1
goto :help

:dev
echo [INFO] Starting both backend and frontend...
npm run dev
goto :eof

:backend
echo [INFO] Starting backend server...
cd backend
npm run start:dev
goto :eof

:frontend
echo [INFO] Starting frontend dev server...
cd frontend
npm run dev
goto :eof

:setup
echo [INFO] Running initial setup...
call npm install
call npm run setup:env
echo [SUCCESS] Setup complete! Edit backend/.env with your database credentials.
pause
goto :eof

:db
echo [INFO] Setting up database...
cd backend
call npm run prisma:generate
call npm run prisma:migrate
echo [SUCCESS] Database setup complete!
pause
goto :eof

:seed
echo [INFO] Seeding database...
cd backend
npm run prisma:seed
goto :eof

:studio
echo [INFO] Opening Prisma Studio...
cd backend
npm run prisma:studio
goto :eof

:clean
echo [WARNING] Cleaning node_modules...
if exist node_modules rmdir /s /q node_modules
if exist backend\node_modules rmdir /s /q backend\node_modules
if exist frontend\node_modules rmdir /s /q frontend\node_modules
if exist backend\dist rmdir /s /q backend\dist
if exist frontend\dist rmdir /s /q frontend\dist
echo [SUCCESS] All node_modules cleaned!
pause
goto :eof

:check
echo [INFO] Checking prerequisites...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    pause
    exit /b 1
)
echo [SUCCESS] Node.js detected: 
node -v

echo [SUCCESS] npm detected: 
npm -v
echo [SUCCESS] All checks passed!
pause
goto :eof

:help
echo Usage: start.bat [command]
echo.
echo Commands:
echo   dev       Start both backend and frontend ^(default^)
echo   backend   Start only backend
echo   frontend  Start only frontend
echo   setup     Initial project setup
echo   db        Setup database ^(run migrations^)
echo   seed      Seed database with sample data
echo   studio    Open Prisma Studio
echo   clean     Clean all node_modules
echo   check     Check prerequisites
echo.
echo Examples:
echo   start.bat          - Start both servers
echo   start.bat setup    - First time setup
echo   start.bat db       - Setup database
pause
goto :eof
