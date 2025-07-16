const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  downloadDate: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: false
  }
});

// Create a compound index to ensure one download per user per asset (for authenticated users)
downloadSchema.index({ user: 1, asset: 1 }, { 
  unique: true, 
  partialFilterExpression: { user: { $exists: true } } 
});

// Create a compound index to ensure one download per IP per asset (for anonymous users)
downloadSchema.index({ asset: 1, ipAddress: 1 }, { 
  unique: true, 
  partialFilterExpression: { user: { $exists: false } } 
});

// Index for efficient queries
downloadSchema.index({ user: 1, downloadDate: -1 });
downloadSchema.index({ asset: 1, downloadDate: -1 });
downloadSchema.index({ ipAddress: 1, downloadDate: -1 });

module.exports = mongoose.model('Download', downloadSchema); 