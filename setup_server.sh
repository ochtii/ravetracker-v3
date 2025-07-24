#!/bin/bash

# RaveTracker v3.0 - Server Setup Script
# ======================================
# Run this script as root on your server (3.68.110.79)

echo "🏗️ RaveTracker v3.0 - Server Setup"
echo "=================================="
echo "📅 $(date)"
echo "🖥️ Server: $(hostname)"
echo "📍 IP: $(hostname -I | awk '{print $1}')"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root"
    echo "💡 Use: sudo bash setup_server.sh"
    exit 1
fi

echo "✅ Running as root"

# Create deploy user
echo ""
echo "👤 Creating deploy user..."
if id "deploy" &>/dev/null; then
    echo "✅ User 'deploy' already exists"
else
    useradd -m -s /bin/bash deploy
    echo "✅ User 'deploy' created"
fi

# Add deploy to sudo group
usermod -aG sudo deploy
echo "✅ Added deploy to sudo group"

# Create SSH directory
echo ""
echo "🔑 Setting up SSH for deploy user..."
mkdir -p /home/deploy/.ssh
echo "✅ SSH directory created"

# Add the public key
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID6agAsv7vpXLnpWeR1Ipc2BpYirRUisP5SSG2+ESUxf deploy@ravetracker" > /home/deploy/.ssh/authorized_keys
echo "✅ Public key added to authorized_keys"

# Set correct permissions
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
echo "✅ Permissions set correctly"

# Create project directory structure
echo ""
echo "📁 Creating project directories..."
mkdir -p /var/www/ravetracker-v3
chown -R deploy:deploy /var/www/ravetracker-v3
chmod -R 755 /var/www/ravetracker-v3
echo "✅ Project directory created: /var/www/ravetracker-v3"

# Install essential packages
echo ""
echo "📦 Installing essential packages..."
apt update
apt install -y curl wget git nginx nodejs npm

# Install Node.js 20 if needed
if ! node --version | grep -q "v20"; then
    echo "📦 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Configure firewall
echo ""
echo "🛡️ Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow ssh
    ufw allow 'Nginx HTTP'
    ufw allow 80/tcp
    ufw allow 3000/tcp
    echo "✅ Firewall configured"
else
    echo "⚠️ UFW not available, manual firewall configuration may be needed"
fi

# Test deploy user SSH setup
echo ""
echo "🧪 Testing deploy user setup..."
echo "👤 Deploy user info:"
id deploy
echo "📁 Home directory:"
ls -la /home/deploy/
echo "🔑 SSH setup:"
ls -la /home/deploy/.ssh/
echo "📋 Authorized keys:"
cat /home/deploy/.ssh/authorized_keys

echo ""
echo "🎉 Server setup completed!"
echo "========================="
echo "✅ Deploy user created with sudo access"
echo "✅ SSH key configured"
echo "✅ Project directory ready: /var/www/ravetracker-v3"
echo "✅ Essential packages installed"
echo "✅ Firewall configured"
echo ""
echo "🧪 Test SSH connection:"
echo "ssh deploy@$(hostname -I | awk '{print $1}')"
echo ""
echo "🚀 Ready for RaveTracker v3.0 deployment!"
