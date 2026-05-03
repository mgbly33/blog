@echo off
title Blog System - One Click Start

echo.
echo ========================================================
echo           Blog System - One Click Start
echo ========================================================
echo.

:: Check MongoDB
where mongod >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] MongoDB not found! Please install MongoDB first.
    echo Download: https://www.mongodb.com/try/download/community
    echo.
    pause
    exit /b 1
)

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js not found! Please install Node.js first.
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

:: Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] First run detected. Installing dependencies...
    echo.
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed!
    echo.
)

:: Create .env if not exists
if not exist ".env" (
    echo [INFO] Creating .env file...
    copy .env.example .env >nul
    echo [SUCCESS] .env file created!
    echo.
)

:: Create database directory
if not exist "data\db" (
    echo [INFO] Creating database directory...
    mkdir "data\db"
    echo [SUCCESS] Database directory created!
    echo.
)

:: Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [1/3] MongoDB is already running...
) else (
    echo [1/3] Starting MongoDB...
    start "MongoDB Server" /MIN mongod --dbpath data\db
    timeout /t 3 /nobreak >nul
    echo       OK - MongoDB started!
)

echo.
echo [2/3] Starting Blog Server...
start "Blog Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
echo       OK - Server starting...

echo.
echo [3/3] Waiting for server to be ready...
timeout /t 5 /nobreak >nul

echo       OK - Opening browser...
start http://localhost:3000

echo.
echo ========================================================
echo                  Startup Complete!
echo ========================================================
echo.
echo  Server: http://localhost:3000
echo  Database: MongoDB (localhost:27017)
echo.
echo  Tips:
echo  - First user registered will be admin
echo  - Close popup windows to stop the server
echo  - Run 'stop-all.bat' to stop all services
echo.
echo ========================================================
echo.
echo Press any key to close this window...
pause >nul
