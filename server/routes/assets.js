const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Asset = require('../models/Asset');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/assets/public
// @desc    Get all published assets (public access)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;



    const assets = await Asset.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name username profileImage');

    const total = await Asset.countDocuments({ status: 'published' });

    const assetInfos = assets.map(asset => asset.getAssetInfo());

    res.json({
      success: true,
      assets: assetInfos,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get public assets error:', error);
    res.status(500).json({ message: 'Server error while fetching assets' });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow specific file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/postscript',
    'application/zip',
    'application/x-rar-compressed',
    'application/octet-stream', // For PSD files
    'application/illustrator', // For AI files
    'application/x-illustrator', // Alternative MIME type for AI files
    'application/eps', // For EPS files
    'application/x-eps' // Alternative MIME type for EPS files
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and archives are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
    files: 5 // Max 5 files (1 main file + 4 cover images)
  }
});

// @route   POST /api/assets/upload
// @desc    Upload a new asset
// @access  Private
router.post('/upload', protect, (req, res, next) => {
  upload.fields([
    { name: 'mainFile', maxCount: 1 },
    { name: 'coverImages', maxCount: 4 }
  ])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files uploaded' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('tags')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Tags must be between 1 and 200 characters'),
  body('category')
    .trim()
    .isIn(['Logo', 'UI Kit', 'Illustration', 'Icon Set', 'Template', 'Mockup', 'Other'])
    .withMessage('Invalid category'),
  body('width')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Width is required'),
  body('height')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Height is required'),
  body('credit')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Credit must be true or false'),
  body('formats.jpg')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('JPG format must be true or false'),
  body('formats.png')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('PNG format must be true or false'),
  body('formats.psd')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('PSD format must be true or false'),
  body('formats.pdf')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('PDF format must be true or false')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    // Check if user is a creator
    if (!req.user.creator) {
      return res.status(403).json({ message: 'Only creators can upload assets' });
    }

    // Check if files were uploaded
    if (!req.files || !req.files.mainFile || !req.files.coverImages) {
      return res.status(400).json({ message: 'Main file and cover images are required' });
    }

    // Check if at least one format is selected
    const formats = {
      jpg: req.body['formats.jpg'] === 'true',
      png: req.body['formats.png'] === 'true',
      psd: req.body['formats.psd'] === 'true',
      pdf: req.body['formats.pdf'] === 'true'
    };
    
    const hasFormat = Object.values(formats).some(format => format);
    if (!hasFormat) {
      return res.status(400).json({ message: 'At least one format must be selected' });
    }

    const mainFile = req.files.mainFile[0];
    const coverImages = req.files.coverImages;

    // Validate file sizes
    if (mainFile.size > 500 * 1024 * 1024) {
      return res.status(400).json({ message: 'Main file size exceeds 500MB limit' });
    }

    for (const image of coverImages) {
      if (image.size > 10 * 1024 * 1024) { // 10MB limit for cover images
        return res.status(400).json({ message: 'Cover image size exceeds 10MB limit' });
      }
    }

    // Create asset object
    const assetData = {
      creator: req.user._id,
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags,
      category: req.body.category,
      width: req.body.width,
      height: req.body.height,
      credit: req.body.credit === 'true',
      formats: formats,
      mainFile: {
        filename: mainFile.filename,
        originalName: mainFile.originalname,
        mimetype: mainFile.mimetype,
        size: mainFile.size,
        path: mainFile.path
      },
      coverImages: coverImages.map(image => ({
        filename: image.filename,
        originalName: image.originalname,
        mimetype: image.mimetype,
        size: image.size,
        path: image.path
      }))
    };

    // Create new asset
    const asset = new Asset(assetData);
    await asset.save();

    res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully',
      asset: asset.getAssetInfo()
    });

  } catch (error) {
    console.error('Asset upload error:', error);
    
    // Clean up uploaded files if there was an error
    if (req.files) {
      if (req.files.mainFile) {
        fs.unlinkSync(req.files.mainFile[0].path);
      }
      if (req.files.coverImages) {
        req.files.coverImages.forEach(image => {
          fs.unlinkSync(image.path);
        });
      }
    }
    
    res.status(500).json({ message: 'Server error during asset upload' });
  }
});

// @route   GET /api/assets
// @desc    Get all assets for a creator
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const assets = await Asset.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name username');

    const total = await Asset.countDocuments({ creator: req.user._id });

    res.json({
      success: true,
      assets: assets.map(asset => asset.getAssetInfo()),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ message: 'Server error while fetching assets' });
  }
});

// @route   GET /api/assets/:id
// @desc    Get a specific asset
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('creator', 'name username profileImage');

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check if user owns the asset or is admin
    if (asset.creator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      asset: asset.getAssetInfo()
    });

  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ message: 'Server error while fetching asset' });
  }
});

// @route   PUT /api/assets/:id
// @desc    Update an asset
// @access  Private
router.put('/:id', protect, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('tags')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Tags must be between 1 and 200 characters'),
  body('category')
    .optional()
    .trim()
    .isIn(['graphics', 'illustrations', 'templates', 'icons', 'textures', 'other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check if user owns the asset
    if (asset.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update asset
    const updatedAsset = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('creator', 'name username');

    res.json({
      success: true,
      message: 'Asset updated successfully',
      asset: updatedAsset.getAssetInfo()
    });

  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ message: 'Server error while updating asset' });
  }
});

// @route   DELETE /api/assets/:id
// @desc    Delete an asset
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check if user owns the asset
    if (asset.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete files from filesystem
    try {
      if (asset.mainFile && asset.mainFile.path) {
        fs.unlinkSync(asset.mainFile.path);
      }
      asset.coverImages.forEach(image => {
        if (image.path) {
          fs.unlinkSync(image.path);
        }
      });
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await Asset.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });

  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ message: 'Server error while deleting asset' });
  }
});

// @route   GET /api/assets/download/:id
// @desc    Download an asset file
// @access  Private
router.get('/download/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check if file exists
    if (!asset.mainFile || !asset.mainFile.path) {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = asset.mainFile.path;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Increment download count
    asset.downloads += 1;
    await asset.save();

    // Send file
    res.download(filePath, asset.mainFile.originalName);

  } catch (error) {
    console.error('Download asset error:', error);
    res.status(500).json({ message: 'Server error while downloading asset' });
  }
});

// @route   GET /api/assets/image/:filename
// @desc    Serve image files with proper CORS headers (assets and profile images)
// @access  Public
router.get('/image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Try asset images first
    let filePath = path.join(__dirname, '../uploads', filename);
    
    // If not found in uploads, try profiles directory
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, '../uploads/profiles', filename);
    }
    
    // Check if file exists in either location
    if (!fs.existsSync(filePath)) {
      console.log('Image not found:', filename);
      console.log('Tried paths:', [
        path.join(__dirname, '../uploads', filename),
        path.join(__dirname, '../uploads/profiles', filename)
      ]);
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Set proper headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp'
    };
    
    res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
    
    console.log('Serving image:', filename, 'from:', filePath);
    
    // Send file
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('Image serve error:', error);
    res.status(500).json({ message: 'Server error while serving image' });
  }
});



module.exports = router; 