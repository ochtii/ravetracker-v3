# RaveTracker v3.0 - SSH Key Display Script
# This script displays your SSH keys for GitHub Actions setup

Write-Host "🔐 RaveTracker v3.0 - SSH Keys Display" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$sshDir = "$env:USERPROFILE\.ssh"

if (Test-Path $sshDir) {
    Write-Host "📁 SSH Directory: $sshDir" -ForegroundColor Green
    
    # List all SSH files
    Write-Host "`n📋 Available SSH files:" -ForegroundColor Yellow
    Get-ChildItem -Path $sshDir | Format-Table Name, Length, LastWriteTime
    
    # Check for RaveTracker keys
    $privateKey = "$sshDir\ravetracker_deploy"
    $publicKey = "$sshDir\ravetracker_deploy.pub"
    
    if (Test-Path $privateKey -and Test-Path $publicKey) {
        Write-Host "✅ RaveTracker SSH keys found!" -ForegroundColor Green
        
        Write-Host "`n🔑 PUBLIC KEY (for server authorized_keys):" -ForegroundColor Yellow
        Write-Host "================================================" -ForegroundColor Yellow
        Get-Content $publicKey
        
        Write-Host "`n🔐 PRIVATE KEY (for GitHub SSH_KEY secret):" -ForegroundColor Yellow
        Write-Host "=============================================" -ForegroundColor Yellow
        Get-Content $privateKey
        
        Write-Host "`n📋 GitHub Secrets Setup:" -ForegroundColor Cyan
        Write-Host "------------------------" -ForegroundColor Cyan
        Write-Host "1. Go to: https://github.com/ochtii/ravetracker-v3/settings/secrets/actions" -ForegroundColor White
        Write-Host "2. Create these secrets:" -ForegroundColor White
        Write-Host "   SSH_KEY: Copy the PRIVATE KEY above (including BEGIN/END lines)" -ForegroundColor White
        Write-Host "   HOST: Your server IP or domain name" -ForegroundColor White
        Write-Host "   USERNAME: Your SSH username (ubuntu, root, deploy, etc.)" -ForegroundColor White
        Write-Host "   PORT: SSH port (usually 22)" -ForegroundColor White
        
        Write-Host "`n🖥️ Server Setup:" -ForegroundColor Cyan
        Write-Host "---------------" -ForegroundColor Cyan
        Write-Host "Run this on your server to add the public key:" -ForegroundColor White
        Write-Host "mkdir -p ~/.ssh" -ForegroundColor Gray
        Write-Host "echo '$(Get-Content $publicKey)' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
        Write-Host "chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
        Write-Host "chmod 700 ~/.ssh" -ForegroundColor Gray
        
    } else {
        Write-Host "⚠️ RaveTracker SSH keys not found!" -ForegroundColor Red
        Write-Host "Expected files:" -ForegroundColor Red
        Write-Host "  - $privateKey" -ForegroundColor Red
        Write-Host "  - $publicKey" -ForegroundColor Red
        
        Write-Host "`n💡 Generate new keys with:" -ForegroundColor Yellow
        Write-Host "ssh-keygen -t ed25519 -f `"$sshDir\ravetracker_deploy`" -C `"deploy@ravetracker`"" -ForegroundColor Gray
    }
    
} else {
    Write-Host "❌ SSH directory not found: $sshDir" -ForegroundColor Red
    Write-Host "💡 Create SSH directory and generate keys:" -ForegroundColor Yellow
    Write-Host "mkdir $sshDir" -ForegroundColor Gray
    Write-Host "ssh-keygen -t ed25519 -f `"$sshDir\ravetracker_deploy`" -C `"deploy@ravetracker`"" -ForegroundColor Gray
}

Write-Host "`n🔍 Test SSH connection with:" -ForegroundColor Cyan
Write-Host "ssh -i `"$sshDir\ravetracker_deploy`" username@your-server-ip" -ForegroundColor Gray

Write-Host "`n✅ Setup complete! Check SSH_SETUP_GUIDE.md for detailed instructions." -ForegroundColor Green
