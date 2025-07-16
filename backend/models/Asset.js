const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Motion Graphics', 'Web Design', 'Logo Design', 'Print Design', 'Photography', 'Illustration', 'UI/UX', 'Branding', 'Other'],
    required: true,
    default: 'Other'
  },
  coverPage: {
    type: String // path to the uploaded cover image
  },
  showcaseImages: {
    type: [String] // array of paths to showcase images
  },
  description: {
    type: String,
    required: true
  },
  keywords: {
    type: String // comma-separated keywords
  },
  assetFile: {
    type: String // path to the uploaded asset file
  },
  fileSize: {
    type: String, // e.g., "30MB", "1.5GB"
    default: 'Unknown'
  },
  license: {
    type: String,
    enum: ['Free', 'Premium'],
    required: true
  },
  creditRequired: {
    type: Boolean,
    default: false
  },
  creditText: {
    type: String,
    default: ''
  },
  dimension: {
    width: {
      type: Number,
      default: 6000
    },
    height: {
      type: Number,
      default: 4000
    }
  },
  format: {
    type: [String],
    enum: ['JPG', 'PNG', 'PSD', 'CDR', 'PDF'],
    required: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  // Trending fields
  isTrending: {
    type: Boolean,
    default: false
  },
  trendingOrder: {
    type: Number
  },
  // Monetization fields
  totalEarnings: {
    type: Number,
    default: 0
  },
  // Copyright strike fields
  copyrightStrike: {
    isStruck: {
      type: Boolean,
      default: false
    },
    reason: {
      type: String,
      default: ''
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    struckAt: {
      type: Date
    },
    appeal: {
      isAppealed: {
        type: Boolean,
        default: false
      },
      appealReason: {
        type: String,
        default: ''
      },
      appealedAt: {
        type: Date
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      adminResponse: {
        type: String,
        default: ''
      },
      respondedAt: {
        type: Date
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      appealHistory: [{
        action: {
          type: String,
          enum: ['submitted', 'responded', 'status_changed'],
          required: true
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected']
        },
        note: String,
        adminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }]
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to automatically add appeal history when appeal is submitted
assetSchema.pre('save', function(next) {
  if (this.isModified('copyrightStrike.appeal.isAppealed') && this.copyrightStrike.appeal.isAppealed) {
    // Check if this is a new appeal (no history yet)
    if (!this.copyrightStrike.appeal.appealHistory || this.copyrightStrike.appeal.appealHistory.length === 0) {
      this.copyrightStrike.appeal.appealHistory = [{
        action: 'submitted',
        status: 'pending',
        note: 'Appeal submitted by creator',
        timestamp: new Date()
      }];
    }
  }
  next();
});

module.exports = mongoose.model('Asset', assetSchema); 