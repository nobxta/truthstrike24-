# Local cron simulator — runs every hour, hits the agent endpoint.
# Usage: open PowerShell, navigate to project, run:
#   .\scripts\local-cron.ps1
# Or schedule it via Windows Task Scheduler to run hourly.

param(
    [string]$Url = "http://localhost:3000/api/agent/post",
    [int]$IntervalMinutes = 60,
    [switch]$RunOnce
)

# Read CRON_SECRET from .env.local
$envFile = Join-Path $PSScriptRoot "..\\.env.local"
$secret = (Get-Content $envFile | Where-Object { $_ -match "^CRON_SECRET=" }) -replace "^CRON_SECRET=", ""

if (-not $secret) {
    Write-Error "CRON_SECRET not found in .env.local"
    exit 1
}

function Invoke-Agent {
    $ts = Get-Date -Format "HH:mm:ss"
    Write-Host ""
    Write-Host "[$ts] Triggering agent..." -ForegroundColor Cyan
    try {
        $start = Get-Date
        $r = Invoke-RestMethod -Uri $Url `
            -Method POST `
            -Headers @{ "x-cron-secret" = $secret } `
            -TimeoutSec 180
        $duration = ((Get-Date) - $start).TotalSeconds
        if ($r.success) {
            Write-Host "[$ts] SUCCESS in $([math]::Round($duration,1))s" -ForegroundColor Green
            Write-Host "       Title: $($r.post.title)"
            Write-Host "       URL: http://localhost:3000$($r.post.url)"
            Write-Host "       Image: $($r.post.featuredImage)"
            if ($r.source) { Write-Host "       Source: $($r.source)" -ForegroundColor DarkGray }
        } else {
            Write-Host "[$ts] FAILED: $($r.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "[$ts] ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Invoke-Agent

if ($RunOnce) { exit 0 }

Write-Host ""
Write-Host "Now running every $IntervalMinutes minutes. Press Ctrl+C to stop." -ForegroundColor Yellow

while ($true) {
    Start-Sleep -Seconds ($IntervalMinutes * 60)
    Invoke-Agent
}
