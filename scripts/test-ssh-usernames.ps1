# RaveTracker v3.0 - SSH Username Discovery Script
# This script tests different common usernames to find the correct one

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 22
)

Write-Host "🔍 SSH Username Discovery for RaveTracker v3.0" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Server: $ServerIP" -ForegroundColor Yellow
Write-Host "Port: $Port" -ForegroundColor Yellow
Write-Host ""

$sshKey = "$env:USERPROFILE\.ssh\ravetracker_deploy"

if (-not (Test-Path $sshKey)) {
    Write-Host "❌ SSH key not found: $sshKey" -ForegroundColor Red
    Write-Host "💡 Run this script from the ravetracker-v3 directory" -ForegroundColor Yellow
    exit 1
}

$usernames = @(
    "ubuntu",
    "root", 
    "deoploy"
)

Write-Host "🧪 Testing usernames..." -ForegroundColor Yellow
Write-Host ""

$successfulUsernames = @()

foreach ($username in $usernames) {
    Write-Host "Testing: $username@$ServerIP" -ForegroundColor White
    
    # Test SSH connection with timeout
    $sshCommand = "ssh -i `"$sshKey`" -p $Port -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no $username@$ServerIP 'echo SUCCESS: Connected as \$USER on \$(hostname)'"
    
    try {
        $result = Invoke-Expression $sshCommand 2>$null
        if ($LASTEXITCODE -eq 0 -and $result -like "*SUCCESS*") {
            Write-Host "  ✅ SUCCESS: $username works!" -ForegroundColor Green
            Write-Host "     Result: $result" -ForegroundColor Gray
            $successfulUsernames += $username
        } else {
            Write-Host "  ❌ Failed: $username" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Failed: $username (error: $($_.Exception.Message))" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan

if ($successfulUsernames.Count -gt 0) {
    Write-Host "✅ Working usernames found:" -ForegroundColor Green
    foreach ($user in $successfulUsernames) {
        Write-Host "  - $user" -ForegroundColor Green
    }
    
    $recommendedUser = $successfulUsernames[0]
    Write-Host ""
    Write-Host "🎯 Recommended username: $recommendedUser" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 GitHub Secrets Configuration:" -ForegroundColor Cyan
    Write-Host "HOST: $ServerIP" -ForegroundColor White
    Write-Host "USERNAME: $recommendedUser" -ForegroundColor White
    Write-Host "PORT: $Port" -ForegroundColor White
    Write-Host "SSH_KEY: [your private key from ravetracker_deploy]" -ForegroundColor White
    
} else {
    Write-Host "❌ No working usernames found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Possible issues:" -ForegroundColor Yellow
    Write-Host "- Server IP is incorrect" -ForegroundColor White
    Write-Host "- SSH service not running on server" -ForegroundColor White
    Write-Host "- Firewall blocking SSH connections" -ForegroundColor White
    Write-Host "- SSH key not installed on server" -ForegroundColor White
    Write-Host "- Different SSH port being used" -ForegroundColor White
}

Write-Host ""
Write-Host "🔗 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update GitHub secrets with working username" -ForegroundColor White
Write-Host "2. Test connection with GitHub Actions workflow" -ForegroundColor White
Write-Host "3. Run deployment test" -ForegroundColor White
