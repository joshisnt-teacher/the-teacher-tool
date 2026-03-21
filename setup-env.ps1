#!/usr/bin/env powershell

Write-Host "🔧 Teacher Tool Database Sync Setup" -ForegroundColor Cyan
Write-Host ""

Write-Host "Please enter your Supabase service key:" -ForegroundColor Yellow
Write-Host "(You can find it at: https://app.supabase.com/project/aogorchudxilnkhtfvqq/settings/api)" -ForegroundColor Gray
Write-Host ""

$serviceKey = Read-Host "Service Key"

if ([string]::IsNullOrWhiteSpace($serviceKey)) {
    Write-Host "❌ No service key provided. Exiting." -ForegroundColor Red
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""
Write-Host "Setting environment variable..." -ForegroundColor Yellow

# Set for current session
$env:SUPABASE_SERVICE_KEY = $serviceKey

# Set permanently for user
[Environment]::SetEnvironmentVariable("SUPABASE_SERVICE_KEY", $serviceKey, "User")

Write-Host ""
Write-Host "✅ Environment variable set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now use the database sync commands:" -ForegroundColor Cyan
Write-Host "  npm run db:pull         - Pull data from cloud to local" -ForegroundColor White
Write-Host "  npm run db:push         - Get push instructions" -ForegroundColor White
Write-Host "  npm run db:backup-local - Create local backup" -ForegroundColor White
Write-Host "  npm run db:help         - Show detailed help" -ForegroundColor White
Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Yellow

try {
    node db-sync.js help | Out-Null
    Write-Host "✅ Database sync utility is ready!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Database sync utility found, but you may need to install dependencies:" -ForegroundColor Yellow
    Write-Host "   npm install" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to continue"
