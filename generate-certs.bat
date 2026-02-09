@echo off
setlocal enabledelayedexpansion
title BULLRUN - Generate HTTPS Certificates
color 0A

echo.
echo BULLRUN - HTTPS Certificate Generator (mkcert)
echo ================================================
echo.

REM Get the script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Check if mkcert is installed
where mkcert >nul 2>nul
if errorlevel 1 goto :no_mkcert
goto :mkcert_ok

:no_mkcert
echo [ERROR] mkcert is not installed!
echo.
echo Install it using Chocolatey (run PowerShell as Admin):
echo   choco install mkcert -y
echo.
echo Or download from: https://github.com/FiloSottile/mkcert/releases
echo.
pause
exit /b 1

:mkcert_ok

echo [1/3] Installing local CA (one-time setup)...
mkcert -install
echo.

REM Detect IP address
set "IP=192.168.0.67"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "TEMP_IP=%%a"
    for /f "tokens=* delims= " %%b in ("!TEMP_IP!") do set TEMP_IP=%%b
    echo !TEMP_IP! | findstr /b "192.168" >nul
    if !ERRORLEVEL! EQU 0 (
        set "IP=!TEMP_IP!"
    )
)

echo [2/3] Generating certificates for: !IP! localhost 127.0.0.1
echo.

REM Create certs directory if it doesn't exist
if not exist "BackEND\certs" mkdir "BackEND\certs"

REM Generate certificates
mkcert -cert-file "BackEND\certs\cert.pem" -key-file "BackEND\certs\key.pem" !IP! localhost 127.0.0.1 ::1

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to generate certificates!
    pause
    exit /b 1
)

echo.
echo [3/3] Copying CA certificate for client distribution...

REM Copy rootCA.pem for client distribution
for /f "tokens=*" %%a in ('mkcert -CAROOT') do set "CAROOT=%%a"
if exist "!CAROOT!\rootCA.pem" (
    copy "!CAROOT!\rootCA.pem" "BackEND\certs\rootCA.pem" >nul
    echo    Copied rootCA.pem to BackEND\certs\
)

echo.
echo ================================================
echo SUCCESS! Certificates generated:
echo   BackEND\certs\cert.pem     (server certificate)
echo   BackEND\certs\key.pem      (private key)
echo   BackEND\certs\rootCA.pem   (CA for clients)
echo.
echo NEXT STEPS:
echo   1. Run START_GAME.bat to start the server
echo   2. On each client PC, run INSTALL_CA_CLIENT.bat
echo      (or share BackEND\certs\rootCA.pem)
echo ================================================
echo.
pause
