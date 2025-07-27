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
    fileSize: 500 * 1024 // 500KB limit
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

// Middleware to validate image dimensions
const validateImageDimensions = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const metadata = await sharp(req.file.path).metadata();
    const { width, height } = metadata;

    // Check if image is square
    if (width !== height) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'Profile image must be square (same width and height)' 
      });
    }

    // Check if dimensions are within allowed range
    if (width < 300 || width > 1080) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'Profile image dimensions must be between 300x300 and 1080x1080 pixels' 
      });
    }

    next();
  } catch (error) {
    console.error('Image validation error:', error);
    // Delete the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ 
      message: 'Invalid image file. Please upload a valid image.' 
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
router.put('/profile', protect, profileUpload.single('profileImage'), validateImageDimensions, [
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