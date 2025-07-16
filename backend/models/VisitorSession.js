const mongoose = require('mongoose');

const VisitorSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userEmail: {
    type: String,
    default: null
  },
  userName: {
    type: String,
    default: null
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  startTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  pageViews: [{
    page: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  totalPageViews: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
VisitorSessionSchema.index({ startTime: -1 });
VisitorSessionSchema.index({ isActive: 1, startTime: -1 });
VisitorSessionSchema.index({ userId: 1, startTime: -1 });

// Method to end session
VisitorSessionSchema.methods.endSession = function() {
  this.endTime = new Date();
  this.isActive = false;
  this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  return this.save();
};

// Method to add page view
VisitorSessionSchema.methods.addPageView = function(page) {
  this.pageViews.push({ page });
  this.totalPageViews = this.pageViews.length;
  this.lastActivity = new Date();
  return this.save();
};

// Static method to get visitor stats
VisitorSessionSchema.statics.getVisitorStats = async function(days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
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
        anonymousSessions: {
          $sum: { $cond: ['$isLoggedIn', 0, 1] }
        },
        totalPageViews: { $sum: '$totalPageViews' },
        avgDuration: { $avg: '$duration' }
      }
    },
    {
      $project: {
        totalSessions: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
        loggedInSessions: 1,
        anonymousSessions: 1,
        totalPageViews: 1,
        avgDuration: { $round: ['$avgDuration', 0] }
      }
    }
  ]);

  return stats[0] || {
    totalSessions: 0,
    uniqueVisitors: 0,
    loggedInSessions: 0,
    anonymousSessions: 0,
    totalPageViews: 0,
    avgDuration: 0
  };
};

module.exports = mongoose.model('VisitorSession', VisitorSessionSchema); 