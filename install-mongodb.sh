#!/bin/bash

echo "🚀 Installing MongoDB on Ubuntu Server..."

# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb

# Start MongoDB service
sudo systemctl start mongodb

# Enable MongoDB to start on boot
sudo systemctl enable mongodb

# Check MongoDB status
echo "📊 Checking MongoDB status..."
sudo systemctl status mongodb

# Create data directory if it doesn't exist
sudo mkdir -p /data/db

# Set proper permissions
sudo chown -R mongodb:mongodb /data/db

# Test MongoDB connection
echo "🧪 Testing MongoDB connection..."
mongo --eval "db.runCommand('ping')" --quiet

if [ $? -eq 0 ]; then
    echo "✅ MongoDB installed and running successfully!"
    echo "📋 Next steps:"
    echo "1. Run: cd backend && node setup-server.js"
    echo "2. Start the application: npm start"
else
    echo "❌ MongoDB installation failed. Check the logs above."
    echo "📋 Troubleshooting:"
    echo "1. Check MongoDB logs: sudo journalctl -u mongodb"
    echo "2. Verify MongoDB is running: sudo systemctl status mongodb"
    echo "3. Check if port 27017 is open: sudo netstat -tlnp | grep 27017"
fi 