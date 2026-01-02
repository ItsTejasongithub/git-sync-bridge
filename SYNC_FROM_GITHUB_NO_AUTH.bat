@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================
echo    DOWNLOAD LATEST CODE FROM GITHUB
echo ================================================
echo.

REM Get the script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PowerShell is not available!
    echo.
    pause
    exit /b 1
)

echo [1/3] Downloading latest code from GitHub...
echo.
echo Repository: https://github.com/ItsTejasongithub/git-sync-bridge
echo.

REM Download the latest code as ZIP using PowerShell
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/ItsTejasongithub/git-sync-bridge/archive/refs/heads/master.zip' -OutFile 'latest-code.zip'}"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to download code from GitHub!
    echo.
    echo Please check your internet connection.
    echo.
    pause
    exit /b 1
)

echo [OK] Code downloaded successfully!
echo.

echo [2/3] Extracting files...
echo.

REM Extract ZIP file using PowerShell
powershell -Command "& {Expand-Archive -Path 'latest-code.zip' -DestinationPath 'temp-extract' -Force}"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to extract files!
    pause
    exit /b 1
)

echo [OK] Files extracted successfully!
echo.

echo [3/3] Copying files to current directory...
echo.

REM Copy all files from extracted folder to current directory
xcopy "temp-extract\git-sync-bridge-master\*" "." /E /Y /I

if %ERRORLEVEL% EQU 0 (
    echo [OK] All files copied successfully!
) else (
    echo [WARN] Some files may not have been copied
)

echo.

REM Clean up temp folder
rd /S /Q "temp-extract"

echo.
echo ================================================
echo          DOWNLOAD COMPLETE!
echo ================================================
echo.
echo [SUCCESS] Latest code has been downloaded and extracted!
echo.
echo ------------------------------------------------
echo  FILES:
echo ------------------------------------------------
echo  - ZIP file saved as: latest-code.zip (backup)
echo  - All files extracted to current directory
echo ------------------------------------------------
echo.
echo ------------------------------------------------
echo  NEXT STEPS:
echo ------------------------------------------------
echo  1. Install dependencies if needed (npm install)
echo  2. Run START_GAME.bat to launch the game
echo ------------------------------------------------
echo.
pause
