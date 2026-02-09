@echo off
title BULLRUN - Install CA Certificate (Client)
color 0A

echo.
echo BULLRUN - Install Trusted CA Certificate
echo ==========================================
echo.
echo This script installs the game server's CA certificate
echo so your browser trusts the HTTPS connection.
echo.
echo Run this ONCE on each player's PC.
echo.

REM Get the script directory
set "SCRIPT_DIR=%~dp0"

REM Check if rootCA.pem exists
if not exist "%SCRIPT_DIR%BackEND\certs\rootCA.pem" (
    echo [ERROR] rootCA.pem not found!
    echo.
    echo Expected at: %SCRIPT_DIR%BackEND\certs\rootCA.pem
    echo.
    echo Make sure you have copied the game files from the server,
    echo or run generate-certs.bat on the server first.
    echo.
    pause
    exit /b 1
)

echo Installing CA certificate into Windows trust store...
echo (You may see a security prompt - click YES to allow)
echo.

certutil -addstore -user "Root" "%SCRIPT_DIR%BackEND\certs\rootCA.pem"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo SUCCESS! CA certificate installed.
    echo.
    echo Your browser will now trust the game server.
    echo Close and reopen your browser, then visit:
    echo   https://192.168.0.67:5173
    echo ==========================================
) else (
    echo.
    echo [ERROR] Failed to install certificate.
    echo Try running this script as Administrator.
)

echo.
pause
