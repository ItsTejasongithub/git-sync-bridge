@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================
echo    SYNC FROM GITHUB (NO AUTH REQUIRED)
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

echo [1/5] Downloading latest code from GitHub...
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

echo [2/5] Extracting files...
echo.

REM Extract ZIP file using PowerShell
powershell -Command "& {Expand-Archive -Path 'latest-code.zip' -DestinationPath 'temp-extract' -Force}"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to extract files!
    pause
    exit /b 1
)

echo [OK] Files extracted!
echo.

echo [3/5] Updating files (preserving local changes)...
echo.

REM Copy files from extracted folder to current directory
REM Exclude node_modules and other unnecessary folders
xcopy "temp-extract\git-sync-bridge-master\*" "." /E /Y /EXCLUDE:sync-exclude.txt

if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Some files may not have been copied
)

echo [OK] Files updated!
echo.

echo [4/5] Cleaning up temporary files...
echo.

REM Remove temporary files
rd /S /Q "temp-extract"
del "latest-code.zip"

echo [OK] Cleanup complete!
echo.

echo [5/5] Installing dependencies...
echo.

REM Install BackEND dependencies
if exist "BackEND" (
    echo [+] Installing BackEND dependencies...
    cd BackEND
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [WARN] BackEND npm install had issues
    ) else (
        echo [OK] BackEND dependencies installed
    )
    cd ..
    echo.
)

REM Install FrontEND dependencies
if exist "FrontEND" (
    echo [+] Installing FrontEND dependencies...
    cd FrontEND
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [WARN] FrontEND npm install had issues
    ) else (
        echo [OK] FrontEND dependencies installed
    )
    cd ..
    echo.
)

echo.
echo ================================================
echo          SYNC SUCCESSFUL!
echo ================================================
echo.
echo [SUCCESS] Remote server updated with latest code!
echo.
echo ------------------------------------------------
echo  NEXT STEPS:
echo ------------------------------------------------
echo  1. All dependencies have been installed
echo  2. Run START_GAME.bat to launch the game
echo  3. Game will start on configured ports
echo ------------------------------------------------
echo.
echo NOTE: This method does not require Git authentication
echo For version control, consider setting up Git credentials
echo.
pause
