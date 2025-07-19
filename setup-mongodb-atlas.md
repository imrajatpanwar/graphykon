# MongoDB Atlas Setup Guide

## 🗄️ Setting up MongoDB Atlas (Cloud Database)

Since MongoDB is not running locally, let's set up MongoDB Atlas for reliable cloud hosting.

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose "Free" tier (M0)

### Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to your server
5. Click "Create"

### Step 3: Set Up Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Select "Read and write to any database"
6. Click "Add User"

### Step 4: Set Up Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add your server IP: 89.117.58.204
5. Click "Confirm"

### Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string

### Step 6: Update Your .env File

Replace your current `.env` file with:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster.mongodb.net/graphykon?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
NODE_ENV=production
PORT=5000
```

**Replace:**
- `yourusername` with your Atlas username
- `yourpassword` with your Atlas password
- `cluster.mongodb.net` with your actual cluster URL

### Step 7: Test the Connection

```bash
cd backend
node test-connection.js
```

### Step 8: Start the Server

```bash
npm start
```

## 🔧 Alternative: Local MongoDB Installation

### For Windows:
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install with default settings
3. MongoDB will run as a Windows service automatically

### For Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### For macOS:
```bash
brew install mongodb-community
brew services start mongodb-community
```

## 🧪 Testing After Setup

Once MongoDB is running, test the signup:

```bash
cd backend
node debug-signup.js
```

This will verify that:
- MongoDB connection works
- User creation actually saves to database
- Signup process is working correctly

## 📋 Troubleshooting

### If MongoDB Atlas connection fails:
1. Check your username/password
2. Verify IP whitelist includes your server IP
3. Check if cluster is active

### If local MongoDB fails:
1. Check if MongoDB service is running
2. Verify port 27017 is not blocked
3. Check MongoDB logs for errors 