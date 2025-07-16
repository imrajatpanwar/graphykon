const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Asset = require('../models/Asset');
const Graph = require('../models/Graph');
const Review = require('../models/Review');
const VisitorSession = require('../models/VisitorSession');
const adminAuth = require('../middleware/adminAuth');
const bcrypt = require('bcryptjs');

// PUBLIC ENDPOINTS (no auth required)
// Get trending assets (public endpoint)
router.get('/trending', async (req, res) => {
  try {
    // 1. Get manually marked trending assets
    let trendingAssets = await Asset.find({ isTrending: true })
      .populate('creator', 'username displayName profileImage verification')
      .sort({ trendingOrder: 1, createdAt: -1 })
      .limit(5)
      .lean();

    // 2. Get top 4 assets with most views in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const topViewed = await Asset.find({ createdAt: { $lte: new Date() } })
      .sort({ viewCount: -1 })
      .limit(10)
      .lean();
    const topRecent = topViewed.slice(0, 4);

    // 3. Merge, avoiding duplicates, up to 5 total
    const trendingIds = new Set(trendingAssets.map(a => a._id.toString()));
    const combined = [...trendingAssets];
    for (const asset of topRecent) {
      if (!trendingIds.has(asset._id.toString())) {
        combined.push(asset);
        trendingIds.add(asset._id.toString());
      }
    }

    // Always return at most 5 assets
    res.json(combined.slice(0, 5));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Apply admin auth middleware to all admin routes below
router.use(adminAuth);

// Get live visitor statistics
router.get('/visitors', async (req, res) => {
  try {
    const liveVisitors = req.app.get('liveVisitors');
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
        socketId: v.socketId.substring(0, 8),
        currentPage: v.currentPage,
        joinTime: v.joinTime,
        lastActivity: v.lastActivity
      }))
    };

    res.json(visitorStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get historical visitor analytics
router.get('/visitors/analytics/:days', async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 1;
    const stats = await VisitorSession.getVisitorStats(days);
    
    // Get daily breakdown for the period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const dailyBreakdown = await VisitorSession.aggregate([
      {
        $match: {
          startTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$startTime' },
            month: { $month: '$startTime' },
            day: { $dayOfMonth: '$startTime' }
          },
          sessions: { $sum: 1 },
          uniqueVisitors: { $addToSet: { 
            $cond: [
              { $ne: ['$userId', null] },
              '$userId',
              '$sessionId'
            ]
          }},
          loggedInSessions: {
            $sum: { $cond: ['$isLoggedIn', 1, 0] }
          },
          pageViews: { $sum: '$totalPageViews' }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          sessions: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          loggedInSessions: 1,
          pageViews: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Get top pages
    const topPages = await VisitorSession.aggregate([
      {
        $match: {
          startTime: { $gte: startDate }
        }
      },
      {
        $unwind: '$pageViews'
      },
      {
        $group: {
          _id: '$pageViews.page',
          visits: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          page: '$_id',
          visits: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' }
        }
      },
      {
        $sort: { visits: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      period: `${days} day${days > 1 ? 's' : ''}`,
      summary: stats,
      dailyBreakdown,
      topPages
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get visitor analytics summary for multiple periods
router.get('/visitors/summary', async (req, res) => {
  try {
    const [today, last7Days, last30Days] = await Promise.all([
      VisitorSession.getVisitorStats(1),
      VisitorSession.getVisitorStats(7),
      VisitorSession.getVisitorStats(30)
    ]);

    res.json({
      today,
      last7Days,
      last30Days
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Enhanced live visitors stats endpoint
router.get('/visitors/summary-advanced', async (req, res) => {
  try {
    const VisitorSession = require('../models/VisitorSession');
    const liveVisitors = req.app.get('liveVisitors');
    
    console.log('API: Getting advanced stats, live visitors:', liveVisitors.size);
    
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

    // --- Peak online (in-memory, fallback to max in DB) ---
    let peakOnline = req.app.get('peakOnline') || 0;
    const currentOnline = liveVisitors.size;
    if (currentOnline > peakOnline) {
      peakOnline = currentOnline;
      req.app.set('peakOnline', peakOnline);
    }
    // Optionally, you could persist this in DB for durability.

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
      // Simple device detection
      let device = 'Desktop';
      if (/mobile/i.test(ua)) device = 'Mobile';
      else if (/tablet|ipad/i.test(ua)) device = 'Tablet';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      // Simple browser detection
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
      peakOnline,
      currentOnline,
      currentPages,
      deviceCounts,
      browserCounts
    };

    console.log('API: Returning advanced stats:', advancedStats);
    res.json(advancedStats);
  } catch (error) {
    console.error('API: Error getting advanced stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test endpoint to manually trigger visitor stats broadcast
router.post('/visitors/test-broadcast', async (req, res) => {
  try {
    const io = req.app.get('io');
    if (io) {
      console.log('Test: Manually broadcasting visitor stats');
      const broadcastVisitorStats = req.app.get('broadcastVisitorStats');
      if (broadcastVisitorStats) {
        broadcastVisitorStats();
      }
      res.json({ message: 'Broadcast triggered' });
    } else {
      res.status(500).json({ message: 'Socket.IO not available' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Dashboard Statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCreators = await User.countDocuments({ isCreator: true });
    const totalAssets = await Asset.countDocuments();
    const totalGraphs = await Graph.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalDownloads = await Asset.aggregate([
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]);
    const totalViews = await Asset.aggregate([
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ]);

    // Recent activity
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt');
    const recentAssets = await Asset.find().populate('creator', 'name').sort({ createdAt: -1 }).limit(5);
    const recentReviews = await Review.find().populate('reviewer', 'name').populate('creator', 'name').sort({ createdAt: -1 }).limit(5);

    res.json({
      stats: {
        totalUsers,
        totalCreators,
        totalAssets,
        totalGraphs,
        totalReviews,
        totalDownloads: totalDownloads[0]?.total || 0,
        totalViews: totalViews[0]?.total || 0
      },
      recentActivity: {
        recentUsers,
        recentAssets,
        recentReviews
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// USER MANAGEMENT
// Get all users with pagination and search
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';
    const isCreator = req.query.isCreator;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;
    if (isCreator !== undefined) query.isCreator = isCreator === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, status, isCreator, isAdmin, verification } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status !== undefined) user.status = status;
    if (isCreator !== undefined) user.isCreator = isCreator;
    if (isAdmin !== undefined) user.isAdmin = isAdmin;

    // Handle verification updates
    if (verification !== undefined) {
      if (verification.isBlueVerified !== undefined) {
        user.verification.isBlueVerified = verification.isBlueVerified;
        if (verification.isBlueVerified) {
          user.verification.verifiedAt = new Date();
          user.verification.verifiedBy = req.user._id;
        }
      }
      if (verification.isGrayVerified !== undefined) {
        user.verification.isGrayVerified = verification.isGrayVerified;
        if (verification.isGrayVerified) {
          user.verification.verifiedAt = new Date();
          user.verification.verifiedBy = req.user._id;
        }
      }
    }

    await user.save();
    
    const updatedUser = await User.findById(user._id).select('-password');
    
    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-users-updated', {
        action: 'updated',
        data: updatedUser,
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'users',
        action: 'updated',
        data: updatedUser,
        timestamp: new Date()
      });
      
      // Broadcast updated dashboard stats
      const broadcastDashboardStats = req.app.get('broadcastDashboardStats');
      if (broadcastDashboardStats) {
        setTimeout(broadcastDashboardStats, 500);
      }
    }
    
    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting the last admin
    if (user.isAdmin) {
      const adminCount = await User.countDocuments({ isAdmin: true });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    
    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-users-deleted', {
        action: 'deleted',
        data: { _id: req.params.id, name: user.name },
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'users',
        action: 'deleted',
        data: { _id: req.params.id, name: user.name },
        timestamp: new Date()
      });
      
      // Broadcast updated dashboard stats
      const broadcastDashboardStats = req.app.get('broadcastDashboardStats');
      if (broadcastDashboardStats) {
        setTimeout(broadcastDashboardStats, 500);
      }
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// VERIFICATION MANAGEMENT
// Give Blue Tick verification to user
router.post('/users/:id/verify-blue', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verification.isBlueVerified = true;
    user.verification.verifiedAt = new Date();
    user.verification.verifiedBy = req.user._id;
    
    await user.save();
    
    const updatedUser = await User.findById(user._id).select('-password');
    
    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-users-updated', {
        action: 'blue-verified',
        data: updatedUser,
        timestamp: new Date()
      });
    }
    
    res.json({ message: 'Blue tick verification granted successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Give Gray Tick verification to user
router.post('/users/:id/verify-gray', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verification.isGrayVerified = true;
    user.verification.verifiedAt = new Date();
    user.verification.verifiedBy = req.user._id;
    
    await user.save();
    
    const updatedUser = await User.findById(user._id).select('-password');
    
    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-users-updated', {
        action: 'gray-verified',
        data: updatedUser,
        timestamp: new Date()
      });
    }
    
    res.json({ message: 'Gray tick verification granted successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove verification from user
router.delete('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verification.isBlueVerified = false;
    user.verification.isGrayVerified = false;
    user.verification.verifiedAt = null;
    user.verification.verifiedBy = null;
    
    await user.save();
    
    const updatedUser = await User.findById(user._id).select('-password');
    
    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-users-updated', {
        action: 'verification-removed',
        data: updatedUser,
        timestamp: new Date()
      });
    }
    
    res.json({ message: 'Verification removed successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ASSET MANAGEMENT
// Get all assets with pagination and search
router.get('/assets', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const license = req.query.license || '';

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (license) query.license = license;

    const assets = await Asset.find(query)
      .populate('creator', 'name email displayName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Asset.countDocuments(query);

    res.json({
      assets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete asset
router.delete('/assets/:id', async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-assets-deleted', {
        action: 'deleted',
        data: { _id: req.params.id, title: asset.title },
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'assets',
        action: 'deleted',
        data: { _id: req.params.id, title: asset.title },
        timestamp: new Date()
      });
      
      // Broadcast updated dashboard stats
      const broadcastDashboardStats = req.app.get('broadcastDashboardStats');
      if (broadcastDashboardStats) {
        setTimeout(broadcastDashboardStats, 500);
      }
    }
    
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Copyright strike management
// Apply copyright strike to asset
router.post('/assets/:id/copyright-strike', async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Reason is required for copyright strike' });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Apply copyright strike
    asset.copyrightStrike = {
      isStruck: true,
      reason: reason.trim(),
      adminId: req.user.id,
      struckAt: new Date(),
      appeal: {
        isAppealed: false,
        appealReason: '',
        appealedAt: null,
        status: 'pending',
        adminResponse: '',
        respondedAt: null
      }
    };

    await asset.save();

    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-assets-updated', {
        action: 'copyright-strike',
        data: { _id: asset._id, title: asset.title, reason },
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'assets',
        action: 'copyright-strike',
        data: { _id: asset._id, title: asset.title, reason },
        timestamp: new Date()
      });
    }

    res.json({ message: 'Copyright strike applied successfully', asset });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove copyright strike from asset
router.delete('/assets/:id/copyright-strike', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Remove copyright strike
    asset.copyrightStrike = {
      isStruck: false,
      reason: '',
      adminId: null,
      struckAt: null,
      appeal: {
        isAppealed: false,
        appealReason: '',
        appealedAt: null,
        status: 'pending',
        adminResponse: '',
        respondedAt: null
      }
    };

    await asset.save();

    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-assets-updated', {
        action: 'copyright-strike-removed',
        data: { _id: asset._id, title: asset.title },
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'assets',
        action: 'copyright-strike-removed',
        data: { _id: asset._id, title: asset.title },
        timestamp: new Date()
      });
    }

    res.json({ message: 'Copyright strike removed successfully', asset });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get copyright appeals with enhanced filtering and search
router.get('/copyright-appeals', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'appealedAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const status = req.query.status;
    const category = req.query.category;
    const dateRange = req.query.dateRange;
    const search = req.query.search;

    // Build query
    const query = {
      'copyrightStrike.isStruck': true,
      'copyrightStrike.appeal.isAppealed': true
    };

    // Status filter
    if (status && status !== 'all') {
      query['copyrightStrike.appeal.status'] = status;
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        query['copyrightStrike.appeal.appealedAt'] = { $gte: startDate };
      }
    }

    // Search filter
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'creator.name': { $regex: search, $options: 'i' } },
        { 'creator.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObject = {};
    if (sortBy === 'title') {
      sortObject.title = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'status') {
      sortObject['copyrightStrike.appeal.status'] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObject['copyrightStrike.appeal.appealedAt'] = sortOrder === 'asc' ? 1 : -1;
    }

    const assets = await Asset.find(query)
      .populate('creator', 'name email displayName')
      .populate('copyrightStrike.adminId', 'name email')
      .populate('copyrightStrike.appeal.respondedBy', 'name email')
      .sort(sortObject)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Asset.countDocuments(query);

    // Get statistics
    const stats = await Asset.aggregate([
      {
        $match: {
          'copyrightStrike.isStruck': true,
          'copyrightStrike.appeal.isAppealed': true
        }
      },
      {
        $group: {
          _id: '$copyrightStrike.appeal.status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObj = {
      total: total,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      if (stat._id) {
        statsObj[stat._id] = stat.count;
      }
    });

    res.json({
      appeals: assets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      stats: statsObj
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Respond to copyright appeal
router.post('/copyright-appeals/:id/respond', async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (approved/rejected) is required' });
    }

    if (!adminResponse || adminResponse.trim() === '') {
      return res.status(400).json({ message: 'Admin response is required' });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (!asset.copyrightStrike.isStruck || !asset.copyrightStrike.appeal.isAppealed) {
      return res.status(400).json({ message: 'No appeal found for this asset' });
    }

    // Update appeal status
    asset.copyrightStrike.appeal.status = status;
    asset.copyrightStrike.appeal.adminResponse = adminResponse.trim();
    asset.copyrightStrike.appeal.respondedAt = new Date();
    asset.copyrightStrike.appeal.respondedBy = req.user._id;

    // Add to appeal history
    asset.copyrightStrike.appeal.appealHistory.push({
      action: 'responded',
      status: status,
      note: adminResponse.trim(),
      adminId: req.user._id,
      timestamp: new Date()
    });

    // If appeal is approved, remove the copyright strike
    if (status === 'approved') {
      asset.copyrightStrike.isStruck = false;
      asset.copyrightStrike.reason = '';
      asset.copyrightStrike.adminId = null;
      asset.copyrightStrike.struckAt = null;
    }

    await asset.save();

    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-appeals-updated', {
        action: 'appeal-responded',
        data: { _id: asset._id, title: asset.title, status },
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'appeals',
        action: 'appeal-responded',
        data: { _id: asset._id, title: asset.title, status },
        timestamp: new Date()
      });
    }

    res.json({ message: 'Appeal response submitted successfully', asset });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk action for copyright appeals
router.post('/copyright-appeals/bulk-action', async (req, res) => {
  try {
    const { appealIds, action } = req.body;
    
    if (!appealIds || !Array.isArray(appealIds) || appealIds.length === 0) {
      return res.status(400).json({ message: 'Valid appeal IDs are required' });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Valid action (approve/reject) is required' });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    const adminResponse = `Bulk ${action} action performed by admin`;

    const updatePromises = appealIds.map(async (appealId) => {
      const asset = await Asset.findById(appealId);
      if (!asset || !asset.copyrightStrike.isStruck || !asset.copyrightStrike.appeal.isAppealed) {
        return null;
      }

      // Update appeal status
      asset.copyrightStrike.appeal.status = status;
      asset.copyrightStrike.appeal.adminResponse = adminResponse;
      asset.copyrightStrike.appeal.respondedAt = new Date();
      asset.copyrightStrike.appeal.respondedBy = req.user._id;

      // Add to appeal history
      asset.copyrightStrike.appeal.appealHistory.push({
        action: 'responded',
        status: status,
        note: adminResponse,
        adminId: req.user._id,
        timestamp: new Date()
      });

      // If appeal is approved, remove the copyright strike
      if (status === 'approved') {
        asset.copyrightStrike.isStruck = false;
        asset.copyrightStrike.reason = '';
        asset.copyrightStrike.adminId = null;
        asset.copyrightStrike.struckAt = null;
      }

      return asset.save();
    });

    await Promise.all(updatePromises.filter(Boolean));

    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-appeals-updated', {
        action: 'bulk-appeal-action',
        data: { count: appealIds.length, action },
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'appeals',
        action: 'bulk-appeal-action',
        data: { count: appealIds.length, action },
        timestamp: new Date()
      });
    }

    res.json({ message: `Bulk ${action} action completed successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export copyright appeals to CSV
router.get('/copyright-appeals/export', async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'appealedAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const status = req.query.status;
    const category = req.query.category;
    const dateRange = req.query.dateRange;
    const search = req.query.search;

    // Build query (same as main endpoint)
    const query = {
      'copyrightStrike.isStruck': true,
      'copyrightStrike.appeal.isAppealed': true
    };

    if (status && status !== 'all') {
      query['copyrightStrike.appeal.status'] = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        query['copyrightStrike.appeal.appealedAt'] = { $gte: startDate };
      }
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'creator.name': { $regex: search, $options: 'i' } },
        { 'creator.email': { $regex: search, $options: 'i' } }
      ];
    }

    const sortObject = {};
    if (sortBy === 'title') {
      sortObject.title = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'status') {
      sortObject['copyrightStrike.appeal.status'] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObject['copyrightStrike.appeal.appealedAt'] = sortOrder === 'asc' ? 1 : -1;
    }

    const assets = await Asset.find(query)
      .populate('creator', 'name email displayName')
      .populate('copyrightStrike.adminId', 'name email')
      .populate('copyrightStrike.appeal.respondedBy', 'name email')
      .sort(sortObject);

    // Generate CSV content
    const csvHeaders = [
      'Asset Title',
      'Category',
      'Creator Name',
      'Creator Email',
      'Strike Reason',
      'Appeal Reason',
      'Appeal Status',
      'Appealed Date',
      'Response Date',
      'Responded By',
      'Admin Response'
    ];

    const csvRows = assets.map(asset => [
      `"${asset.title}"`,
      `"${asset.category}"`,
      `"${asset.creator?.name || 'Unknown'}"`,
      `"${asset.creator?.email || ''}"`,
      `"${asset.copyrightStrike.reason}"`,
      `"${asset.copyrightStrike.appeal.appealReason}"`,
      `"${asset.copyrightStrike.appeal.status}"`,
      `"${asset.copyrightStrike.appeal.appealedAt ? new Date(asset.copyrightStrike.appeal.appealedAt).toISOString() : ''}"`,
      `"${asset.copyrightStrike.appeal.respondedAt ? new Date(asset.copyrightStrike.appeal.respondedAt).toISOString() : ''}"`,
      `"${asset.copyrightStrike.appeal.respondedBy?.name || ''}"`,
      `"${asset.copyrightStrike.appeal.adminResponse || ''}"`
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="copyright-appeals-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get detailed copyright appeal statistics
router.get('/copyright-appeals/stats', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get appeals by status over time
    const appealsByStatus = await Asset.aggregate([
      {
        $match: {
          'copyrightStrike.isStruck': true,
          'copyrightStrike.appeal.isAppealed': true,
          'copyrightStrike.appeal.appealedAt': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            status: '$copyrightStrike.appeal.status',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$copyrightStrike.appeal.appealedAt'
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Get appeals by category
    const appealsByCategory = await Asset.aggregate([
      {
        $match: {
          'copyrightStrike.isStruck': true,
          'copyrightStrike.appeal.isAppealed': true,
          'copyrightStrike.appeal.appealedAt': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$copyrightStrike.appeal.status', 'pending'] }, 1, 0]
            }
          },
          approved: {
            $sum: {
              $cond: [{ $eq: ['$copyrightStrike.appeal.status', 'approved'] }, 1, 0]
            }
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ['$copyrightStrike.appeal.status', 'rejected'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get average response time
    const responseTimeStats = await Asset.aggregate([
      {
        $match: {
          'copyrightStrike.isStruck': true,
          'copyrightStrike.appeal.isAppealed': true,
          'copyrightStrike.appeal.respondedAt': { $exists: true, $ne: null },
          'copyrightStrike.appeal.appealedAt': { $gte: startDate }
        }
      },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ['$copyrightStrike.appeal.respondedAt', '$copyrightStrike.appeal.appealedAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' }
        }
      }
    ]);

    res.json({
      period: `${days} days`,
      appealsByStatus,
      appealsByCategory,
      responseTimeStats: responseTimeStats[0] || { avgResponseTime: 0, minResponseTime: 0, maxResponseTime: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GRAPH MANAGEMENT
// Get all graphs with pagination and search
router.get('/graphs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const graphs = await Graph.find(query)
      .populate('createdBy', 'name email displayName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Graph.countDocuments(query);

    res.json({
      graphs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete graph
router.delete('/graphs/:id', async (req, res) => {
  try {
    const graph = await Graph.findByIdAndDelete(req.params.id);
    if (!graph) {
      return res.status(404).json({ message: 'Graph not found' });
    }
    
    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-graphs-deleted', {
        action: 'deleted',
        data: { _id: req.params.id, title: graph.title },
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'graphs',
        action: 'deleted',
        data: { _id: req.params.id, title: graph.title },
        timestamp: new Date()
      });
      
      // Broadcast updated dashboard stats
      const broadcastDashboardStats = req.app.get('broadcastDashboardStats');
      if (broadcastDashboardStats) {
        setTimeout(broadcastDashboardStats, 500);
      }
    }
    
    res.json({ message: 'Graph deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// REVIEW MANAGEMENT
// Get all reviews with pagination and search
router.get('/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.reviewText = { $regex: search, $options: 'i' };
    }

    const reviews = await Review.find(query)
      .populate('reviewer', 'name email displayName')
      .populate('creator', 'name email displayName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-reviews-deleted', {
        action: 'deleted',
        data: { _id: req.params.id, rating: review.rating },
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'reviews',
        action: 'deleted',
        data: { _id: req.params.id, rating: review.rating },
        timestamp: new Date()
      });
      
      // Broadcast updated dashboard stats
      const broadcastDashboardStats = req.app.get('broadcastDashboardStats');
      if (broadcastDashboardStats) {
        setTimeout(broadcastDashboardStats, 500);
      }
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create admin user (special endpoint)
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { name }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      isAdmin: true
    });

    await user.save();
    res.status(201).json({ message: 'Admin user created successfully', user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// MESSAGE MANAGEMENT
// Get all messages with pagination and search
router.get('/messages', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const conversationId = req.query.conversationId || '';

    const query = {};
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'sender.name': { $regex: search, $options: 'i' } },
        { 'receiver.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'reported') {
      query.isReported = true;
    } else if (status === 'moderated') {
      query.isModerated = true;
    } else if (status === 'deleted') {
      query.isDeleted = true;
    }
    
    if (conversationId) {
      query.conversationId = conversationId;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email displayName profileImage')
      .populate('receiver', 'name email displayName profileImage')
      .populate('reportedBy', 'name email')
      .populate('moderatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get message statistics
router.get('/messages/stats', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalMessages = await Message.countDocuments();
    const messagesInPeriod = await Message.countDocuments({ createdAt: { $gte: startDate } });
    const reportedMessages = await Message.countDocuments({ isReported: true });
    const moderatedMessages = await Message.countDocuments({ isModerated: true });
    const deletedMessages = await Message.countDocuments({ isDeleted: true });

    // Get unique conversations
    const uniqueConversations = await Message.distinct('conversationId');
    const totalConversations = uniqueConversations.length;

    // Get active users (who sent messages in the period)
    const activeUsers = await Message.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$sender' } },
      { $count: 'activeUsers' }
    ]);

    // Get messages by day
    const messagesByDay = await Message.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      period: `${days} days`,
      totalMessages,
      messagesInPeriod,
      reportedMessages,
      moderatedMessages,
      deletedMessages,
      totalConversations,
      activeUsers: activeUsers[0]?.activeUsers || 0,
      messagesByDay
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get conversations list
router.get('/messages/conversations', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const matchQuery = {};
    if (search) {
      matchQuery.$or = [
        { 'senderInfo.name': { $regex: search, $options: 'i' } },
        { 'receiverInfo.name': { $regex: search, $options: 'i' } }
      ];
    }

    const conversations = await Message.aggregate([
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 },
          reportedCount: { $sum: { $cond: ['$isReported', 1, 0] } },
          moderatedCount: { $sum: { $cond: ['$isModerated', 1, 0] } },
          deletedCount: { $sum: { $cond: ['$isDeleted', 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.receiver',
          foreignField: '_id',
          as: 'receiverInfo'
        }
      },
      {
        $match: matchQuery
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      }
    ]);

    const total = await Message.aggregate([
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $last: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.receiver',
          foreignField: '_id',
          as: 'receiverInfo'
        }
      },
      {
        $match: matchQuery
      },
      {
        $count: 'total'
      }
    ]);

    res.json({
      conversations,
      totalPages: Math.ceil((total[0]?.total || 0) / limit),
      currentPage: page,
      total: total[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reported messages
router.get('/messages/reported', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const messages = await Message.find({ isReported: true })
      .populate('sender', 'name email displayName profileImage')
      .populate('receiver', 'name email displayName profileImage')
      .populate('reportedBy', 'name email')
      .populate('moderatedBy', 'name email')
      .sort({ reportedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ isReported: true });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Moderate a message
router.put('/messages/:messageId/moderate', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { messageId } = req.params;
    const { action, reason } = req.body;

    if (!action || !['approved', 'hidden', 'deleted'].includes(action)) {
      return res.status(400).json({ message: 'Valid action (approved/hidden/deleted) is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.moderate(req.user._id, action, reason);

    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-messages-moderated', {
        action: 'moderated',
        data: { _id: messageId, action, reason },
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'messages',
        action: 'moderated',
        data: { _id: messageId, action, reason },
        timestamp: new Date()
      });
    }

    res.json({ message: 'Message moderated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk moderate messages
router.post('/messages/bulk-moderate', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { messageIds, action, reason } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'Valid message IDs are required' });
    }

    if (!action || !['approved', 'hidden', 'deleted'].includes(action)) {
      return res.status(400).json({ message: 'Valid action (approved/hidden/deleted) is required' });
    }

    const updatePromises = messageIds.map(async (messageId) => {
      const message = await Message.findById(messageId);
      if (message) {
        return message.moderate(req.user._id, action, reason);
      }
      return null;
    });

    await Promise.all(updatePromises.filter(Boolean));

    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-messages-moderated', {
        action: 'bulk-moderated',
        data: { count: messageIds.length, action, reason },
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'messages',
        action: 'bulk-moderated',
        data: { count: messageIds.length, action, reason },
        timestamp: new Date()
      });
    }

    res.json({ message: `Bulk moderation completed for ${messageIds.length} messages` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a message (admin)
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.softDelete(req.user._id);

    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-messages-deleted', {
        action: 'deleted',
        data: { _id: messageId },
        timestamp: new Date()
      });
      io.to('admin-room').emit('admin-data-update', {
        type: 'messages',
        action: 'deleted',
        data: { _id: messageId },
        timestamp: new Date()
      });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get message details
router.get('/messages/:messageId', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { messageId } = req.params;

    const message = await Message.findById(messageId)
      .populate('sender', 'name email displayName profileImage')
      .populate('receiver', 'name email displayName profileImage')
      .populate('reportedBy', 'name email')
      .populate('moderatedBy', 'name email')
      .populate('deletedBy', 'name email');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export messages to CSV
router.get('/messages/export', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const { status = 'all', period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = { createdAt: { $gte: startDate } };
    
    if (status === 'reported') {
      query.isReported = true;
    } else if (status === 'moderated') {
      query.isModerated = true;
    } else if (status === 'deleted') {
      query.isDeleted = true;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('reportedBy', 'name email')
      .populate('moderatedBy', 'name email')
      .sort({ createdAt: -1 });

    // Generate CSV content
    const csvHeaders = [
      'Message ID',
      'Sender Name',
      'Sender Email',
      'Receiver Name',
      'Receiver Email',
      'Content',
      'Type',
      'Created At',
      'Is Reported',
      'Report Reason',
      'Reported By',
      'Is Moderated',
      'Moderation Action',
      'Moderation Reason',
      'Moderated By',
      'Is Deleted'
    ];

    const csvRows = messages.map(message => [
      `"${message._id}"`,
      `"${message.sender?.name || 'Unknown'}"`,
      `"${message.sender?.email || ''}"`,
      `"${message.receiver?.name || 'Unknown'}"`,
      `"${message.receiver?.email || ''}"`,
      `"${message.content.replace(/"/g, '""')}"`,
      `"${message.messageType}"`,
      `"${message.createdAt.toISOString()}"`,
      `"${message.isReported}"`,
      `"${message.reportReason || ''}"`,
      `"${message.reportedBy?.name || ''}"`,
      `"${message.isModerated}"`,
      `"${message.moderationAction || ''}"`,
      `"${message.moderationReason || ''}"`,
      `"${message.moderatedBy?.name || ''}"`,
      `"${message.isDeleted}"`
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="messages-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// TRENDING ASSETS MANAGEMENT
// Get all assets for trending management (admin only)
router.get('/trending/manage', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const assets = await Asset.find(query)
      .populate('creator', 'username displayName profileImage')
      .sort({ isTrending: -1, trendingOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Asset.countDocuments(query);
    const trendingCount = await Asset.countDocuments({ isTrending: true });

    res.json({
      assets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      trendingCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add asset to trending
router.post('/trending/add/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    const { order } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check if already trending
    if (asset.isTrending) {
      return res.status(400).json({ message: 'Asset is already trending' });
    }

    // Check trending limit (max 10)
    const trendingCount = await Asset.countDocuments({ isTrending: true });
    if (trendingCount >= 10) {
      return res.status(400).json({ message: 'Maximum 10 trending assets allowed' });
    }

    asset.isTrending = true;
    asset.trendingOrder = order || (trendingCount + 1);
    await asset.save();

    const updatedAsset = await Asset.findById(assetId)
      .populate('creator', 'username displayName profileImage');

    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-trending-updated', {
        action: 'added',
        data: updatedAsset,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Asset added to trending successfully', asset: updatedAsset });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove asset from trending
router.delete('/trending/remove/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (!asset.isTrending) {
      return res.status(400).json({ message: 'Asset is not trending' });
    }

    asset.isTrending = false;
    asset.trendingOrder = undefined;
    await asset.save();

    const updatedAsset = await Asset.findById(assetId)
      .populate('creator', 'username displayName profileImage');

    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-trending-updated', {
        action: 'removed',
        data: updatedAsset,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Asset removed from trending successfully', asset: updatedAsset });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update trending order
router.put('/trending/order', async (req, res) => {
  try {
    const { orders } = req.body; // Array of { assetId, order }

    const updatePromises = orders.map(({ assetId, order }) =>
      Asset.findByIdAndUpdate(assetId, { trendingOrder: order }, { new: true })
    );

    await Promise.all(updatePromises);

    // Broadcast real-time update to other admins
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-trending-updated', {
        action: 'reordered',
        data: orders,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Trending order updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 