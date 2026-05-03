@echo off
color 0B
title Generate Test Data

echo.
echo ========================================================
echo              Generate Test Data
echo ========================================================
echo.
echo This will generate:
echo  - 10 user accounts
echo  - 20 blog posts
echo  - 5 categories
echo  - 10 tags
echo  - Comments
echo.
echo [WARNING] This will clear existing data!
echo.

set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo.
    echo Operation cancelled.
    timeout /t 2 /nobreak >nul
    exit /b 0
)

cd /d "%~dp0"

echo.
echo [INFO] Generating test data...
echo.

npx ts-node seed.js

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo            Test Data Generated Successfully!
    echo ========================================================
    echo.
    echo Default admin account:
    echo  Username: admin
    echo  Password: admin123
    echo.
    echo Default test accounts:
    echo  Username: testuser1 ~ testuser9
    echo  Password: 123456
    echo.
) else (
    color 0C
    echo.
    echo [ERROR] Failed to generate test data!
    echo.
)

echo Press any key to close...
pause >nul
