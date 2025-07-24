#!/bin/bash

# RaveTracker v3.0 - SSH Connection Test
# =====================================

echo "🔍 RaveTracker SSH Connection Test"
echo "=================================="
echo "📅 $(date)"
echo ""

# Configuration
SERVER_IP="3.68.110.79"
SSH_USER="deploy"
SSH_KEY_NAME="ravetracker_deploy"

echo "🎯 Target Server: $SERVER_IP"
echo "👤 Username: $SSH_USER"
echo "🔑 Key: $SSH_KEY_NAME"
echo ""

# Test 1: Basic connectivity
echo "📡 Test 1: Basic connectivity to port 22..."
if timeout 5 bash -c "</dev/tcp/$SERVER_IP/22" 2>/dev/null; then
    echo "✅ Port 22 is reachable"
else
    echo "❌ Port 22 is not reachable"
    echo "💡 Check if the server is running and accessible"
    exit 1
fi

# Test 2: Check if SSH key exists locally
echo ""
echo "🔑 Test 2: Local SSH key check..."
if [ -f ~/.ssh/$SSH_KEY_NAME ]; then
    echo "✅ Private key found: ~/.ssh/$SSH_KEY_NAME"
    
    # Check key permissions
    KEY_PERMS=$(stat -c "%a" ~/.ssh/$SSH_KEY_NAME 2>/dev/null || stat -f "%Mp%Lp" ~/.ssh/$SSH_KEY_NAME 2>/dev/null)
    if [ "$KEY_PERMS" = "600" ]; then
        echo "✅ Key permissions are correct (600)"
    else
        echo "⚠️ Key permissions are $KEY_PERMS, should be 600"
        echo "🔧 Fix with: chmod 600 ~/.ssh/$SSH_KEY_NAME"
    fi
    
    # Check key format
    if ssh-keygen -l -f ~/.ssh/$SSH_KEY_NAME >/dev/null 2>&1; then
        echo "✅ Key format is valid"
        echo "🔍 Key fingerprint: $(ssh-keygen -l -f ~/.ssh/$SSH_KEY_NAME)"
    else
        echo "❌ Key format is invalid"
        exit 1
    fi
else
    echo "❌ Private key not found: ~/.ssh/$SSH_KEY_NAME"
    echo ""
    echo "🔧 To create the SSH key:"
    echo "ssh-keygen -t ed25519 -f ~/.ssh/$SSH_KEY_NAME -N '' -C 'deploy@ravetracker'"
    echo ""
    echo "📋 Then add this public key to the server:"
    echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID6agAsv7vpXLnpWeR1Ipc2BpYirRUisP5SSG2+ESUxf deploy@ravetracker"
    exit 1
fi

# Test 3: SSH connection test
echo ""
echo "🚀 Test 3: SSH connection test..."
echo "Command: ssh -i ~/.ssh/$SSH_KEY_NAME -o ConnectTimeout=10 -o BatchMode=yes $SSH_USER@$SERVER_IP 'echo \"Success: \$(whoami)@\$(hostname)\"'"

if ssh -i ~/.ssh/$SSH_KEY_NAME -o ConnectTimeout=10 -o BatchMode=yes $SSH_USER@$SERVER_IP 'echo "Success: $(whoami)@$(hostname)"' 2>/dev/null; then
    echo "✅ SSH connection successful!"
else
    echo "❌ SSH connection failed"
    echo ""
    echo "🔍 Detailed connection attempt:"
    ssh -v -i ~/.ssh/$SSH_KEY_NAME -o ConnectTimeout=10 $SSH_USER@$SERVER_IP 'echo "Success: $(whoami)@$(hostname)"' 2>&1 | tail -20
    echo ""
    echo "🛠️ Possible fixes:"
    echo "1. 👤 Ensure deploy user exists on server"
    echo "2. 🔑 Add public key to server authorized_keys"
    echo "3. 🔒 Check file permissions on server"
    echo ""
    echo "📝 Server setup commands (run as root on $SERVER_IP):"
    echo "useradd -m -s /bin/bash deploy"
    echo "usermod -aG sudo deploy"
    echo "mkdir -p /home/deploy/.ssh"
    echo "echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID6agAsv7vpXLnpWeR1Ipc2BpYirRUisP5SSG2+ESUxf deploy@ravetracker' > /home/deploy/.ssh/authorized_keys"
    echo "chmod 700 /home/deploy/.ssh"
    echo "chmod 600 /home/deploy/.ssh/authorized_keys"
    echo "chown -R deploy:deploy /home/deploy/.ssh"
    exit 1
fi

echo ""
echo "🎉 All SSH tests passed!"
echo "========================"
echo "✅ Server is reachable"
echo "✅ SSH key is valid"
echo "✅ Authentication successful"
echo ""
echo "🚀 Ready for deployment!"
