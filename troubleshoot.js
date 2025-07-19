const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 Graphykon Troubleshooting Tool');
console.log('================================\n');

async function checkEnvironment() {
  console.log('1. Checking Environment Variables...');
  
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.log('❌ Missing environment variables:', missing.join(', '));
    console.log('📋 Create a .env file in the backend directory with:');
    console.log('MONGODB_URI=mongodb://127.0.0.1:27017/graphykon');
    console.log('JWT_SECRET=your-secret-key');
    return false;
  } else {
    console.log('✅ All environment variables are set');
    return true;
  }
}

async function checkMongoDB() {
  console.log('\n2. Testing MongoDB Connection...');
  
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    console.log('Connecting to:', MONGODB_URI.replace(/:([^:@]{8})[^:@]*@/, ':****@'));
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    // Test basic operations
    const User = require('./backend/models/User');
    const userCount = await User.countDocuments();
    console.log('Current users in database:', userCount);
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('\n📋 Troubleshooting MongoDB:');
    console.log('1. Make sure MongoDB is running: sudo systemctl status mongodb');
    console.log('2. Check MongoDB logs: sudo journalctl -u mongodb');
    console.log('3. Verify connection string in .env file');
    console.log('4. For remote MongoDB, check network connectivity');
    return false;
  }
}

async function checkServerEndpoints() {
  console.log('\n3. Testing Server Endpoints...');
  
  const baseURL = 'http://localhost:5000';
  
  try {
    // Test basic endpoint
    const response = await axios.get(`${baseURL}/api`);
    console.log('✅ API endpoint responding:', response.data.message);
    
    // Test auth endpoint
    const authResponse = await axios.post(`${baseURL}/api/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123'
    }, {
      validateStatus: function (status) {
        return status < 500; // Accept any status less than 500
      }
    });
    
    if (authResponse.status === 201) {
      console.log('✅ Signup endpoint working');
    } else if (authResponse.status === 400) {
      console.log('✅ Signup endpoint responding (user might already exist)');
    } else {
      console.log('⚠️  Signup endpoint status:', authResponse.status);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Server endpoints not responding:', error.message);
    console.log('\n📋 Troubleshooting Server:');
    console.log('1. Make sure server is running: npm start');
    console.log('2. Check if port 5000 is available');
    console.log('3. Check server logs for errors');
    return false;
  }
}

async function checkFrontendConfiguration() {
  console.log('\n4. Checking Frontend Configuration...');
  
  const authContextPath = './frontend/src/context/AuthContext.js';
  
  if (fs.existsSync(authContextPath)) {
    const content = fs.readFileSync(authContextPath, 'utf8');
    
    if (content.includes('89.117.58.204')) {
      console.log('✅ Frontend configured for production server');
    } else {
      console.log('⚠️  Frontend might not be configured for production server');
    }
    
    if (content.includes('localhost:5000')) {
      console.log('✅ Frontend configured for local development');
    }
    
    return true;
  } else {
    console.log('❌ AuthContext file not found');
    return false;
  }
}

async function generateSetupCommands() {
  console.log('\n5. Setup Commands for Server...');
  console.log('\n📋 Run these commands on your server (89.117.58.204):');
  console.log('\n# Install MongoDB:');
  console.log('sudo apt update');
  console.log('sudo apt install -y mongodb');
  console.log('sudo systemctl start mongodb');
  console.log('sudo systemctl enable mongodb');
  
  console.log('\n# Install Node.js (if not installed):');
  console.log('curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -');
  console.log('sudo apt-get install -y nodejs');
  
  console.log('\n# Setup application:');
  console.log('cd /path/to/Graphykon/backend');
  console.log('npm install');
  console.log('node setup-server.js');
  console.log('npm start');
  
  console.log('\n# In another terminal:');
  console.log('cd /path/to/Graphykon/frontend');
  console.log('npm install');
  console.log('npm start');
}

async function main() {
  const envOk = await checkEnvironment();
  const mongoOk = await checkMongoDB();
  const serverOk = await checkServerEndpoints();
  const frontendOk = await checkFrontendConfiguration();
  
  console.log('\n📊 Summary:');
  console.log('Environment:', envOk ? '✅' : '❌');
  console.log('MongoDB:', mongoOk ? '✅' : '❌');
  console.log('Server:', serverOk ? '✅' : '❌');
  console.log('Frontend:', frontendOk ? '✅' : '❌');
  
  if (!envOk || !mongoOk || !serverOk) {
    console.log('\n🔧 Issues detected. Please fix them before proceeding.');
    await generateSetupCommands();
  } else {
    console.log('\n🎉 All checks passed! Your application should be working.');
    console.log('\n📋 Access your application at:');
    console.log('Frontend: http://89.117.58.204:3000');
    console.log('Backend API: http://89.117.58.204:5000');
  }
}

main().catch(console.error); 