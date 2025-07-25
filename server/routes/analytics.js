const express = require('express');
const Analytics = require('../models/Analytics');
const Asset = require('../models/Asset');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/analytics/track
// @desc    Track an analytics event
// @access  Public (for anonymous tracking)
router.post('/track', async (req, res) => {
  try {
    const { assetId, type, userId, sessionId, metadata } = req.body;
    
    // Get asset to find creator
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Create analytics entry
    const analyticsData = {
      asset: assetId,
      creator: asset.creator,
      type,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referrer'),
      sessionId,
      metadata: metadata || {}
    };

    // Add user ID if provided (for authenticated users)
    if (userId) {
      analyticsData.user = userId;
    }

    const analytics = new Analytics(analyticsData);
    await analytics.save();

    res.status(201).json({ success: true, message: 'Analytics tracked successfully' });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ message: 'Server error during analytics tracking' });
  }
});

// @route   GET /api/analytics/overview
// @desc    Get analytics overview for a creator
// @access  Private
router.get('/overview', protect, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get total assets
    const totalAssets = await Asset.countDocuments({ creator: req.user._id });

    // Get analytics data
    const analyticsData = await Analytics.aggregate([
      {
        $match: {
          creator: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get previous period data for comparison
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousAnalyticsData = await Analytics.aggregate([
      {
        $match: {
          creator: req.user._id,
          createdAt: { $gte: previousStartDate, $lt: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate metrics
    const currentViews = analyticsData.find(item => item._id === 'view')?.count || 0;
    const currentDownloads = analyticsData.find(item => item._id === 'download')?.count || 0;
    const currentLikes = analyticsData.find(item => item._id === 'like')?.count || 0;
    const currentShares = analyticsData.find(item => item._id === 'share')?.count || 0;

    const previousViews = previousAnalyticsData.find(item => item._id === 'view')?.count || 0;
    const previousDownloads = previousAnalyticsData.find(item => item._id === 'download')?.count || 0;

    // Calculate percentage changes
    const viewsChange = previousViews > 0 ? ((currentViews - previousViews) / previousViews) * 100 : 0;
    const downloadsChange = previousDownloads > 0 ? ((currentDownloads - previousDownloads) / previousDownloads) * 100 : 0;

    // Mock followers data (would come from a followers system)
    const followers = Math.floor(Math.random() * 100) + 50;
    const followersChange = Math.floor(Math.random() * 20) - 10;

    // Mock earnings data (would come from a payment system)
    const earnings = (currentDownloads * 1.5) + (currentViews * 0.01);
    const previousEarnings = (previousDownloads * 1.5) + (previousViews * 0.01);
    const earningsChange = previousEarnings > 0 ? ((earnings - previousEarnings) / previousEarnings) * 100 : 0;

    res.json({
      success: true,
      overview: {
        totalAssets,
        totalViews: currentViews,
        totalDownloads: currentDownloads,
        totalLikes: currentLikes,
        totalShares: currentShares,
        totalEarnings: Math.round(earnings * 100) / 100,
        followers
      },
      changes: {
        views: Math.round(viewsChange * 100) / 100,
        downloads: Math.round(downloadsChange * 100) / 100,
        earnings: Math.round(earningsChange * 100) / 100,
        followers: followersChange
      }
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ message: 'Server error while fetching analytics overview' });
  }
});

// @route   GET /api/analytics/monthly
// @desc    Get monthly analytics data
// @access  Private
router.get('/monthly', protect, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthlyData = await Analytics.aggregate([
      {
        $match: {
          creator: req.user._id,
          createdAt: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.month',
          types: {
            $push: {
              type: '$_id.type',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Format data for frontend
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedData = months.map((month, index) => {
      const monthData = monthlyData.find(item => item._id === index + 1);
      const views = monthData?.types.find(t => t.type === 'view')?.count || 0;
      const downloads = monthData?.types.find(t => t.type === 'download')?.count || 0;
      const earnings = (downloads * 1.5) + (views * 0.01);

      return {
        month,
        views,
        downloads,
        earnings: Math.round(earnings * 100) / 100
      };
    });

    res.json({
      success: true,
      monthlyStats: formattedData
    });

  } catch (error) {
    console.error('Monthly analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching monthly analytics' });
  }
});

// @route   GET /api/analytics/top-assets
// @desc    Get top performing assets
// @access  Private
router.get('/top-assets', protect, async (req, res) => {
  try {
    const { limit = 10, timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const topAssets = await Analytics.aggregate([
      {
        $match: {
          creator: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$asset',
          views: {
            $sum: { $cond: [{ $eq: ['$type', 'view'] }, 1, 0] }
          },
          downloads: {
            $sum: { $cond: [{ $eq: ['$type', 'download'] }, 1, 0] }
          },
          likes: {
            $sum: { $cond: [{ $eq: ['$type', 'like'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'assets',
          localField: '_id',
          foreignField: '_id',
          as: 'asset'
        }
      },
      {
        $unwind: '$asset'
      },
      {
        $project: {
          _id: 1,
          title: '$asset.title',
          views: 1,
          downloads: 1,
          likes: 1,
          earnings: {
            $add: [
              { $multiply: ['$downloads', 1.5] },
              { $multiply: ['$views', 0.01] }
            ]
          }
        }
      },
      {
        $sort: { downloads: -1, views: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({
      success: true,
      topAssets: topAssets.map(asset => ({
        id: asset._id,
        title: asset.title,
        views: asset.views,
        downloads: asset.downloads,
        likes: asset.likes,
        earnings: Math.round(asset.earnings * 100) / 100
      }))
    });

  } catch (error) {
    console.error('Top assets analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching top assets' });
  }
});

// @route   GET /api/analytics/category-breakdown
// @desc    Get analytics breakdown by category
// @access  Private
router.get('/category-breakdown', protect, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const categoryBreakdown = await Analytics.aggregate([
      {
        $match: {
          creator: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'assets',
          localField: 'asset',
          foreignField: '_id',
          as: 'asset'
        }
      },
      {
        $unwind: '$asset'
      },
      {
        $group: {
          _id: '$asset.category',
          assets: { $addToSet: '$asset._id' },
          views: {
            $sum: { $cond: [{ $eq: ['$type', 'view'] }, 1, 0] }
          },
          downloads: {
            $sum: { $cond: [{ $eq: ['$type', 'download'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          assets: { $size: '$assets' },
          views: 1,
          downloads: 1
        }
      },
      {
        $sort: { views: -1 }
      }
    ]);

    res.json({
      success: true,
      categoryBreakdown
    });

  } catch (error) {
    console.error('Category breakdown error:', error);
    res.status(500).json({ message: 'Server error while fetching category breakdown' });
  }
});

// @route   GET /api/analytics/recent-activity
// @desc    Get recent activity
// @access  Private
router.get('/recent-activity', protect, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const recentActivity = await Analytics.find({ creator: req.user._id })
      .populate('asset', 'title')
      .populate('user', 'name username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const formattedActivity = recentActivity.map(activity => {
      const timeAgo = getTimeAgo(activity.createdAt);
      return {
        id: activity._id,
        type: activity.type,
        asset: activity.asset?.title || 'Unknown Asset',
        user: activity.user ? activity.user.name || activity.user.username : 'Anonymous',
        time: timeAgo,
        timestamp: activity.createdAt
      };
    });

    res.json({
      success: true,
      recentActivity: formattedActivity
    });

  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ message: 'Server error while fetching recent activity' });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

module.exports = router; 