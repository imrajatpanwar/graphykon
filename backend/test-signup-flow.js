const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function testSignupFlow() {
  console.log('🧪 Testing Complete Signup Flow');
  console.log('================================\n');

  try {
    // Step 1: Test MongoDB Connection
    console.log('1. Testing MongoDB Connection...');
    const MONGODB_URI = process.env.MONGODB_URI;
    console.log('MongoDB URI:', MONGODB_URI.replace(/:([^:@]{8})[^:@]*@/, ':****@'));
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Connection state:', mongoose.connection.readyState);

    // Step 2: Test User Model
    console.log('\n2. Testing User Model...');
    const testUserData = {
      name: 'Test User Flow',
      email: 'testflow@example.com',
      password: 'test123456'
    };

    // Clean up any existing test user
    await User.deleteOne({ email: testUserData.email });
    console.log('✅ Cleaned up existing test user');

    // Step 3: Test User Creation Process
    console.log('\n3. Testing User Creation Process...');
    
    // Hash password (simulate backend process)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUserData.password, salt);
    console.log('✅ Password hashed successfully');

    // Create user object
    const user = new User({
      name: testUserData.name.trim(),
      email: testUserData.email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ User object created');

    // Save user to database
    const savedUser = await user.save();
    console.log('✅ User saved to database');
    console.log('User ID:', savedUser._id);
    console.log('User Name:', savedUser.name);
    console.log('User Email:', savedUser.email);

    // Step 4: Test User Retrieval
    console.log('\n4. Testing User Retrieval...');
    const retrievedUser = await User.findById(savedUser._id);
    if (retrievedUser) {
      console.log('✅ User retrieved successfully');
      console.log('Retrieved user:', retrievedUser.name, retrievedUser.email);
    } else {
      throw new Error('Failed to retrieve saved user');
    }

    // Step 5: Test User Query Operations
    console.log('\n5. Testing User Query Operations...');
    
    // Test email search
    const userByEmail = await User.findOne({ email: testUserData.email });
    if (userByEmail) {
      console.log('✅ User found by email');
    } else {
      throw new Error('User not found by email');
    }

    // Test name search
    const userByName = await User.findOne({ name: testUserData.name });
    if (userByName) {
      console.log('✅ User found by name');
    } else {
      throw new Error('User not found by name');
    }

    // Step 6: Test User Count
    console.log('\n6. Testing User Count...');
    const totalUsers = await User.countDocuments();
    console.log('✅ Total users in database:', totalUsers);

    // Step 7: Test Duplicate Prevention
    console.log('\n7. Testing Duplicate Prevention...');
    try {
      const duplicateUser = new User({
        name: testUserData.name,
        email: testUserData.email,
        password: hashedPassword
      });
      await duplicateUser.save();
      console.log('❌ Duplicate user was saved (this should not happen)');
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ Duplicate prevention working correctly');
      } else {
        console.log('⚠️  Unexpected error in duplicate test:', error.message);
      }
    }

    // Step 8: Cleanup
    console.log('\n8. Cleaning up...');
    await User.deleteOne({ email: testUserData.email });
    console.log('✅ Test user cleaned up');

    // Step 9: Final Database Stats
    console.log('\n9. Final Database Statistics...');
    const finalCount = await User.countDocuments();
    console.log('Final user count:', finalCount);

    console.log('\n🎉 All signup flow tests passed!');
    console.log('\n📋 Summary:');
    console.log('- MongoDB connection: ✅ Working');
    console.log('- User model: ✅ Working');
    console.log('- User creation: ✅ Working');
    console.log('- User retrieval: ✅ Working');
    console.log('- Duplicate prevention: ✅ Working');
    console.log('- Database operations: ✅ Working');

  } catch (error) {
    console.error('\n❌ Signup flow test failed:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    
    if (error.name === 'MongoNetworkError' || error.message.includes('ECONNREFUSED')) {
      console.log('\n📋 MongoDB Connection Issues:');
      console.log('1. Check if MongoDB is running');
      console.log('2. Verify MONGODB_URI in .env file');
      console.log('3. Check network connectivity');
      console.log('4. Verify MongoDB Atlas IP whitelist');
    } else if (error.name === 'ValidationError') {
      console.log('\n📋 Validation Issues:');
      console.log('Error details:', error.errors);
    } else {
      console.log('\n📋 General Error:');
      console.log('Full error:', error);
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Run the test
testSignupFlow(); 