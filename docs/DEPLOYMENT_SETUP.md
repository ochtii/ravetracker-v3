# GitHub Actions SSH Deployment Setup

## 🔐 Required GitHub Secrets

To enable automatic deployment via GitHub Actions, you need to configure the following secrets in your repository:

### Setting up Secrets:
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of the following:

### Required Secrets:

#### `HOST`
- **Description**: Your server IP address or domain name
- **Example**: `192.168.1.100` or `your-server.com`
- **How to find**: 
  ```bash
  # On your server, run:
  curl ifconfig.me
  # Or check your hosting provider dashboard
  ```

#### `USERNAME`
- **Description**: SSH username for your server
- **Example**: `ubuntu`, `root`, `deploy`, or your custom username
- **How to find**:
  ```bash
  # Usually provided by your hosting provider
  # Common usernames: ubuntu (for Ubuntu), ec2-user (for Amazon Linux)
  ```

#### `SSH_KEY`
- **Description**: Your private SSH key content
- **Format**: Complete private key including headers
- **Example**:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAlwAAAAdzc2gtcn
  [... your private key content ...]
  -----END OPENSSH PRIVATE KEY-----
  ```
- **How to generate**:
  ```bash
  # Generate a new SSH key pair
  ssh-keygen -t ed25519 -C "github-actions@ravetracker-v3"
  
  # Copy private key (this goes in GitHub secret)
  cat ~/.ssh/id_ed25519
  
  # Copy public key (this goes on your server)
  cat ~/.ssh/id_ed25519.pub
  ```

#### `PORT` (Optional)
- **Description**: SSH port number
- **Default**: `22`
- **Example**: `22`, `2222`, `2200`

---

## 🖥️ Server Setup

### 1. Add SSH Public Key to Server
```bash
# On your server, add the public key to authorized_keys
mkdir -p ~/.ssh
echo "your-public-key-content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 2. Create Project Directory
```bash
# Create the deployment directory
sudo mkdir -p /var/www/ravetracker-v3
sudo chown $USER:$USER /var/www/ravetracker-v3
```

### 3. Test SSH Connection Locally
```bash
# Test from your local machine
ssh -i ~/.ssh/id_ed25519 username@your-server-ip

# Test with specific port if needed
ssh -i ~/.ssh/id_ed25519 -p 2222 username@your-server-ip
```

---

## 🚀 Deployment Workflows

### Available Workflows:

1. **SSH Troubleshooting** (`ssh-troubleshoot.yml`)
   - Tests SSH connection
   - Checks secrets configuration
   - Validates server setup

2. **CI/CD Pipeline** (`ci-cd.yml`)
   - Runs tests and builds
   - Deploys to temp_build on main branch

3. **SSH Debug** (`debug-ssh.yml`)
   - Advanced diagnostics
   - Full system information

### Running Workflows:
1. Go to **Actions** tab in your GitHub repository
2. Select the workflow you want to run
3. Click **Run workflow**
4. Choose options if prompted

---

## 🔧 Troubleshooting

### Common Issues:

#### "missing server host"
- **Cause**: `HOST` secret is empty or not set
- **Solution**: Add your server IP/domain to `HOST` secret

#### "Permission denied (publickey)"
- **Cause**: SSH key authentication failed
- **Solutions**:
  - Verify public key is in `~/.ssh/authorized_keys` on server
  - Check private key format in `SSH_KEY` secret
  - Ensure correct username in `USERNAME` secret

#### "Connection timeout"
- **Cause**: Network/firewall issues
- **Solutions**:
  - Verify server is running and accessible
  - Check firewall allows SSH (port 22 or custom port)
  - Verify correct port in `PORT` secret

#### "Host key verification failed"
- **Cause**: SSH host key not trusted
- **Solution**: Add to workflow:
  ```yaml
  - uses: appleboy/ssh-action@v1.0.0
    with:
      host: ${{ secrets.HOST }}
      username: ${{ secrets.USERNAME }}
      key: ${{ secrets.SSH_KEY }}
      port: ${{ secrets.PORT || 22 }}
      script: echo "Connected!"
      # Add this line:
      fingerprint: "your-server-fingerprint"
  ```

---

## 📋 Checklist

Before running deployment:

- [ ] All 4 secrets configured in GitHub
- [ ] SSH public key added to server
- [ ] Server accessible via SSH
- [ ] Project directory `/var/www/ravetracker-v3` exists
- [ ] User has write permissions to project directory
- [ ] Git is installed on server
- [ ] Internet connectivity on server for git clone

---

## 🔍 Testing

Run the SSH Troubleshooting workflow first:
1. Go to **Actions** → **SSH Connection Troubleshooting**
2. Click **Run workflow**
3. Select "secrets-check" to verify configuration
4. Select "connection-test" to test SSH
5. Select "full-deploy" to perform actual deployment

This will help identify and resolve any configuration issues before attempting automatic deployments.
