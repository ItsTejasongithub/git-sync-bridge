@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================
echo    START DOCKER & RESTORE DATABASE
echo ================================================
echo.

REM Get the script directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo [ERROR] docker-compose.yml not found!
    echo Please make sure you're in the correct directory.
    echo.
    pause
    exit /b 1
)

REM Check if backup file exists
if not exist "backups\BullRun_DB_backup.sql" (
    echo [ERROR] Backup file not found!
    echo Please copy BullRun_DB_backup.sql to backups\ folder
    echo.
    pause
    exit /b 1
)

echo [1/5] Starting PostgreSQL container...
echo.

REM Start docker containers
docker-compose up -d

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start Docker!
    echo.
    pause
    exit /b 1
)

echo [OK] Container started!
echo.

REM Wait for PostgreSQL to initialize
echo [2/5] Waiting for PostgreSQL to initialize... ^(10 seconds^)
timeout /t 10 /nobreak

echo.
echo [3/5] Restoring database from backup...
echo.

REM Restore the database
powershell -Command "Get-Content backups/BullRun_DB_backup.sql | docker exec -i bullrun_postgres psql -U postgres -d BullRun_GameDB_PGSQL"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to restore database!
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Database restored!
echo.

echo [4/5] Verifying tables exist...
echo.

docker exec bullrun_postgres psql -U postgres -d BullRun_GameDB_PGSQL -c "\dt"

echo.
echo [5/5] Checking data integrity...
echo.

docker exec bullrun_postgres psql -U postgres -d BullRun_GameDB_PGSQL -c "SELECT COUNT(*) as total_records FROM asset_prices;"

echo.
echo ================================================
echo          SETUP COMPLETE!
echo ================================================
echo.
echo [SUCCESS] PostgreSQL is running and database restored!
echo.
echo ------------------------------------------------
echo  DATABASE INFO:
echo ------------------------------------------------
echo  Host: localhost
echo  Port: 5432
echo  Database: BullRun_GameDB_PGSQL
echo  Username: postgres
echo  Password: BullRun2024!
echo ------------------------------------------------
echo.
echo ------------------------------------------------
echo  CONNECTION STRING:
echo ------------------------------------------------
echo  postgres://postgres:BullRun2024!@localhost:5432/BullRun_GameDB_PGSQL
echo ------------------------------------------------
echo.
echo ------------------------------------------------
echo  USEFUL COMMANDS:
echo ------------------------------------------------
echo  View logs: docker-compose logs postgres
echo  Stop: docker-compose down
echo  Connect: psql -h localhost -U postgres -d BullRun_GameDB_PGSQL
echo ------------------------------------------------
echo.

pause