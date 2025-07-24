#!/bin/bash

# SSH Connection Diagnostic Script
# Run this to debug SSH connectivity issues

echo "🔍 SSH Connection Diagnostics"
echo "============================="

# Check if secrets are properly set
echo "📋 Checking GitHub Secrets..."
if [ -z "$HOST" ]; then
    echo "❌ HOST secret not set"
else
    echo "✅ HOST: $HOST"
fi

if [ -z "$USERNAME" ]; then
    echo "❌ USERNAME secret not set"
else
    echo "✅ USERNAME: $USERNAME"
fi

if [ -z "$SSH_KEY" ]; then
    echo "❌ SSH_KEY secret not set"
else
    echo "✅ SSH_KEY is set (length: ${#SSH_KEY} chars)"
fi

# Test basic connectivity
echo ""
echo "🌐 Testing network connectivity..."
if command -v nc &> /dev/null; then
    PORT=${PORT:-22}
    echo "Testing connection to $HOST:$PORT..."
    
    if timeout 10 nc -z "$HOST" "$PORT"; then
        echo "✅ Port $PORT is open on $HOST"
    else
        echo "❌ Cannot connect to $HOST:$PORT"
        echo "💡 Possible issues:"
        echo "   - Server is down"
        echo "   - Firewall blocking connection"
        echo "   - Wrong port number"
        echo "   - Network connectivity issues"
    fi
else
    echo "⚠️ netcat not available for port testing"
fi

# SSH key format check
echo ""
echo "🔑 SSH Key diagnostics..."
if [ ! -z "$SSH_KEY" ]; then
    echo "$SSH_KEY" | head -1 | grep -q "BEGIN" && echo "✅ SSH key appears to have correct header" || echo "❌ SSH key format might be incorrect"
    echo "$SSH_KEY" | tail -1 | grep -q "END" && echo "✅ SSH key appears to have correct footer" || echo "❌ SSH key format might be incorrect"
fi

echo ""
echo "🚀 Connection test with verbose output..."
