const mongoose = require('mongoose');

const graphSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  nodes: [{
    id: String,
    label: String,
    position: {
      x: Number,
      y: Number
    },
    data: mongoose.Schema.Types.Mixed
  }],
  edges: [{
    id: String,
    source: String,
    target: String,
    label: String,
    data: mongoose.Schema.Types.Mixed
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
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
graphSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Graph', graphSchema); 