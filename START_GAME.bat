@echo off
setlocal enabledelayedexpansion
title BULLRUN Game Server
color 0A

echo.
echo BULLRUN - Game Server Launcher
echo Docker + npm Development
echo.

REM Get the script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM ========================================
REM STEP 1: Check Docker
REM ========================================
echo [1/7] Checking Docker...
docker --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed or not running!
    echo.
    echo Please:
    echo 1. Install Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo 2. Start Docker Desktop
    echo 3. Run this script again
    echo.
    timeout /t 10
    exit /b 1
)
echo Docker is ready!
echo.

REM ========================================
REM STEP 2: Check Node.js
REM ========================================
echo [2/7] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Install from: https://nodejs.org/
    echo.
    timeout /t 10
    exit /b 1
)
echo Node.js is ready!
echo.

REM ========================================
REM STEP 3: Start Docker Services
REM ========================================
echo [3/7] Starting Docker services (Database)...
docker compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start Docker containers!
    timeout /t 10
    exit /b 1
)
timeout /t 3 /nobreak >nul
echo Docker services started!
echo.

REM ========================================
REM STEP 4: Smart IP Detection
REM ========================================
echo [4/7] Detecting network...

REM Try to get IP (prefer 192.168.0.67, fallback to any 192.168.x.x)
set "IP="
set "FOUND_67=NO"

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "TEMP_IP=%%a"
    for /f "tokens=* delims= " %%b in ("!TEMP_IP!") do set TEMP_IP=%%b

    REM Check if we have 192.168.0.67 (preferred)
    if "!TEMP_IP!"=="192.168.0.67" (
        set "IP=192.168.0.67"
        set "FOUND_67=YES"
        goto :ip_found
    )

    REM Otherwise collect any 192.168.x.x
    echo !TEMP_IP! | findstr /b "192.168" >nul
    if !ERRORLEVEL! EQU 0 (
        if "!IP!"=="" set "IP=!TEMP_IP!"
    )
)
:ip_found

REM If not using 192.168.0.67, show info
if "!FOUND_67!"=="NO" (
    if not "!IP!"=="" (
        echo.
        echo Current IP: !IP!
        echo.
        echo TIP: For stable connection, use STATIC IP: 192.168.0.67
        echo Run SET_STATIC_IP_ETHERNET.bat as Admin to set it permanently
        echo.
        timeout /t 2 >nul
    )
)

if "!IP!"=="" set "IP=localhost"
echo Network: !IP!
echo.

REM ========================================
REM STEP 5: Configure Frontend
REM ========================================
echo [5/7] Configuring frontend...
echo VITE_SERVER_URL=http://!IP!:3001 > FrontEND\.env.local
echo.

REM ========================================
REM STEP 6: Install Dependencies
REM ========================================
echo [6/7] Checking dependencies...

if not exist "BackEND\node_modules\" (
    echo Installing BackEND...
    cd BackEND
    call npm install --silent >nul 2>&1
    cd ..
)

if not exist "FrontEND\node_modules\" (
    echo Installing FrontEND...
    cd FrontEND
    call npm install --silent >nul 2>&1
    cd ..
)

echo Dependencies OK
echo.

REM ========================================
REM STEP 7: Start Servers
REM ========================================
echo [7/7] Starting servers...

cd BackEND
start /MIN "BackEND-Server" cmd /k "title BackEND Server && color 0B && npm run dev"
timeout /t 2 /nobreak >nul
cd ..

cd FrontEND
start /MIN "FrontEND-Server" cmd /k "title FrontEND Server && color 0E && npm run dev"
cd ..

echo.
echo [INIT] Initializing...
timeout /t 4 /nobreak >nul

REM ========================================
REM Open Browser
REM ========================================
echo [BROWSER] Opening game...
start http://localhost:5173
timeout /t 1 /nobreak >nul

REM ========================================
REM Display Status
REM ========================================
cls
color 0A
echo.
echo BULLRUN - SERVER RUNNING
echo.
echo PLAY THE GAME:
echo   This Computer:   http://localhost:5173
echo   Network Friends: http://!IP!:5173
echo.
echo SERVER STATUS:
echo   Database:   PostgreSQL (Docker)
echo   BackEND:    HTTP Port 3001
echo   FrontEND:   HTTP Port 5173
echo.
echo HOW TO USE:
echo   1. Share http://!IP!:5173 with friends
echo   2. Everyone on SAME WiFi
echo   3. To stop: Run STOP_GAME.bat
echo.
if not "!IP!"=="192.168.0.67" (
    echo TIP: Set Static IP 192.168.0.67
    echo      Right-click START_GAME.bat ^> Run as Admin
    echo.
)
echo Server windows are minimized in taskbar.
echo.
pause
