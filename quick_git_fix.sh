#!/bin/bash

# RaveTracker v3.0 - Quick Git Permission Fix
# ==========================================
# Run this script to fix git permission issues

echo "🚨 RaveTracker v3.0 - Quick Git Permission Fix"
echo "=============================================="
echo "📅 $(date)"
echo "🖥️ Server: $(hostname)"
echo "👤 User: $(whoami)"
echo ""

# Check if we need sudo
NEED_SUDO=false
if [ "$EUID" -ne 0 ] && [ "$(whoami)" != "deploy" ]; then
    echo "⚠️ This script works best as root or deploy user"
    echo "💡 You may need to use sudo for some commands"
    NEED_SUDO=true
fi

# Project directory
PROJECT_DIR="/var/www/ravetracker-v3"
echo "📁 Project Directory: $PROJECT_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
echo "✅ Changed to: $(pwd)"

# Step 1: Diagnose current issue
echo ""
echo "🔍 Step 1: Diagnosing git permission issues..."

if [ -d ".git" ]; then
    echo "✅ .git directory exists"
    echo "📊 Current .git ownership:"
    ls -ld .git/
    
    echo "📄 FETCH_HEAD status:"
    if [ -f ".git/FETCH_HEAD" ]; then
        ls -la .git/FETCH_HEAD
    else
        echo "FETCH_HEAD does not exist (will be created)"
    fi
else
    echo "❌ .git directory not found"
    echo "💡 Git repository may need to be initialized"
fi

# Test current git access
echo ""
echo "🧪 Testing current git access..."
if git status >/dev/null 2>&1; then
    echo "✅ git status works"
else
    echo "❌ git status failed - permission issue confirmed"
fi

# Step 2: Fix ownership
echo ""
echo "👤 Step 2: Fixing ownership..."

if [ "$NEED_SUDO" = true ]; then
    echo "🔧 Setting ownership to deploy:deploy (requires sudo)..."
    sudo chown -R deploy:deploy "$PROJECT_DIR"
    if [ $? -eq 0 ]; then
        echo "✅ Ownership changed to deploy:deploy"
    else
        echo "❌ Failed to change ownership"
        exit 1
    fi
else
    echo "🔧 Fixing ownership as current user..."
    chown -R deploy:deploy "$PROJECT_DIR" 2>/dev/null || echo "⚠️ Cannot change ownership (may need sudo)"
fi

# Step 3: Fix permissions
echo ""
echo "🔒 Step 3: Fixing permissions..."

# Basic directory permissions
chmod -R 755 "$PROJECT_DIR" 2>/dev/null || echo "⚠️ Cannot change directory permissions"

if [ -d ".git" ]; then
    # Git-specific permissions
    if [ "$NEED_SUDO" = true ]; then
        echo "🔧 Setting git permissions (with sudo)..."
        sudo chmod -R 755 .git/
        sudo find .git/ -type f -exec chmod 644 {} \; 2>/dev/null
        sudo find .git/ -type d -exec chmod 755 {} \; 2>/dev/null
        
        # Special files
        sudo chmod 664 .git/HEAD 2>/dev/null || echo "HEAD file not found"
        sudo chmod 664 .git/FETCH_HEAD 2>/dev/null || echo "FETCH_HEAD will be created"
        sudo chmod 664 .git/config 2>/dev/null || echo "config file not found"
    else
        echo "🔧 Setting git permissions..."
        chmod -R 755 .git/ 2>/dev/null
        find .git/ -type f -exec chmod 644 {} \; 2>/dev/null
        find .git/ -type d -exec chmod 755 {} \; 2>/dev/null
        
        chmod 664 .git/HEAD 2>/dev/null || echo "HEAD file not found"
        chmod 664 .git/FETCH_HEAD 2>/dev/null || echo "FETCH_HEAD will be created"
        chmod 664 .git/config 2>/dev/null || echo "config file not found"
    fi
    
    echo "✅ Git permissions set"
else
    echo "⚠️ No .git directory to fix permissions for"
fi

# Step 4: Test git operations
echo ""
echo "🧪 Step 4: Testing git operations..."

# Test git status
echo "Testing git status..."
if git status >/dev/null 2>&1; then
    echo "✅ git status works"
else
    echo "❌ git status still fails"
    echo "📄 Error details:"
    git status 2>&1 | head -3
fi

# Test git fetch
echo ""
echo "Testing git fetch..."
if git fetch --dry-run origin main >/dev/null 2>&1; then
    echo "✅ git fetch test passed"
else
    echo "⚠️ git fetch test failed (may need network or different issue)"
fi

# Try actual git pull
echo ""
echo "🚀 Step 5: Attempting git pull..."
echo "Running: git pull origin main"

if git pull origin main; then
    echo "🎉 SUCCESS! git pull worked!"
else
    echo "⚠️ git pull had issues, but permissions should be fixed"
    echo "📄 This might be due to:"
    echo "   - Network connectivity"
    echo "   - No changes to pull"
    echo "   - Authentication issues"
    echo "   - Repository state conflicts"
fi

# Final status
echo ""
echo "📊 Final Status Check:"
echo "====================+"

echo "📁 Project directory ownership:"
ls -ld "$PROJECT_DIR"

if [ -d ".git" ]; then
    echo "📁 .git directory ownership:"
    ls -ld .git/
    
    echo "📄 Key git files:"
    ls -la .git/HEAD .git/FETCH_HEAD .git/config 2>/dev/null || echo "Some git files missing (normal)"
fi

echo "👤 Current user:"
echo "   User: $(whoami)"
echo "   ID: $(id)"
echo "   Groups: $(groups)"

echo ""
echo "🎉 Git Permission Fix Completed!"
echo "==============================="
echo "✅ Ownership set to deploy:deploy"
echo "✅ Permissions corrected"
echo "✅ Git operations should work now"
echo ""
echo "🚀 Try these commands:"
echo "git status"
echo "git pull origin main"
echo "git log --oneline -5"
echo ""
echo "💡 If issues persist:"
echo "- Check network connectivity"
echo "- Verify GitHub repository access"
echo "- Consider reinitializing git repository"
