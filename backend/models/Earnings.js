const mongoose = require('mongoose');

const earningsSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  downloader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0.90 // 0.90 INR per download
  },
  downloadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  transactionId: {
    type: String
  },
  notes: {
    type: String
  }
});

// Create compound index to ensure one earning per downloader per asset
earningsSchema.index({ asset: 1, downloader: 1 }, { unique: true });

// Index for efficient queries
earningsSchema.index({ creator: 1, downloadDate: -1 });
earningsSchema.index({ asset: 1, downloadDate: -1 });

module.exports = mongoose.model('Earnings', earningsSchema); 