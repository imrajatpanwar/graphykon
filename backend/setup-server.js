const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function setupServer() {
  console.log('🚀 Setting up Graphykon server...');
  
  // Test MongoDB connection
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/graphykon';
  console.log('Testing MongoDB connection to:', MONGODB_URI.replace(/:([^:@]{8})[^:@]*@/, ':****@'));
  
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
    
    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ email: 'admin@graphykon.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@graphykon.com',
        password: hashedPassword,
        isAdmin: true,
        role: 'admin',
        verification: {
          isBlueVerified: true,
          verifiedAt: new Date()
        }
      });
      
      await adminUser.save();
      console.log('✅ Admin user created: admin@graphykon.com / admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    // Test user creation
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123'
    });
    
    await testUser.save();
    console.log('✅ Test user creation successful');
    
    // Clean up test user
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ Test user cleaned up');
    
    console.log('\n🎉 Server setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Start the frontend: cd ../frontend && npm start');
    console.log('3. Access the application at: http://localhost:3000');
    console.log('4. Admin login: admin@graphykon.com / admin123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📋 Troubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check your MONGODB_URI in .env file');
    console.log('3. For remote MongoDB, use: mongodb://username:password@host:port/database');
    console.log('4. For MongoDB Atlas, use your connection string');
  } finally {
    await mongoose.connection.close();
  }
}

setupServer(); 