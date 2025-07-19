const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
const VisitorSession = require('./models/VisitorSession');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000', 
      'https://graphykon.com', 
      'https://www.graphykon.com',
      'http://89.117.58.204',
      'https://89.117.58.204',
      'http://89.117.58.204:3000',
      'https://89.117.58.204:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Visitor tracking store (for real-time data)
const liveVisitors = new Map();
// Session tracking store (for database persistence)
const activeSessions = new Map();
// Peak online visitors tracking
let peakOnlineVisitors = 0;

// Check for required environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphykon';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';

console.log('Using MongoDB URI:', MONGODB_URI.replace(/:([^:@]{8})[^:@]*@/, ':****@'));
console.log('Using JWT Secret:', JWT_SECRET ? 'Set' : 'Not set');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'profile-images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://graphykon.com', 
    'https://www.graphykon.com',
    'http://89.117.58.204',
    'https://89.117.58.204',
    'http://89.117.58.204:3000',
    'https://89.117.58.204:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection with improved error handling and options
const mongoOptions = {
  serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  maxPoolSize: 10, // Maintain up to 10 socket connections
  bufferMaxEntries: 0, // Disable mongoose buffering
  retryWrites: true,
  w: 'majority'
};

// Configure mongoose settings
mongoose.set('bufferCommands', false); // Disable mongoose buffering
mongoose.set('bufferMaxEntries', 0); // Disable mongoose buffering for faster failure

console.log('🔗 Attempting to connect to MongoDB...');
console.log('MongoDB URI:', MONGODB_URI.replace(/:([^:@]{8})[^:@]*@/, ':****@'));

// Connection with retry logic
let connectionAttempts = 0;
const maxRetries = 3;

const connectToMongoDB = async () => {
  try {
    connectionAttempts++;
    console.log(`📞 Connection attempt ${connectionAttempts}/${maxRetries}...`);
    
    await mongoose.connect(MONGODB_URI, mongoOptions);
    
    console.log('✅ Successfully connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🌐 Connection state:', mongoose.connection.readyState);
    
    // Test the connection with a simple operation
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.ping();
    console.log('📡 MongoDB ping successful:', result);
    
  } catch (err) {
    console.error(`❌ MongoDB connection attempt ${connectionAttempts} failed:`, err.message);
    
    if (connectionAttempts < maxRetries) {
      console.log(`⏳ Retrying in 5 seconds...`);
      setTimeout(connectToMongoDB, 5000);
    } else {
      console.error('\n🚨 All MongoDB connection attempts failed!');
      console.log('\n📋 Troubleshooting steps:');
      console.log('1. Check if MONGODB_URI environment variable is set correctly');
      console.log('2. For local MongoDB: Make sure MongoDB is running on port 27017');
      console.log('3. For MongoDB Atlas: Check your connection string, username, password, and IP whitelist');
      console.log('4. Verify network connectivity to your MongoDB server');
      console.log('5. Check if your IP address is whitelisted in MongoDB Atlas');
      console.log('\nCurrent MONGODB_URI:', MONGODB_URI.replace(/:([^:@]{8})[^:@]*@/, ':****@'));
      console.log('\n⚠️  Server will continue running without database connection');
      console.log('⚠️  API endpoints will return 503 errors for database operations');
    }
  }
};

// Start connection
connectToMongoDB();

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// MongoDB connection status check function
function isMongoDBConnected() {
  return mongoose.connection.readyState === 1;
}

// Function to attempt MongoDB reconnection
async function attemptMongoDBReconnection() {
  if (isMongoDBConnected()) {
    return true;
  }
  
  try {
    console.log('🔄 Attempting to reconnect to MongoDB...');
    await mongoose.connect(MONGODB_URI, mongoOptions);
    console.log('✅ MongoDB reconnection successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB reconnection failed:', error.message);
    return false;
  }
}

// Graceful exit
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle visitor join
  socket.on('visitor-join', async (visitorData) => {
    try {
      // Check if MongoDB connection is ready
      if (mongoose.connection.readyState !== 1) {
        console.log('MongoDB not connected, skipping database operations for visitor-join');
        return;
      }
      
      const visitor = {
        socketId: socket.id,
        userId: visitorData.userId || null,
        email: visitorData.email || null,
        name: visitorData.name || null,
        isLoggedIn: !!visitorData.userId,
        joinTime: new Date(),
        lastActivity: new Date(),
        currentPage: visitorData.currentPage || '/',
        userAgent: socket.handshake.headers['user-agent'] || ''
      };
      
      // Store in real-time tracking
      liveVisitors.set(socket.id, visitor);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Visitor joined:', visitor);
        console.log('Total live visitors now:', liveVisitors.size);
      }
      
      // Create database session
      const session = new VisitorSession({
        sessionId: socket.id,
        userId: visitor.userId,
        userEmail: visitor.email,
        userName: visitor.name,
        isLoggedIn: visitor.isLoggedIn,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        pageViews: [{ page: visitor.currentPage }],
        totalPageViews: 1
      });
      
      await session.save();
      activeSessions.set(socket.id, session._id);
      
      // Broadcast updated visitor count to all admin clients
      broadcastVisitorStats();
    } catch (error) {
      console.error('Error saving visitor session:', error);
    }
  });

  // Handle page navigation
  socket.on('page-change', async (pageData) => {
    try {
      const visitor = liveVisitors.get(socket.id);
      if (visitor) {
        visitor.currentPage = pageData.page;
        visitor.lastActivity = new Date();
        liveVisitors.set(socket.id, visitor);
        
        // Update database session
        const sessionId = activeSessions.get(socket.id);
        if (sessionId && mongoose.connection.readyState === 1) {
          const session = await VisitorSession.findById(sessionId);
          if (session) {
            await session.addPageView(pageData.page);
          }
        }
        
        broadcastVisitorStats();
      }
    } catch (error) {
      console.error('Error updating page view:', error);
    }
  });

  // Handle visitor activity (heartbeat)
  socket.on('visitor-activity', async () => {
    try {
      const visitor = liveVisitors.get(socket.id);
      if (visitor) {
        visitor.lastActivity = new Date();
        liveVisitors.set(socket.id, visitor);
        
        // Update database session activity
        const sessionId = activeSessions.get(socket.id);
        if (sessionId && mongoose.connection.readyState === 1) {
          await VisitorSession.findByIdAndUpdate(sessionId, {
            lastActivity: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error updating visitor activity:', error);
    }
  });

  // Handle admin actions that need to be broadcast to other admins
  socket.on('admin-action', (actionData) => {
    console.log('Admin action received:', actionData);
    // Broadcast to all other admins in the admin room
    socket.to('admin-room').emit(`admin-${actionData.type}-${actionData.action}`, actionData);
    socket.to('admin-room').emit('admin-data-update', actionData);
    
    // If the action affects dashboard stats, broadcast updated stats
    if (['users', 'assets', 'graphs', 'reviews'].includes(actionData.type)) {
      setTimeout(() => {
        broadcastDashboardStats();
      }, 1000); // Small delay to ensure database operations complete
    }
  });

  // Handle admin joining admin room
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log('Admin joined admin room:', socket.id);
    // Send current stats to the newly joined admin
    broadcastVisitorStats();
    broadcastDashboardStats();
  });

  // Handle user joining messages room
  socket.on('join-messages-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log('User joined messages room:', socket.id, 'User ID:', userId);
  });

  // Handle joining specific conversation
  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`);
    console.log('User joined conversation:', socket.id, 'Conversation ID:', conversationId);
  });

  // Handle leaving conversation
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation-${conversationId}`);
    console.log('User left conversation:', socket.id, 'Conversation ID:', conversationId);
  });

  // Handle real-time message sending
  socket.on('send-message', (messageData) => {
    const { conversationId, receiverId, message } = messageData;
    
    // Emit to specific conversation
    socket.to(`conversation-${conversationId}`).emit('new-message', {
      message,
      conversationId,
      receiverId
    });
    
    // Emit to receiver's user room for notifications
    socket.to(`user-${receiverId}`).emit('message-notification', {
      message,
      conversationId,
      senderId: message.sender._id
    });
    
    console.log('Message sent via socket:', conversationId);
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { conversationId, userId, userName } = data;
    socket.to(`conversation-${conversationId}`).emit('user-typing', {
      userId,
      userName,
      conversationId
    });
  });

  socket.on('typing-stop', (data) => {
    const { conversationId, userId } = data;
    socket.to(`conversation-${conversationId}`).emit('user-stopped-typing', {
      userId,
      conversationId
    });
  });

  // Handle message read receipts
  socket.on('messages-read', (data) => {
    const { conversationId, userId } = data;
    socket.to(`conversation-${conversationId}`).emit('messages-marked-read', {
      conversationId,
      userId
    });
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      console.log('User disconnected:', socket.id);
      
      // End database session
      const sessionId = activeSessions.get(socket.id);
      if (sessionId && mongoose.connection.readyState === 1) {
        const session = await VisitorSession.findById(sessionId);
        if (session) {
          await session.endSession();
        }
        activeSessions.delete(socket.id);
      }
      
      // Remove from real-time tracking
      liveVisitors.delete(socket.id);
      broadcastVisitorStats();
    } catch (error) {
      console.error('Error ending visitor session:', error);
    }
  });
});

// Function to broadcast visitor statistics to admin clients
function broadcastVisitorStats() {
  const visitors = Array.from(liveVisitors.values());
  const totalVisitors = visitors.length;
  const loggedInVisitors = visitors.filter(v => v.isLoggedIn);
  const anonymousVisitors = visitors.filter(v => !v.isLoggedIn);

  const visitorStats = {
    totalVisitors,
    loggedInCount: loggedInVisitors.length,
    anonymousCount: anonymousVisitors.length,
    loggedInVisitors: loggedInVisitors.map(v => ({
      email: v.email,
      name: v.name,
      currentPage: v.currentPage,
      joinTime: v.joinTime,
      lastActivity: v.lastActivity
    })),
    anonymousVisitors: anonymousVisitors.map(v => ({
      socketId: v.socketId.substring(0, 8), // Short ID for display
      currentPage: v.currentPage,
      joinTime: v.joinTime,
      lastActivity: v.lastActivity
    }))
  };

  // Only log visitor stats in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Broadcasting visitor stats:', visitorStats);
    console.log('Admin room members:', io.sockets.adapter.rooms.get('admin-room')?.size || 0);
  }

  // Emit to admin room (we'll join admins to this room)
  io.to('admin-room').emit('visitor-update', visitorStats);
  
  // Also broadcast advanced stats
  broadcastAdvancedStats();
}

// Function to broadcast advanced visitor statistics
async function broadcastAdvancedStats() {
  try {
    // Check if MongoDB connection is ready
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, skipping advanced stats broadcast');
      return;
    }
    
    // --- All-time unique visitors ---
    const allTime = await VisitorSession.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $ne: ['$userId', null] },
              '$userId',
              '$sessionId'
            ]
          }
        }
      },
      { $count: 'uniqueVisitors' }
    ]);
    const totalAllTime = allTime[0]?.uniqueVisitors || 0;

    // --- Unique visitors for periods ---
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, week, month] = await Promise.all([
      VisitorSession.aggregate([
        { $match: { startTime: { $gte: startOfToday } } },
        { $group: { _id: { $cond: [ { $ne: ['$userId', null] }, '$userId', '$sessionId' ] } } },
        { $count: 'uniqueVisitors' }
      ]),
      VisitorSession.aggregate([
        { $match: { startTime: { $gte: startOfWeek } } },
        { $group: { _id: { $cond: [ { $ne: ['$userId', null] }, '$userId', '$sessionId' ] } } },
        { $count: 'uniqueVisitors' }
      ]),
      VisitorSession.aggregate([
        { $match: { startTime: { $gte: startOfMonth } } },
        { $group: { _id: { $cond: [ { $ne: ['$userId', null] }, '$userId', '$sessionId' ] } } },
        { $count: 'uniqueVisitors' }
      ])
    ]);
    const totalToday = today[0]?.uniqueVisitors || 0;
    const totalWeek = week[0]?.uniqueVisitors || 0;
    const totalMonth = month[0]?.uniqueVisitors || 0;

    // --- Peak online (in-memory) ---
    const currentOnline = liveVisitors.size;
    if (currentOnline > peakOnlineVisitors) {
      peakOnlineVisitors = currentOnline;
    }

    // --- Current page popularity ---
    const pageCounts = {};
    for (const visitor of liveVisitors.values()) {
      if (!visitor.currentPage) continue;
      pageCounts[visitor.currentPage] = (pageCounts[visitor.currentPage] || 0) + 1;
    }
    const currentPages = Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);

    // --- Device/Browser breakdown ---
    const deviceCounts = {};
    const browserCounts = {};
    for (const visitor of liveVisitors.values()) {
      const ua = visitor.userAgent || '';
      let device = 'Desktop';
      if (/mobile/i.test(ua)) device = 'Mobile';
      else if (/tablet|ipad/i.test(ua)) device = 'Tablet';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      
      let browser = 'Other';
      if (/chrome/i.test(ua)) browser = 'Chrome';
      else if (/firefox/i.test(ua)) browser = 'Firefox';
      else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
      else if (/edg/i.test(ua)) browser = 'Edge';
      else if (/opera|opr/i.test(ua)) browser = 'Opera';
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    }

    const advancedStats = {
      totalAllTime,
      totalToday,
      totalWeek,
      totalMonth,
      peakOnline: peakOnlineVisitors,
      currentOnline,
      currentPages,
      deviceCounts,
      browserCounts
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Broadcasting advanced stats:', advancedStats);
    }
    io.to('admin-room').emit('advanced-stats-update', advancedStats);
  } catch (error) {
    console.error('Error broadcasting advanced stats:', error);
  }
}

// Function to broadcast dashboard stats updates
async function broadcastDashboardStats() {
  try {
    // Check if MongoDB connection is ready
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, skipping dashboard stats broadcast');
      return;
    }
    
    const User = require('./models/User');
    const Asset = require('./models/Asset');
    const Graph = require('./models/Graph');
    const Review = require('./models/Review');

    const [totalUsers, totalCreators, totalAssets, totalGraphs, totalReviews, totalDownloads, totalViews] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isCreator: true }),
      Asset.countDocuments(),
      Graph.countDocuments(),
      Review.countDocuments(),
      Asset.aggregate([{ $group: { _id: null, total: { $sum: '$downloadCount' } } }]),
      Asset.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }])
    ]);

    const stats = {
      totalUsers,
      totalCreators,
      totalAssets,
      totalGraphs,
      totalReviews,
      totalDownloads: totalDownloads[0]?.total || 0,
      totalViews: totalViews[0]?.total || 0
    };

    // Broadcast updated stats to all admin clients
    io.to('admin-room').emit('admin-stats-update', {
      type: 'stats',
      action: 'updated',
      data: stats,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error broadcasting dashboard stats:', error);
  }
}

// Cleanup inactive visitors (older than 5 minutes)
setInterval(() => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  let removedCount = 0;
  
  for (const [socketId, visitor] of liveVisitors.entries()) {
    if (visitor.lastActivity < fiveMinutesAgo) {
      liveVisitors.delete(socketId);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`Cleaned up ${removedCount} inactive visitors`);
    broadcastVisitorStats();
  }
}, 60000); // Check every minute

// Cleanup old database sessions (older than 30 days)
setInterval(async () => {
  try {
    // Check if MongoDB connection is ready
    if (mongoose.connection.readyState !== 1) {
      return;
    }
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await VisitorSession.deleteMany({
      startTime: { $lt: thirtyDaysAgo }
    });
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} old visitor sessions from database`);
    }
  } catch (error) {
    console.error('Error cleaning up old sessions:', error);
  }
}, 24 * 60 * 60 * 1000); // Check daily

// End any sessions that are still marked as active but haven't been updated
setInterval(async () => {
  try {
    // Check if MongoDB connection is ready
    if (mongoose.connection.readyState !== 1) {
      return;
    }
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await VisitorSession.updateMany(
      {
        isActive: true,
        lastActivity: { $lt: fiveMinutesAgo }
      },
      {
        $set: {
          isActive: false,
          endTime: new Date()
        }
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`Ended ${result.modifiedCount} inactive database sessions`);
    }
  } catch (error) {
    console.error('Error ending inactive sessions:', error);
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Periodic dashboard stats update (every 30 seconds)
setInterval(() => {
  broadcastDashboardStats();
}, 30000);

// Periodic MongoDB connection check and reconnection attempt (every 60 seconds)
setInterval(async () => {
  if (!isMongoDBConnected()) {
    console.log('🔍 MongoDB connection check: Not connected, attempting reconnection...');
    await attemptMongoDBReconnection();
  }
}, 60000);

// Make io available for routes
app.set('io', io);
app.set('liveVisitors', liveVisitors);
app.set('broadcastVisitorStats', broadcastVisitorStats);
app.set('broadcastDashboardStats', broadcastDashboardStats);
app.set('isMongoDBConnected', isMongoDBConnected);
app.set('attemptMongoDBReconnection', attemptMongoDBReconnection);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/creator', require('./routes/creator'));
app.use('/api/graphs', require('./routes/graphs'));
app.use('/api', require('./routes/assets'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/monetization', require('./routes/monetization'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/messages', require('./routes/messages'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Graphykon API' });
});

// API base route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Graphykon API is working', 
    version: '1.0.0',
    mongodb: {
      connected: isMongoDBConnected(),
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const connectionStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const dbState = mongoose.connection.readyState;
  const dbStatus = connectionStates[dbState] || 'unknown';
  
  let dbTest = null;
  try {
    if (dbState === 1) {
      // Test database with a simple operation
      const adminDb = mongoose.connection.db.admin();
      await adminDb.ping();
      dbTest = 'success';
    }
  } catch (error) {
    dbTest = `failed: ${error.message}`;
  }
  
  res.json({
    status: 'ok',
    server: 'running',
    mongodb: {
      connected: isMongoDBConnected(),
      status: dbStatus,
      state: dbState,
      test: dbTest,
      database: mongoose.connection.db ? mongoose.connection.db.databaseName : null
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Detailed database status endpoint for debugging
app.get('/api/debug/db-status', async (req, res) => {
  const connectionStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const dbState = mongoose.connection.readyState;
  
  let collections = [];
  let userCount = 0;
  let dbTest = null;
  
  try {
    if (dbState === 1) {
      // Get collections
      const db = mongoose.connection.db;
      const collectionList = await db.listCollections().toArray();
      collections = collectionList.map(col => col.name);
      
      // Test user model
      const User = require('./models/User');
      userCount = await User.countDocuments();
      
      dbTest = 'all-operations-successful';
    }
  } catch (error) {
    dbTest = `error: ${error.message}`;
  }
  
  res.json({
    mongodb: {
      connectionState: dbState,
      connectionStatus: connectionStates[dbState] || 'unknown',
      databaseName: mongoose.connection.db?.databaseName || 'not-connected',
      uri: process.env.MONGODB_URI?.replace(/:([^:@]{8})[^:@]*@/, ':****@') || 'not-set',
      collections,
      userCount,
      test: dbTest
    },
    server: {
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🗄️  MongoDB status: ${isMongoDBConnected() ? 'Connected' : 'Disconnected'}`);
  
  if (!isMongoDBConnected()) {
    console.log('⚠️  Note: Server is running without MongoDB connection');
    console.log('   Some features may not work until MongoDB is available');
  }
}); 