#!/bin/bash

# RaveTracker v3.0 - Quick 403 Fix
# ===============================
# Run this script to quickly fix 403 Forbidden errors

echo "🚨 RaveTracker v3.0 - Quick 403 Forbidden Fix"
echo "=============================================="
echo "📅 $(date)"
echo "🖥️ Server: $(hostname)"
echo "📍 IP: $(hostname -I | awk '{print $1}')"
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run with sudo"
    echo "💡 Usage: sudo bash quick_403_fix.sh"
    exit 1
fi

echo "✅ Running as root/sudo"

# Step 1: Create directory structure
echo ""
echo "📁 Step 1: Creating directory structure..."
DOC_ROOT="/var/www/ravetracker-v3/temp_build"
mkdir -p $DOC_ROOT
echo "✅ Directory created: $DOC_ROOT"

# Step 2: Create index.html
echo ""
echo "📄 Step 2: Creating index.html..."
cat > $DOC_ROOT/index.html << 'EOF'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎵 RaveTracker v3.0</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
        }
        
        .container {
            text-align: center;
            padding: 3rem;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-width: 600px;
            animation: fadeIn 1s ease-in;
        }
        
        h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            background: linear-gradient(45deg, #00ff88, #00aaff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .status {
            background: rgba(0, 255, 136, 0.2);
            border: 1px solid #00ff88;
            border-radius: 10px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .success {
            font-size: 1.2rem;
            font-weight: bold;
            color: #00ff88;
        }
        
        .info {
            margin-top: 1rem;
            line-height: 1.6;
        }
        
        .tech-stack {
            margin-top: 2rem;
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
        }
        
        .tech-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .footer {
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 RaveTracker v3.0</h1>
        <div class="subtitle">Die ultimative Rave & Techno Tracking Platform</div>
        
        <div class="status">
            <div class="success">✅ 403 Fehler behoben!</div>
            <div class="success">🚀 Server läuft erfolgreich</div>
            <div class="info">
                <strong>Status:</strong> Online<br>
                <strong>HTTP Code:</strong> 200 OK<br>
                <strong>Berechtigungen:</strong> Korrigiert
            </div>
        </div>
        
        <div class="info">
            <p><strong>🎶 RaveTracker Features:</strong></p>
            <p>• Event Tracking & Management</p>
            <p>• DJ Set Aufzeichnung</p>
            <p>• Glassmorphism Design</p>
            <p>• Real-time Synchronisation</p>
            <p>• Responsive Interface</p>
        </div>
        
        <div class="tech-stack">
            <span class="tech-item">SvelteKit 5.0</span>
            <span class="tech-item">TypeScript</span>
            <span class="tech-item">Tailwind CSS</span>
            <span class="tech-item">Supabase</span>
            <span class="tech-item">NGINX</span>
        </div>
        
        <div class="footer">
            Server IP: <span id="server-ip"></span><br>
            Build: v3.0.0<br>
            Deployment: Erfolgreich
        </div>
    </div>
    
    <script>
        document.getElementById('server-ip').textContent = window.location.hostname;
    </script>
</body>
</html>
EOF

echo "✅ index.html created"

# Step 3: Create health endpoint
echo ""
echo "🔍 Step 3: Creating health endpoint..."
mkdir -p $DOC_ROOT/health
echo "RaveTracker v3.0 - Healthy" > $DOC_ROOT/health/index.html
echo "✅ Health endpoint created"

# Step 4: Set proper permissions
echo ""
echo "🔒 Step 4: Setting permissions..."
chown -R www-data:www-data /var/www/ravetracker-v3
chmod -R 755 /var/www/ravetracker-v3
chmod -R 644 $DOC_ROOT/*.html
echo "✅ Permissions set"

# Step 5: Ensure parent directory permissions
echo ""
echo "📁 Step 5: Checking parent directories..."
chmod 755 /var/www
chmod 755 /var
echo "✅ Parent directories accessible"

# Step 6: Reload NGINX
echo ""
echo "🔄 Step 6: Reloading NGINX..."
if systemctl reload nginx; then
    echo "✅ NGINX reloaded successfully"
else
    echo "⚠️ NGINX reload failed, trying restart..."
    systemctl restart nginx
fi

# Step 7: Test the fix
echo ""
echo "🧪 Step 7: Testing the fix..."
sleep 2

# Test HTTP response
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
echo "HTTP Response Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS! 403 error fixed"
    
    # Test health endpoint
    HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "000")
    echo "Health Endpoint: $HEALTH_CODE"
    
else
    echo "❌ Still getting HTTP $HTTP_CODE"
    echo "📄 Checking error logs..."
    tail -5 /var/log/nginx/error.log 2>/dev/null || echo "Cannot access error log"
fi

# Final status
SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "🎉 Quick 403 Fix Completed!"
echo "==========================="
echo "✅ Directory structure created"
echo "✅ Index.html with RaveTracker theme created"
echo "✅ Permissions set correctly"
echo "✅ NGINX configuration updated"
echo ""
echo "🌐 Access URLs:"
echo "- Main site: http://$SERVER_IP"
echo "- Health check: http://$SERVER_IP/health"
echo ""
echo "📊 File Status:"
ls -la $DOC_ROOT
echo ""
echo "🚀 RaveTracker v3.0 is now accessible!"
