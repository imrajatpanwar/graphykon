const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Anonymous users won't have user ID
  },
  type: {
    type: String,
    enum: ['view', 'download', 'like', 'share', 'follow'],
    required: true
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  referrer: {
    type: String,
    required: false
  },
  sessionId: {
    type: String,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
analyticsSchema.index({ asset: 1, type: 1, createdAt: -1 });
analyticsSchema.index({ creator: 1, type: 1, createdAt: -1 });
analyticsSchema.index({ createdAt: -1 });
analyticsSchema.index({ type: 1, createdAt: -1 });

// Compound index for time-based queries
analyticsSchema.index({ creator: 1, type: 1, createdAt: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema); 