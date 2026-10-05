# Fly.io Secrets Setup for PowerShell
# Run: .\fly-secrets.ps1

$frontendUrl = "https://your-app.vercel.app"  # CHANGE THIS AFTER VERCEL DEPLOY

$secrets = @{
    NODE_ENV = "production"
    PORT = "3001"
    FRONTEND_URL = $frontendUrl
    JWT_SECRET = [Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
    JWT_REFRESH_SECRET = [Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
    ENCRYPTION_KEY = ([Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))).Substring(0,32)
    RATE_LIMIT_WINDOW_MS = "900000"
    RATE_LIMIT_MAX_REQUESTS = "200"
}

# Optional: Add exchange API keys if you have them
# $secrets.BINANCE_API_KEY = "your-key"
# $secrets.BINANCE_API_SECRET = "your-secret"

Write-Host "Setting Fly.io secrets..." -ForegroundColor Cyan

foreach ($key in $secrets.Keys) {
    $value = $secrets[$key]
    Write-Host "Setting $key..." -NoNewline
    try {
        flyctl secrets set "$key=$value" --app risky-dex-backend
        Write-Host " ✓" -ForegroundColor Green
    } catch {
        Write-Host " ✗ $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nDone! Now run: flyctl deploy" -ForegroundColor Cyan