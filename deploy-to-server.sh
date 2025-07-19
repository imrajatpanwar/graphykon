#!/bin/bash

echo "🚀 Deploying Graphykon to Server (89.117.58.204)"
echo "================================================"

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install MongoDB
echo "🗄️  Installing MongoDB..."
sudo apt install -y mongodb

# Start MongoDB
echo "▶️  Starting MongoDB..."
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Check MongoDB status
echo "📊 Checking MongoDB status..."
sudo systemctl status mongodb

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js already installed"
fi

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Navigate to backend directory
cd backend

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Run setup script
echo "🔧 Running setup script..."
node setup-server.js

# Start backend with PM2
echo "▶️  Starting backend server..."
pm2 start server.js --name graphykon-backend

# Navigate to frontend directory
cd ../frontend

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend for production
echo "🏗️  Building frontend..."
npm run build

# Start frontend with PM2
echo "▶️  Starting frontend server..."
pm2 start npm --name graphykon-frontend -- start

# Save PM2 configuration
pm2 save
pm2 startup

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Access your application:"
echo "Frontend: http://89.117.58.204:3000"
echo "Backend API: http://89.117.58.204:5000"
echo ""
echo "🔧 Management commands:"
echo "View logs: pm2 logs"
echo "Restart: pm2 restart all"
echo "Stop: pm2 stop all"
echo "Status: pm2 status"
echo ""
echo "👤 Admin login: admin@graphykon.com / admin123" 