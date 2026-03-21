@echo off
echo 🔧 Teacher Tool Database Sync Setup
echo.

echo Please enter your Supabase service key:
echo (You can find it at: https://app.supabase.com/project/aogorchudxilnkhtfvqq/settings/api)
echo.
set /p SERVICE_KEY="Service Key: "

if "%SERVICE_KEY%"=="" (
    echo ❌ No service key provided. Exiting.
    pause
    exit /b 1
)

echo.
echo Setting environment variable...
setx SUPABASE_SERVICE_KEY "%SERVICE_KEY%"

echo.
echo ✅ Environment variable set successfully!
echo.
echo You can now use the database sync commands:
echo   npm run db:pull       - Pull data from cloud to local
echo   npm run db:push       - Get push instructions
echo   npm run db:backup-local - Create local backup
echo.
echo Note: You may need to restart your terminal for the environment variable to take effect.
echo.
pause
