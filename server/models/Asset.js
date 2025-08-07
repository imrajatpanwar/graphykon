const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  tags: {
    type: String,
    required: [true, 'Tags are required'],
    trim: true,
    maxlength: [200, 'Tags cannot be more than 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: ['Logo', 'UI Kit', 'Illustration', 'Icon Set', 'Template', 'Mockup', 'Other']
  },
  width: {
    type: String,
    required: [true, 'Width is required'],
    trim: true
  },
  height: {
    type: String,
    required: [true, 'Height is required'],
    trim: true
  },
  credit: {
    type: Boolean,
    default: false
  },
  formats: {
    jpg: {
      type: Boolean,
      default: false
    },
    png: {
      type: Boolean,
      default: false
    },
    psd: {
      type: Boolean,
      default: false
    },
    pdf: {
      type: Boolean,
      default: false
    }
  },
  mainFile: {
    filename: {
      type: String,
      required: [true, 'Main file is required']
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required']
    },
    mimetype: {
      type: String,
      required: [true, 'File type is required']
    },
    size: {
      type: Number,
      required: [true, 'File size is required']
    },
    path: {
      type: String,
      required: [true, 'File path is required']
    }
  },
  coverImages: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    path: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
assetSchema.index({ creator: 1, createdAt: -1 });
assetSchema.index({ category: 1, status: 1 });
assetSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Method to get asset info
assetSchema.methods.getAssetInfo = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    tags: this.tags,
    category: this.category,
    width: this.width,
    height: this.height,
    credit: this.credit,
    formats: this.formats,
    mainFile: this.mainFile,
    coverImages: this.coverImages,
    status: this.status,
    downloads: this.downloads,
    views: this.views,
    rating: this.rating,
    creator: this.creator,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Asset', assetSchema); 