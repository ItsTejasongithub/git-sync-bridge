@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================
echo       SYNC FROM GITHUB (REMOTE SERVER)
echo ================================================
echo.

REM Get the script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed!
    echo.
    echo Install from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

REM Check if this is a git repository
if not exist ".git" (
    echo [INIT] First time setup - Cloning repository...
    echo.
    cd ..
    git clone https://github.com/ItsTejasongithub/git-sync-bridge.git "BeautifulGameDesgin 2.0"
    cd "BeautifulGameDesgin 2.0"
    echo.
    echo [OK] Repository cloned successfully!
    echo.
    goto install_deps
)

REM Update remote URL to ensure it points to correct repository
echo [INFO] Verifying remote repository URL...
git remote set-url origin https://github.com/ItsTejasongithub/git-sync-bridge.git
echo.

REM Show current status
echo [1/4] Checking current status...
echo.
git status
echo.

REM Stash any local changes
echo [2/4] Saving local changes (if any)...
git stash
echo.

REM Pull latest changes
echo [3/4] Pulling latest changes from GitHub...
echo.

REM Try master branch first, then main
git pull origin master 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Master branch pull failed, trying main branch...
    git pull origin main 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Pull failed!
        echo.
        echo Possible reasons:
        echo 1. Network connection issue
        echo 2. Repository doesn't exist
        echo 3. Authentication required
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Latest changes pulled successfully!
echo.

:install_deps
echo [4/4] Installing dependencies...
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
pause
