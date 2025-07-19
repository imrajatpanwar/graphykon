const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  // Creator Profile Fields
  displayName: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    trim: true,
    sparse: true
  },
  location: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 100
  },
  profileImage: {
    type: String, // URL to the stored image
    default: null
  },
  coverImage: {
    type: String, // URL to the stored image
    default: null
  },
  isCreator: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'creator', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active'
  },
  // Verification System
  verification: {
    isPremium: {
      type: Boolean,
      default: false
    },
    isBlueVerified: {
      type: Boolean,
      default: false
    },
    isGrayVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  // Premium Subscription
  premiumSubscription: {
    isActive: {
      type: Boolean,
      default: false
    },
    plan: {
      type: String,
      enum: ['basic', 'premium', 'pro'],
      default: 'basic'
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  // Follow System
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-verify premium users with golden tick
  if (this.premiumSubscription.isActive && this.premiumSubscription.plan !== 'basic') {
    this.verification.isPremium = true;
    if (!this.verification.verifiedAt) {
      this.verification.verifiedAt = Date.now();
    }
  } else {
    this.verification.isPremium = false;
  }
  
  next();
});

// Virtual for getting verification type
userSchema.virtual('verificationType').get(function() {
  if (this.verification.isPremium) return 'golden';
  if (this.verification.isBlueVerified) return 'blue';
  if (this.verification.isGrayVerified) return 'gray';
  return null;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema); 