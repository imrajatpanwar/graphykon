#!/bin/bash

echo "🔧 Setting up Nginx Reverse Proxy for Graphykon"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    print_info "Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
else
    print_status "Nginx is already installed"
fi

# Create Nginx configuration for Graphykon
print_info "Creating Nginx configuration..."

sudo tee /etc/nginx/sites-available/graphykon << 'EOF'
server {
    listen 80;
    server_name graphykon.com www.graphykon.com 89.117.58.204;

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
print_info "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/graphykon /etc/nginx/sites-enabled/

# Remove default site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
    print_info "Removed default Nginx site"
fi

# Test Nginx configuration
print_info "Testing Nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
    exit 1
fi

# Restart Nginx
print_info "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Check Nginx status
if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
else
    print_error "Nginx failed to start"
    exit 1
fi

# Configure firewall
print_info "Configuring firewall..."
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22

print_status "Nginx reverse proxy setup completed!"
echo ""
echo "📋 Configuration Summary:"
echo "Frontend: http://graphykon.com (port 3000)"
echo "Backend API: http://graphykon.com/api (port 5000)"
echo "Socket.IO: http://graphykon.com/socket.io (port 5000)"
echo ""
echo "🔧 Management commands:"
echo "Nginx status: sudo systemctl status nginx"
echo "Nginx restart: sudo systemctl restart nginx"
echo "Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "⚠️  Next steps:"
echo "1. Update your frontend API config to use the domain"
echo "2. Restart your backend and frontend services"
echo "3. Test the application" 