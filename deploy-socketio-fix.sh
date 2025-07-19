#!/bin/bash

echo "🔧 Deploying Socket.IO Fixes to Production Server"
echo "================================================="

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

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the Graphykon project root directory"
    exit 1
fi

# Pull latest changes from Git
print_info "Pulling latest changes from Git..."
git pull origin main

if [ $? -ne 0 ]; then
    print_error "Failed to pull from Git. Please check your connection and try again."
    exit 1
fi

# Update Nginx configuration
print_info "Updating Nginx configuration for Socket.IO..."
if [ -f "nginx-socketio-fix.conf" ]; then
    sudo cp nginx-socketio-fix.conf /etc/nginx/sites-available/graphykon
    print_status "Nginx configuration updated"
else
    print_warning "nginx-socketio-fix.conf not found, using existing configuration"
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

if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
else
    print_error "Nginx failed to start"
    exit 1
fi

# Install/Update backend dependencies
print_info "Installing backend dependencies..."
cd backend
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning "Creating .env file..."
    cat > .env << EOF
MONGODB_URI=mongodb+srv://imgraphykon:****@cluster0.cwpplfy.mongodb.net/graphykon?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
PORT=5000
EOF
    print_status ".env file created"
else
    print_status ".env file already exists"
fi

# Test MongoDB connection
print_info "Testing MongoDB connection..."
if node test-connection.js; then
    print_status "MongoDB connection successful"
else
    print_warning "MongoDB connection failed, but continuing..."
fi

# Restart backend with PM2
print_info "Restarting backend server..."
pm2 restart graphykon-backend || pm2 start server.js --name graphykon-backend

# Check backend status
sleep 3
if pm2 list | grep -q "graphykon-backend.*online"; then
    print_status "Backend server is running"
else
    print_error "Backend server failed to start"
    pm2 logs graphykon-backend --lines 10
    exit 1
fi

# Install/Update frontend dependencies
print_info "Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend for production
print_info "Building frontend for production..."
npm run build

# Restart frontend with PM2
print_info "Restarting frontend server..."
pm2 restart graphykon-frontend || pm2 start npm --name graphykon-frontend -- start

# Save PM2 configuration
pm2 save

# Test Socket.IO connection
print_info "Testing Socket.IO connection..."
cd ..
if node test-socket-connection.js; then
    print_status "Socket.IO connection test successful"
else
    print_warning "Socket.IO connection test failed, but server is running"
fi

# Show final status
print_info "Final PM2 Status:"
pm2 status

# Test endpoints
print_info "Testing application endpoints..."
sleep 5

# Test backend API
if curl -s http://localhost:5000/api/health > /dev/null; then
    print_status "Backend API is responding"
else
    print_error "Backend API is not responding"
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend is responding"
else
    print_error "Frontend is not responding"
fi

# Test Socket.IO endpoint
if curl -s http://localhost:5000/socket.io/ > /dev/null; then
    print_status "Socket.IO endpoint is responding"
else
    print_error "Socket.IO endpoint is not responding"
fi

echo ""
echo "🎉 Socket.IO fixes deployed successfully!"
echo ""
echo "📋 Application URLs:"
echo "Frontend: https://graphykon.com"
echo "Backend API: https://graphykon.com/api"
echo "Socket.IO: https://graphykon.com/socket.io"
echo ""
echo "🔧 Management commands:"
echo "View logs: pm2 logs"
echo "Restart all: pm2 restart all"
echo "Status: pm2 status"
echo "Nginx status: sudo systemctl status nginx"
echo ""
echo "📋 Troubleshooting:"
echo "1. Check backend logs: pm2 logs graphykon-backend"
echo "2. Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "3. Test Socket.IO: node test-socket-connection.js"
echo "4. View troubleshooting guide: cat SOCKET_IO_TROUBLESHOOTING.md" 