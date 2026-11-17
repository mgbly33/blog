@echo off
title Blog Forum Platform - MySQL and Redis

where docker >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Docker not found. Please start MySQL 8.x and Redis 7.x manually.
    pause
    exit /b 1
)

cd /d "%~dp0\.."
echo Starting MySQL and Redis through docker-compose.dev.yml...
docker compose -f docker\docker-compose.dev.yml up mysql redis
