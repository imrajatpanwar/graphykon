const axios = require('axios');

async function testSignup() {
  console.log('🧪 Testing Signup Functionality');
  console.log('================================\n');

  const baseURL = 'http://localhost:5000';
  const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'test123456'
  };

  try {
    console.log('📝 Testing user registration...');
    console.log('User data:', { ...testUser, password: '***' });

    const response = await axios.post(`${baseURL}/api/auth/register`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Signup successful!');
    console.log('Response status:', response.status);
    console.log('User created:', response.data.user.name);
    console.log('Token received:', response.data.token ? 'Yes' : 'No');

    // Test login with the created user
    console.log('\n🔐 Testing login with created user...');
    
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    console.log('✅ Login successful!');
    console.log('Login response status:', loginResponse.status);
    console.log('User logged in:', loginResponse.data.user.name);

    console.log('\n🎉 All tests passed! Signup and login are working correctly.');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    
    console.log('\n📋 Troubleshooting:');
    console.log('1. Make sure the server is running: npm start');
    console.log('2. Check if MongoDB is connected');
    console.log('3. Verify the API endpoint is accessible');
  }
}

// Test server connectivity first
async function testServerConnectivity() {
  console.log('🔌 Testing server connectivity...');
  
  try {
    const response = await axios.get('http://localhost:5000/api');
    console.log('✅ Server is responding:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Server is not responding:', error.message);
    console.log('📋 Make sure to start the server first: npm start');
    return false;
  }
}

async function main() {
  const serverOk = await testServerConnectivity();
  
  if (serverOk) {
    await testSignup();
  }
}

main(); 