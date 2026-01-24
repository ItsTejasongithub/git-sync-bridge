@echo off
setlocal enabledelayedexpansion
title Rupee Rush - Docker Launcher
color 0A

echo.
echo ╔════════════════════════════════════════╗
echo ║   RUPEE RUSH - Game Launcher           ║
echo ║   Powered by Docker                    ║
echo ╚════════════════════════════════════════╝
echo.

REM Get the script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM ========================================
REM STEP 1: Check Docker
REM ========================================
echo [1/5] Checking Docker...
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
REM STEP 2: Smart IP Detection
REM ========================================
echo [2/5] Detecting network...

set "IP="
set "FOUND_67=NO"

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "TEMP_IP=%%a"
    for /f "tokens=* delims= " %%b in ("!TEMP_IP!") do set TEMP_IP=%%b

    if "!TEMP_IP!"=="192.168.0.67" (
        set "IP=192.168.0.67"
        set "FOUND_67=YES"
        goto :ip_found
    )

    echo !TEMP_IP! | findstr /b "192.168" >nul
    if !ERRORLEVEL! EQU 0 (
        if "!IP!"=="" set "IP=!TEMP_IP!"
    )
)
:ip_found

if "!IP!"=="" set "IP=localhost"
echo Network: !IP!
echo.

REM ========================================
REM STEP 3: Pull Latest Changes
REM ========================================
echo [3/5] Pulling latest code...
git pull >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Code updated!
) else (
    echo Note: Git pull skipped
)
echo.

REM ========================================
REM STEP 4: Start Docker Containers
REM ========================================
echo [4/5] Starting Docker containers...
docker compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start Docker containers!
    timeout /t 10
    exit /b 1
)
timeout /t 5 /nobreak >nul
echo.

REM ========================================
REM STEP 5: Open Browser
REM ========================================
echo [5/5] Opening browser...
start http://localhost:5173
timeout /t 2 /nobreak >nul

REM ========================================
REM Display Status
REM ========================================
cls
color 0A
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║                                                   ║
echo ║    RUPEE RUSH - GAME RUNNING ✓ (Docker)          ║
echo ║                                                   ║
echo ╚═══════════════════════════════════════════════════╝
echo.
echo ┌───────────────────────────────────────────────────┐
echo │  PLAY THE GAME                                    │
echo └───────────────────────────────────────────────────┘
echo.
echo   This Computer:
echo   → http://localhost:5173
echo.
echo   Network Players (Same WiFi):
echo   → http://!IP!:5173
echo.
echo ┌───────────────────────────────────────────────────┐
echo │  SERVER STATUS                                    │
echo └───────────────────────────────────────────────────┘
echo.
echo   Database:   PostgreSQL (Docker) ✓
echo   BackEND:    Running on port 3001 ✓
echo   FrontEND:   Running on port 5173 ✓
echo.
echo ┌───────────────────────────────────────────────────┐
echo │  COMMANDS                                         │
echo └───────────────────────────────────────────────────┘
echo.
echo   Stop Game:      Run STOP_GAME.bat
echo   View Logs:      docker compose logs -f
echo   Docker Status:  docker ps
echo.
echo ═══════════════════════════════════════════════════
echo.
echo This window can be closed safely.
echo Containers will continue in background.
echo.
pause
