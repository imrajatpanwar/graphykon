const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: '$'
  },
  period: {
    type: String,
    required: true,
    default: '/month'
  },
  features: [{
    text: {
      type: String,
      required: true
    },
    included: {
      type: Boolean,
      required: true,
      default: true
    }
  }],
  isPopular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  buttonText: {
    type: String,
    default: 'Upgrade'
  },
  buttonVariant: {
    type: String,
    default: 'primary'
  },
  headerStyle: {
    backgroundColor: {
      type: String,
      default: '#007bff'
    },
    textColor: {
      type: String,
      default: '#ffffff'
    }
  },
  borderStyle: {
    type: String,
    default: 'primary'
  },
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
pricingPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PricingPlan', pricingPlanSchema); 