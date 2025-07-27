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

    // Process profile image if provided
    if (profileImage) {
      try {
        console.log('Processing base64 profile image...');
        
        // Remove data URL prefix to get base64 data
        const base64Data = profileImage.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Validate buffer
        if (buffer.length === 0) {
          throw new Error('Empty image data');
        }
        
        // Get image metadata
        console.log('Getting base64 image metadata...');
        const metadata = await sharp(buffer).metadata();
        const { width, height, format } = metadata;
        
        console.log(`Original base64 image: ${width}x${height}, format: ${format}`);

        // Validate dimensions
        if (width < 10 || height < 10) {
          throw new Error('Image too small to process');
        }

        // Calculate crop dimensions for square format
        const size = Math.min(width, height);
        const left = Math.floor((width - size) / 2);
        const top = Math.floor((height - size) / 2);

        console.log(`Cropping base64 image to square: ${size}x${size} from position (${left}, ${top})`);

        // Process image: crop to square, resize to 512x512, compress
        // Try with different approaches if the first one fails
        let processedBuffer;
        try {
          processedBuffer = await sharp(buffer)
            .crop(size, size, left, top) // Crop to square
            .resize(512, 512) // Resize to 512x512
            .jpeg({ 
              quality: 80, // Compress with 80% quality
              progressive: true 
            })
            .toBuffer();
        } catch (processingError) {
          console.log('First base64 processing attempt failed, trying alternative approach...');
          
          // Fallback: try without progressive JPEG
          processedBuffer = await sharp(buffer)
            .crop(size, size, left, top) // Crop to square
            .resize(512, 512) // Resize to 512x512
            .jpeg({ 
              quality: 80 // Compress with 80% quality
            })
            .toBuffer();
        }

        // Convert back to base64
        const processedBase64 = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
        
        // Update the profileImage with processed version
        req.body.profileImage = processedBase64;

        console.log('Base64 profile image processed successfully: cropped to square, resized to 512x512, compressed');
      } catch (error) {
        console.error('Base64 image processing error details:', error);
        console.error('Error stack:', error.stack);
        return res.status(400).json({ 
          message: 'Error processing image. Please try again with a valid image file.',
          details: error.message
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