@echo off
setlocal
REM Dev startup script (Windows)
REM Uses an ASCII-only Maven local repo path to avoid encoding/path issues

REM Java 17 path (adjust if needed)
set "JAVA_HOME=%USERPROFILE%\.jdks\corretto-17.0.12-1"
set "PATH=%JAVA_HOME%\bin;H:\apache-maven-3.5.3\bin;%PATH%"

REM Switch to backend directory (script directory)
cd /d "%~dp0"

REM Maven local repository (ASCII path)
if "%BLOG_M2_REPO%"=="" set "BLOG_M2_REPO=%~d0\blog-m2-repository\blog-backend"
if not exist "%BLOG_M2_REPO%" mkdir "%BLOG_M2_REPO%"
if errorlevel 1 (
  echo Failed to create Maven local repo: %BLOG_M2_REPO%
  echo You can set BLOG_M2_REPO to another writable ASCII path and retry.
  exit /b 1
)

echo Java version:
java -version

echo.
echo Maven local repo: %BLOG_M2_REPO%
echo Starting backend (dev profile)...
echo.

REM Start with dev profile
mvn -s "%~dp0local-settings.xml" spring-boot:run -Dspring-boot.run.profiles=dev
