#!/bin/bash

# RaveTracker v3.0 - Quick Git Repository Fix
# ===========================================
# Fix for "fatal: not a git repository" error

echo "🚨 RaveTracker v3.0 - Git Repository Fix"
echo "========================================"
echo "📅 $(date)"
echo "👤 Current User: $(whoami)"
echo "📁 Current Directory: $(pwd)"
echo ""

# Step 1: Navigate to the correct repository directory
echo "🔍 Step 1: Locating Git repository..."

REPO_DIR="/var/www/ravetracker-v3"
CURRENT_DIR=$(pwd)

echo "📍 Current location: $CURRENT_DIR"
echo "🎯 Target repository: $REPO_DIR"

# Check if we're in a subdirectory
if [[ "$CURRENT_DIR" == *"temp_build"* ]]; then
    echo "⚠️ You're in the temp_build directory!"
    echo "💡 The Git repository is in the parent directory"
    echo ""
    echo "🔄 Changing to repository directory..."
    cd "$REPO_DIR"
    echo "✅ Now in: $(pwd)"
elif [[ "$CURRENT_DIR" == "$REPO_DIR" ]]; then
    echo "✅ Already in the correct directory"
else
    echo "📂 Moving to repository directory..."
    cd "$REPO_DIR"
    echo "✅ Now in: $(pwd)"
fi

# Step 2: Verify Git repository
echo ""
echo "🔍 Step 2: Verifying Git repository..."

if [ -d ".git" ]; then
    echo "✅ .git directory found"
    echo "📊 Repository status:"
    ls -la .git/ | head -5
else
    echo "❌ .git directory not found!"
    echo "🚨 This is not a Git repository"
    echo ""
    echo "🔧 Need to initialize or clone repository"
    echo "💡 Run one of these commands:"
    echo "   Option 1: git init && git remote add origin git@github.com:ochtii/ravetracker-v3.git"
    echo "   Option 2: cd /var/www && rm -rf ravetracker-v3 && git clone git@github.com:ochtii/ravetracker-v3.git"
    exit 1
fi

# Step 3: Check Git status
echo ""
echo "🧪 Step 3: Testing Git operations..."

echo "Testing git status..."
if git status >/dev/null 2>&1; then
    echo "✅ Git repository is working"
    git status --short
else
    echo "❌ Git repository has issues"
    echo "📄 Error details:"
    git status 2>&1 | head -3
    echo ""
    echo "🔧 Applying quick fix..."
    
    # Apply the git permission fix
    echo "Fixing ownership and permissions..."
    sudo chown -R deploy:deploy "$REPO_DIR" 2>/dev/null || chown -R deploy:deploy "$REPO_DIR" 2>/dev/null
    chmod -R 755 "$REPO_DIR/.git" 2>/dev/null
    
    echo "Testing again..."
    if git status >/dev/null 2>&1; then
        echo "✅ Git fixed and working!"
    else
        echo "⚠️ Still having issues - may need manual intervention"
    fi
fi

# Step 4: Check remote configuration
echo ""
echo "🌐 Step 4: Checking remote configuration..."

echo "Remote repositories:"
git remote -v

echo ""
echo "Current branch:"
git branch -v

# Step 5: Attempt git pull
echo ""
echo "🚀 Step 5: Attempting git pull..."

echo "Running: git pull origin main"
if git pull origin main; then
    echo "🎉 SUCCESS! Repository updated successfully!"
else
    echo "⚠️ Git pull encountered issues"
    echo ""
    echo "📋 Possible causes:"
    echo "   • Network connectivity issues"
    echo "   • SSH key not configured"
    echo "   • No new changes to pull"
    echo "   • Merge conflicts"
    echo ""
    echo "🔧 Try these diagnostic commands:"
    echo "   git fetch origin main"
    echo "   git log --oneline -5"
    echo "   ssh -T git@github.com"
fi

# Final summary
echo ""
echo "📊 Final Status:"
echo "==============="
echo "📁 Repository Directory: $(pwd)"
echo "🌟 Git Status: $(git status --porcelain | wc -l) changes"
echo "🌐 Remote: $(git remote get-url origin 2>/dev/null || echo 'Not configured')"
echo "🌿 Branch: $(git branch --show-current 2>/dev/null || echo 'Unknown')"
echo ""
echo "🎯 Quick Commands Reference:"
echo "git status              # Check repository status"
echo "git log --oneline -5    # View recent commits"
echo "git pull origin main    # Pull latest changes"
echo "git push origin main    # Push local changes"
echo ""
echo "✅ Git Repository Fix Complete!"
