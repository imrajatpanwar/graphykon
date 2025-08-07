#!/bin/bash

# Graphykon Deployment Script for Contabo Server
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting Graphykon deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to project directory
cd /var/www/graphykon

print_status "📁 Working directory: $(pwd)"

# 1. Pull latest code from Git
print_status "📥 Pulling latest code from Git..."
git fetch origin
git reset --hard origin/main
print_status "✅ Code updated successfully"

# 2. Install/Update dependencies
print_status "📦 Installing backend dependencies..."
cd server
npm install --production
print_status "✅ Backend dependencies installed"

print_status "📦 Installing frontend dependencies..."
cd ../client
npm install
print_status "✅ Frontend dependencies installed"

# 3. Restart backend with PM2
print_status "🔄 Restarting backend with PM2..."
cd ../server

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found, installing..."
    npm install -g pm2
fi

# Stop existing PM2 process if running
pm2 stop graphykon-server 2>/dev/null || true
pm2 delete graphykon-server 2>/dev/null || true

# Start backend with PM2
pm2 start server.js --name "graphykon-server" --env production
pm2 save
print_status "✅ Backend restarted with PM2"

# 4. Build frontend for production
print_status "🏗️ Building frontend for production..."
cd ../client
npm run build
print_status "✅ Frontend built successfully"

# 5. Deploy frontend build
print_status "📤 Deploying frontend build..."
# The build is already in /var/www/graphykon/client/build
# We'll copy it to the web root if needed
if [ -d "build" ]; then
    print_status "✅ Frontend build ready at: $(pwd)/build"
else
    print_error "❌ Frontend build failed - build directory not found"
    exit 1
fi

# 6. Update Nginx configuration for production build
print_status "🔧 Updating Nginx configuration..."
cat > /etc/nginx/sites-available/graphykon.com << 'EOF'
server {
    server_name graphykon.com www.graphykon.com;

    # Allow large uploads (increase as needed)
    client_max_body_size 600M;

    # API routes - proxy to Node.js backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Improve handling of large multipart uploads
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_request_buffering off;
    }

    # Serve React production build
    location / {
        root /var/www/graphykon/client/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000" always;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/graphykon.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/graphykon.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.graphykon.com) {
        return 301 https://$host$request_uri;
    }
    if ($host = graphykon.com) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name graphykon.com www.graphykon.com;
    return 404;
}
EOF

# Test and reload Nginx
nginx -t && systemctl reload nginx
print_status "✅ Nginx configuration updated and reloaded"

# 7. Final status check
print_status "🔍 Checking deployment status..."
echo ""
echo "📊 Deployment Summary:"
echo "======================"
echo "✅ Git: Latest code pulled"
echo "✅ Backend: PM2 process running"
echo "✅ Frontend: Production build created"
echo "✅ Nginx: Configuration updated"
echo ""
echo "🌐 Your application is live at: https://graphykon.com"
echo "🔧 PM2 Status:"
pm2 status
echo ""
echo "🎉 Deployment completed successfully!" 