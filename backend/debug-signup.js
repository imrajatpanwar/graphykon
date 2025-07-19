const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

console.log('🔍 Debugging Signup Issues');
console.log('==========================\n');

async function checkMongoDBConnection() {
  console.log('1. Checking MongoDB Connection...');
  
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/graphykon';
    console.log('MongoDB URI:', MONGODB_URI.replace(/:([^:@]{8})[^:@]*@/, ':****@'));
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    // Test database operations
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log('Current users in database:', userCount);
    
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('Error type:', error.name);
    console.log('Error code:', error.code);
    return false;
  }
}

async function testServerEndpoints() {
  console.log('\n2. Testing Server Endpoints...');
  
  const baseURL = 'http://89.117.58.204:5000';
  
  try {
    // Test if server is running
    const response = await axios.get(`${baseURL}/api`);
    console.log('✅ Server is running:', response.data.message);
    
    // Test signup endpoint
    const testUser = {
      name: `TestUser${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'test123456'
    };
    
    console.log('📝 Testing signup with:', { ...testUser, password: '***' });
    
    const signupResponse = await axios.post(`${baseURL}/api/auth/register`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status < 600; // Accept any status less than 600
      }
    });
    
    console.log('Signup response status:', signupResponse.status);
    console.log('Signup response data:', signupResponse.data);
    
    if (signupResponse.status === 201) {
      console.log('✅ Signup appeared successful');
      
      // Verify user was actually saved
      const User = require('./models/User');
      const savedUser = await User.findOne({ email: testUser.email });
      
      if (savedUser) {
        console.log('✅ User was actually saved to database');
        console.log('Saved user:', savedUser.name, savedUser.email);
        
        // Clean up test user
        await User.deleteOne({ email: testUser.email });
        console.log('🧹 Test user cleaned up');
      } else {
        console.log('❌ User was NOT saved to database despite successful response');
        console.log('This indicates a serious issue with the signup process');
      }
    } else if (signupResponse.status === 503) {
      console.log('❌ Database connection error detected');
      console.log('This confirms MongoDB is not available');
    } else {
      console.log('⚠️  Unexpected response status:', signupResponse.status);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Server test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running on port 5000');
      console.log('📋 Start the server with: npm start');
    }
    
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n3. Checking Environment Variables...');
  
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  let allSet = true;
  
  required.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allSet = false;
    }
  });
  
  return allSet;
}

async function checkUserModel() {
  console.log('\n4. Checking User Model...');
  
  try {
    const User = require('./models/User');
    
    // Test creating a user object
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123'
    });
    
    console.log('✅ User model loaded successfully');
    console.log('User schema fields:', Object.keys(User.schema.paths));
    
    // Check for validation issues
    const validationError = testUser.validateSync();
    if (validationError) {
      console.log('❌ User model validation errors:', validationError.message);
    } else {
      console.log('✅ User model validation passed');
    }
    
    return true;
  } catch (error) {
    console.log('❌ User model error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Starting comprehensive signup debugging...\n');
  
  const envOk = await checkEnvironmentVariables();
  const modelOk = await checkUserModel();
  const mongoOk = await checkMongoDBConnection();
  const serverOk = await testServerEndpoints();
  
  console.log('\n📊 Summary:');
  console.log('Environment Variables:', envOk ? '✅' : '❌');
  console.log('User Model:', modelOk ? '✅' : '❌');
  console.log('MongoDB Connection:', mongoOk ? '✅' : '❌');
  console.log('Server Endpoints:', serverOk ? '✅' : '❌');
  
  console.log('\n🔧 Recommendations:');
  
  if (!mongoOk) {
    console.log('1. Install and start MongoDB:');
    console.log('   - For Windows: Download and install MongoDB Community Server');
    console.log('   - For Linux: sudo apt install mongodb && sudo systemctl start mongodb');
    console.log('   - For macOS: brew install mongodb-community && brew services start mongodb-community');
  }
  
  if (!serverOk) {
    console.log('2. Start the backend server:');
    console.log('   cd backend && npm start');
  }
  
  if (mongoOk && serverOk) {
    console.log('✅ All systems are working correctly');
    console.log('If signup still fails, check the server logs for detailed error messages');
  }
}

main().catch(console.error); 