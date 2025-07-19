const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphykon';

console.log('Testing MongoDB connection...');
console.log('MongoDB URI:', MONGODB_URI.replace(/:([^:@]{8})[^:@]*@/, ':****@'));

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(async () => {
  console.log('✅ Successfully connected to MongoDB');
  console.log('Database:', mongoose.connection.db.databaseName);
  
  // Test creating a user
  const User = require('./models/User');
  
  try {
    // Test user creation
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    await testUser.save();
    console.log('✅ User creation test passed');
    
    // Test user retrieval
    const foundUser = await User.findOne({ email: 'test@example.com' });
    console.log('✅ User retrieval test passed');
    console.log('Found user:', foundUser.name);
    
    // Clean up test user
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ Test user cleaned up');
    
  } catch (error) {
    console.error('❌ User operation test failed:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('✅ Connection test completed successfully');
  process.exit(0);
})
.catch((err) => {
  console.error('❌ MongoDB connection test failed:', err.message);
  console.log('\n📋 Troubleshooting steps:');
  console.log('1. Make sure MongoDB is running');
  console.log('2. Check if the MONGODB_URI is correct');
  console.log('3. Verify network connectivity');
  process.exit(1);
}); 