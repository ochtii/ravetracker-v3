#!/bin/bash

# Test automatic updates by making a test commit
echo "🧪 Testing automatic GitHub → Server updates..."

echo ""
echo "📝 This script will:"
echo "   1. Make a small test change"
echo "   2. Commit and push to main branch"
echo "   3. Wait for GitHub Actions to trigger"
echo "   4. Check if the server received the update"

echo ""
read -p "🤔 Do you want to proceed with the test? (y/N): " confirm

if [[ $confirm != [yY] ]]; then
    echo "❌ Test cancelled"
    exit 0
fi

# Create a test file with timestamp
TEST_FILE="deploy/test-auto-update-$(date +%s).txt"
echo "🕐 Auto-update test triggered at: $(date)" > "$TEST_FILE"
echo "📋 Test ID: AUTO-UPDATE-$(date +%Y%m%d-%H%M%S)" >> "$TEST_FILE"

echo "📝 Created test file: $TEST_FILE"

# Commit and push
git add "$TEST_FILE"
git commit -m "🧪 Test auto-update: $(date +%Y-%m-%d_%H:%M:%S)"

echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Test commit pushed to GitHub!"
echo ""
echo "🔄 GitHub Actions should now:"
echo "   1. Detect the push to main branch"
echo "   2. Run the update-temp-build workflow"  
echo "   3. SSH to your server"
echo "   4. Update the temp_build directory"

echo ""
echo "🔍 Check the following:"
echo "   → GitHub Actions: https://github.com/ochtii/ravetracker-v3/actions"
echo "   → On server: ls -la /var/www/ravetracker-v3/temp_build/deploy/"
echo "   → Look for your test file: $TEST_FILE"

echo ""
echo "⏱️ Wait 1-2 minutes, then run ./check-auto-updates.sh on the server"
