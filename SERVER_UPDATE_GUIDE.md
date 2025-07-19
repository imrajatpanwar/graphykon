# Server Update Guide

## 🚀 Quick Update for Server (89.117.58.204)

### Step 1: SSH into your server
```bash
ssh root@89.117.58.204
```

### Step 2: Navigate to your project directory
```bash
cd /path/to/Graphykon
```

### Step 3: Run the update script
```bash
chmod +x update-server.sh
./update-server.sh
```

### Step 4: Set up MongoDB (if not already done)

#### Option A: MongoDB Atlas (Recommended)
1. Follow the guide in `setup-mongodb-atlas.md`
2. Update your `.env` file with the Atlas connection string
3. Test connection: `cd backend && node test-connection.js`

#### Option B: Local MongoDB
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Step 5: Test the application
```bash
# Test MongoDB connection
cd backend && node test-connection.js

# Test signup functionality
node debug-signup.js

# Check server status
pm2 status
```

## 🔧 Manual Update (if script fails)

### Pull latest changes
```bash
git pull origin main
```

### Update backend
```bash
cd backend
npm install
pm2 restart graphykon-backend
```

### Update frontend
```bash
cd ../frontend
npm install
npm run build
pm2 restart graphykon-frontend
```

## 📋 What's New in This Update

### ✅ Fixed Issues:
- **Signup database issues** - Better error handling for MongoDB failures
- **Improved error messages** - Specific error codes for database problems
- **Enhanced debugging** - New debugging scripts to identify issues

### 🆕 New Features:
- **Debugging script** - `debug-signup.js` to test signup functionality
- **MongoDB Atlas guide** - Complete setup instructions for cloud database
- **Better error handling** - Proper detection of database connection issues

### 🔧 Updated Files:
- `backend/routes/auth.js` - Improved error handling
- `backend/debug-signup.js` - New debugging tool
- `setup-mongodb-atlas.md` - MongoDB Atlas setup guide
- `update-server.sh` - Automated server update script

## 🧪 Testing After Update

### Test MongoDB Connection
```bash
cd backend
node test-connection.js
```

### Test Signup Functionality
```bash
node debug-signup.js
```

### Test Application URLs
- Frontend: http://89.117.58.204:3000
- Backend API: http://89.117.58.204:5000
- Admin login: admin@graphykon.com / admin123

## 📞 Troubleshooting

### If MongoDB connection fails:
1. Check if MongoDB is running: `sudo systemctl status mongodb`
2. Follow MongoDB Atlas setup guide
3. Verify connection string in `.env` file

### If signup still doesn't work:
1. Run debugging script: `node debug-signup.js`
2. Check server logs: `pm2 logs`
3. Verify MongoDB is connected

### If server won't start:
1. Check port availability: `netstat -tlnp | grep :5000`
2. Check Node.js version: `node --version`
3. Check PM2 status: `pm2 status` 