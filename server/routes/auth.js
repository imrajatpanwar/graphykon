const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for profile image uploads
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const profileUpload = multer({
  storage: profileStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit (will be compressed)
  }
});

// Utility function to delete old profile image
const deleteOldProfileImage = (profileImagePath) => {
  if (!profileImagePath) return;
  
  try {
    if (profileImagePath.startsWith('/uploads/profiles/')) {
      // File stored in uploads directory
      const oldImagePath = path.join(__dirname, '..', profileImagePath);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('Deleted old profile image:', oldImagePath);
      }
    } else if (profileImagePath.startsWith('data:')) {
      // Base64 data - no file to delete, but we can log it
      console.log('Replacing base64 profile image');
    }
  } catch (error) {
    console.error('Error deleting old profile image:', error);
    // Don't throw error, just log it
  }
};

// Middleware to process and optimize profile images
const processProfileImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    console.log('Starting image processing for:', req.file.originalname);
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(/\.[^/.]+$/, '_processed.jpg');
    
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error('Input file does not exist');
    }

    // Get original image metadata
    console.log('Getting image metadata...');
    const metadata = await sharp(inputPath).metadata();
    const { width, height, format } = metadata;
    
    console.log(`Original image: ${width}x${height}, format: ${format}`);

    // Validate dimensions
    if (width < 10 || height < 10) {
      throw new Error('Image too small to process');
    }

    // Calculate crop dimensions for square format
    const size = Math.min(width, height);
    const left = Math.floor((width - size) / 2);
    const top = Math.floor((height - size) / 2);

    console.log(`Cropping to square: ${size}x${size} from position (${left}, ${top})`);

    // Process image: crop to square, resize to 512x512, compress
    // Try with different approaches if the first one fails
    try {
      await sharp(inputPath)
        .extract({ left, top, width: size, height: size }) // Crop to square (older Sharp version)
        .resize(512, 512) // Resize to 512x512
        .jpeg({ 
          quality: 80, // Compress with 80% quality
          progressive: true 
        })
        .toFile(outputPath);
    } catch (processingError) {
      console.log('First processing attempt failed, trying alternative approach...');
      
      // Fallback: try without progressive JPEG
      await sharp(inputPath)
        .extract({ left, top, width: size, height: size }) // Crop to square (older Sharp version)
        .resize(512, 512) // Resize to 512x512
        .jpeg({ 
          quality: 80 // Compress with 80% quality
        })
        .toFile(outputPath);
    }

    // Verify output file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Processed file was not created');
    }

    // Replace original file with processed one
    fs.unlinkSync(inputPath);
    fs.renameSync(outputPath, inputPath);

    console.log('Profile image processed successfully: cropped to square, resized to 512x512, compressed');
    next();
  } catch (error) {
    console.error('Image processing error details:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up files
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up input file');
      }
      
      const outputPath = req.file.path.replace(/\.[^/.]+$/, '_processed.jpg');
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log('Cleaned up output file');
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    return res.status(400).json({ 
      message: 'Error processing image. Please try again with a valid image file.',
      details: error.message
    });
  }
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
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

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Send response
    res.status(201).json({
      success: true,
      token,
      user: user.getUserInfo()
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

    const { email, password } = req.body;

    // Find user by email and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Send response
    res.json({
      success: true,
      token,
      user: user.getUserInfo()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.getUserInfo()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/check-username
// @desc    Check if username is available
// @access  Public
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ message: 'Username parameter is required' });
    }

    // Check if username exists
    const existingUser = await User.findOne({ username });
    
    res.json({
      available: !existingUser
    });

  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, profileUpload.single('profileImage'), processProfileImage, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot be more than 500 characters')
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

    const updateData = { ...req.body };

    // Handle profile image upload
    if (req.file) {
      // Delete old profile image if it exists
      deleteOldProfileImage(req.user.profileImage);
      
      updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    // Check if username is available (if being updated)
    if (updateData.username && updateData.username !== req.user.username) {
      const existingUser = await User.findOne({ username: updateData.username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.getUserInfo()
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// @route   DELETE /api/auth/profile-image
// @desc    Delete user profile image
// @access  Private
router.delete('/profile-image', protect, async (req, res) => {
  try {
    // Delete old profile image if it exists
    if (req.user.profileImage) {
      deleteOldProfileImage(req.user.profileImage);
    }

    // Update user to remove profile image
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: null },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile image deleted successfully',
      user: updatedUser.getUserInfo()
    });

  } catch (error) {
    console.error('Profile image deletion error:', error);
    res.status(500).json({ message: 'Server error during profile image deletion' });
  }
});

module.exports = router; 