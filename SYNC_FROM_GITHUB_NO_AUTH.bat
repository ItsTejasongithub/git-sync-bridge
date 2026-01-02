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
powershell -Command "& {Expand-Archive -Path 'latest-code.zip' -DestinationPath '.' -Force}"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to extract files!
    pause
    exit /b 1
)

echo [OK] Files extracted successfully!
echo.

echo [3/3] Renaming extracted folder...
echo.

REM Check if folder already exists and remove it
if exist "BeautifulGameDesgin-Latest" (
    rd /S /Q "BeautifulGameDesgin-Latest"
)

REM Rename the extracted folder to a cleaner name
ren "git-sync-bridge-master" "BeautifulGameDesgin-Latest"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Folder renamed to: BeautifulGameDesgin-Latest
) else (
    echo [WARN] Folder name: git-sync-bridge-master
)

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
echo  - ZIP file: latest-code.zip (backup)
echo  - Extracted to: BeautifulGameDesgin-Latest
echo ------------------------------------------------
echo.
echo ------------------------------------------------
echo  NEXT STEPS:
echo ------------------------------------------------
echo  1. Go to folder: BeautifulGameDesgin-Latest
echo  2. Install dependencies: npm install in BackEND and FrontEND
echo  3. Run START_GAME.bat to launch the game
echo ------------------------------------------------
echo.
pause
