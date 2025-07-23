const express = require('express');
const { body, validationResult } = require('express-validator');
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

    // Check if username is available
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'Username is already taken' });
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