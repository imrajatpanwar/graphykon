const express = require('express');
const { body, validationResult } = require('express-validator');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/creator/be-a-creator
// @desc    Register user as a creator
// @access  Private
router.post('/be-a-creator', protect, [
  body('creatorName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Creator name must be between 2 and 50 characters'),
  body('username')
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

    const { creatorName, username, phone, location, profileImage, bio } = req.body;

    // Validate profile image if provided
    if (profileImage) {
      try {
        // Remove data URL prefix to get base64 data
        const base64Data = profileImage.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Get image metadata
        const metadata = await sharp(buffer).metadata();
        const { width, height } = metadata;

        // Check if image is square
        if (width !== height) {
          return res.status(400).json({ 
            message: 'Profile image must be square (same width and height)' 
          });
        }

        // Check if dimensions are within allowed range
        if (width < 300 || width > 1080) {
          return res.status(400).json({ 
            message: 'Profile image dimensions must be between 300x300 and 1080x1080 pixels' 
          });
        }

        // Check file size (500KB limit)
        if (buffer.length > 500 * 1024) {
          return res.status(400).json({ 
            message: 'Profile image must be less than 500KB' 
          });
        }
      } catch (error) {
        console.error('Image validation error:', error);
        return res.status(400).json({ 
          message: 'Invalid image file. Please upload a valid image.' 
        });
      }
    }

    // Check if username is available
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Handle old profile image cleanup if new image is provided
    if (profileImage && req.user.profileImage) {
      try {
        if (req.user.profileImage.startsWith('/uploads/profiles/')) {
          // File stored in uploads directory
          const oldImagePath = path.join(__dirname, '..', req.user.profileImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('Deleted old profile image:', oldImagePath);
          }
        } else if (req.user.profileImage.startsWith('data:')) {
          // Base64 data - no file to delete, but we can log it
          console.log('Replacing base64 profile image with new base64 data');
        }
      } catch (error) {
        console.error('Error deleting old profile image:', error);
        // Continue with the update even if deletion fails
      }
    }

    // Update user with creator information
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: creatorName,
        username,
        phone,
        location,
        profileImage,
        bio,
        creator: true
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Successfully registered as creator',
      user: updatedUser.getUserInfo()
    });

  } catch (error) {
    console.error('Be a creator error:', error);
    res.status(500).json({ message: 'Server error during creator registration' });
  }
});

module.exports = router; 