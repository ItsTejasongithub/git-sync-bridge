@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================
echo     EXTRACT AND SETUP FROM ZIP FILE
echo ================================================
echo.

REM Get the script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Check if ZIP file exists
if not exist "git-sync-bridge-master.zip" (
    if not exist "latest-code.zip" (
        echo [ERROR] ZIP file not found!
        echo.
        echo Please download the ZIP file from:
        echo https://github.com/ItsTejasongithub/git-sync-bridge/archive/refs/heads/master.zip
        echo.
        echo Save it as: git-sync-bridge-master.zip
        echo Or rename it to: latest-code.zip
        echo.
        pause
        exit /b 1
    ) else (
        set "ZIP_FILE=latest-code.zip"
    )
) else (
    set "ZIP_FILE=git-sync-bridge-master.zip"
)

echo [1/3] Found ZIP file: !ZIP_FILE!
echo.

echo [2/3] Extracting files...
echo.

REM Extract ZIP file using PowerShell
powershell -Command "& {Expand-Archive -Path '!ZIP_FILE!' -DestinationPath 'temp-extract' -Force}"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to extract files!
    pause
    exit /b 1
)

echo [OK] Files extracted!
echo.

echo [INFO] Copying files to current directory...
echo.

REM Copy all files from extracted folder to current directory
REM This will overwrite existing files
xcopy "temp-extract\git-sync-bridge-master\*" "." /E /Y /I

if %ERRORLEVEL% EQU 0 (
    echo [OK] All files copied successfully!
) else (
    echo [WARN] Some files may not have been copied
)

echo.

REM Clean up temp folder
rd /S /Q "temp-extract"

echo [3/3] Installing dependencies...
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
echo          SETUP COMPLETE!
echo ================================================
echo.
echo [SUCCESS] Game is ready to run!
echo.
echo ------------------------------------------------
echo  NEXT STEPS:
echo ------------------------------------------------
echo  1. All files have been extracted and updated
echo  2. All dependencies have been installed
echo  3. Run START_GAME.bat to launch the game
echo ------------------------------------------------
echo.
echo ZIP file kept as backup: !ZIP_FILE!
echo.
pause
