@echo off
setlocal
set "JAVA_HOME=C:\Program Files\ojdkbuild\java-17-openjdk-17.0.3.0.6-1"
set "PATH=%JAVA_HOME%\bin;H:\apache-maven-3.5.3\bin;%PATH%"

cd /d "%~dp0"

if "%BLOG_M2_REPO%"=="" set "BLOG_M2_REPO=%~d0\blog-m2-repository\blog-backend"
if not exist "%BLOG_M2_REPO%" mkdir "%BLOG_M2_REPO%"
if errorlevel 1 (
  echo Failed to create Maven local repo: %BLOG_M2_REPO%
  echo You can set BLOG_M2_REPO to another writable ASCII path and retry.
  exit /b 1
)

echo Using Java:
java -version
echo.
echo Using Maven local repo: %BLOG_M2_REPO%
echo Compiling...
call mvn -s "%~dp0local-settings.xml" compile
pause
