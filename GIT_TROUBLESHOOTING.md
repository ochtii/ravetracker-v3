# RaveTracker v3.0 - Git Troubleshooting Guide
# ============================================

## 🚨 Quick Fix Commands

If you're seeing git permission errors, run these commands immediately:

```bash
# Option 1: Use the quick fix script
cd /var/www/ravetracker-v3
bash quick_git_fix.sh

# Option 2: Manual fix
sudo chown -R deploy:deploy /var/www/ravetracker-v3
sudo chmod -R 755 /var/www/ravetracker-v3/.git
sudo chmod 664 /var/www/ravetracker-v3/.git/FETCH_HEAD 2>/dev/null || true
```

## 🔍 Common Git Errors & Solutions

### Error: `cannot open '.git/FETCH_HEAD': Permission denied`

**Cause**: Mixed file ownership between root and deploy user

**Quick Fix**:
```bash
cd /var/www/ravetracker-v3
sudo chown -R deploy:deploy .git/
sudo chmod -R 755 .git/
git status  # Test if fixed
```

### Error: `fatal: could not read Username for 'https://github.com'`

**Cause**: HTTPS authentication not configured

**Fix**:
```bash
# Switch to SSH (recommended)
git remote set-url origin git@github.com:your-username/ravetracker-v3.git

# Or configure HTTPS token
git config credential.helper store
# Then enter token when prompted
```

### Error: `Permission denied (publickey)`

**Cause**: SSH key not properly configured

**Fix**:
```bash
# Check SSH key
ssh -T git@github.com

# If failed, add SSH key
ssh-add ~/.ssh/ravetracker_deploy
ssh-add -l  # List loaded keys
```

### Error: `fatal: not a git repository`

**Cause**: .git directory corrupted or missing

**Fix**:
```bash
cd /var/www/ravetracker-v3
git init
git remote add origin git@github.com:your-username/ravetracker-v3.git
git fetch origin main
git reset --hard origin/main
```

## 🧪 Diagnostic Commands

Use these to identify the exact issue:

```bash
# Check current directory and user
pwd
whoami
id

# Check git repository status
git status
git remote -v

# Check file permissions
ls -la .git/
ls -la .git/FETCH_HEAD

# Check ownership
stat .git/
stat .git/FETCH_HEAD

# Test git operations
git fetch --dry-run origin main
git log --oneline -3
```

## 🔧 Complete Fix Workflow

### Step 1: Diagnose
```bash
cd /var/www/ravetracker-v3
git status  # Should show the error
ls -la .git/FETCH_HEAD  # Check ownership
```

### Step 2: Fix Ownership
```bash
# As root or with sudo
sudo chown -R deploy:deploy /var/www/ravetracker-v3
```

### Step 3: Fix Permissions
```bash
# Set proper permissions
sudo chmod -R 755 /var/www/ravetracker-v3/.git
sudo find /var/www/ravetracker-v3/.git -type f -exec chmod 644 {} \;
sudo find /var/www/ravetracker-v3/.git -type d -exec chmod 755 {} \;
```

### Step 4: Test
```bash
# Test git operations
git status
git pull origin main
```

### Step 5: Verify
```bash
# Final verification
git log --oneline -5
git branch -v
git remote -v
```

## 🚨 Emergency Git Reset

If all else fails, completely reset the git repository:

```bash
cd /var/www/ravetracker-v3

# Backup current work
cp -r . ../ravetracker-v3-backup

# Remove git directory
sudo rm -rf .git

# Reinitialize
git init
git remote add origin git@github.com:your-username/ravetracker-v3.git

# Fetch and reset
git fetch origin main
git branch -M main
git reset --hard origin/main

# Fix ownership
sudo chown -R deploy:deploy .
```

## 🔑 SSH Key Setup (if needed)

```bash
# Generate new SSH key for deployment
ssh-keygen -t ed25519 -f ~/.ssh/ravetracker_deploy -N ""

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/ravetracker_deploy

# Configure git to use this key
git config core.sshCommand "ssh -i ~/.ssh/ravetracker_deploy"

# Test connection
ssh -T git@github.com
```

## 📋 Checklist After Fixing

- [ ] `git status` works without errors
- [ ] `git pull origin main` successfully fetches updates
- [ ] File ownership is `deploy:deploy` for all files
- [ ] .git directory has proper permissions (755 for dirs, 644 for files)
- [ ] SSH key is loaded and working
- [ ] Repository is on correct branch (main)

## 🔄 Automated Fix Scripts

### Quick Fix Script
```bash
bash quick_git_fix.sh
```

### GitHub Actions Workflow
```bash
# Trigger via GitHub Actions
# Workflow: "Fix Git Permissions"
# File: .github/workflows/fix-git-permissions.yml
```

## 📞 Common Scenarios

### Scenario 1: After server restart
**Problem**: SSH keys not loaded, git commands fail
**Solution**: `ssh-add ~/.ssh/ravetracker_deploy`

### Scenario 2: After running commands as root
**Problem**: Files owned by root, deploy user can't write
**Solution**: `sudo chown -R deploy:deploy /var/www/ravetracker-v3`

### Scenario 3: Permission denied on FETCH_HEAD
**Problem**: Specific file has wrong permissions
**Solution**: `sudo chmod 664 /var/www/ravetracker-v3/.git/FETCH_HEAD`

### Scenario 4: Git repository corrupted
**Problem**: .git directory is broken
**Solution**: Use the "Emergency Git Reset" procedure above

## 💡 Prevention Tips

1. **Always use the deploy user** for git operations
2. **Never run git commands as root** unless absolutely necessary
3. **Keep SSH keys properly loaded** in the SSH agent
4. **Use the quick fix script** for rapid resolution
5. **Monitor file ownership** after any manual interventions
