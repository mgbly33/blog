@echo off
color 0C
title Stop Blog System

echo.
echo ========================================================
echo           Stopping All Blog Services
echo ========================================================
echo.

echo [1/2] Stopping Node.js servers...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo       OK - Node.js servers stopped
) else (
    echo       No running Node.js processes found
)

echo.
echo [2/2] Stopping MongoDB...
taskkill /F /IM mongod.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo       OK - MongoDB stopped
) else (
    echo       No running MongoDB processes found
)

echo.
echo ========================================================
echo              All Services Stopped
echo ========================================================
echo.
timeout /t 3 /nobreak >nul
