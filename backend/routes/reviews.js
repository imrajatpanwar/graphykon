const express = require('express');
const Review = require('../models/Review');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  console.log('Reviews test endpoint hit');
  res.json({ message: 'Reviews route is working' });
});

// Get all reviews for a creator by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find the creator by username
    const creator = await User.findOne({ username });
    if (!creator) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Get all reviews for this creator, populated with reviewer details
    const reviews = await Review.find({ creator: creator._id })
      .populate('reviewer', 'username displayName profileImage')
      .sort({ createdAt: -1 }); // Most recent first

    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// Create a new review
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating review - Request body:', req.body);
    console.log('Creating review - User:', req.user);
    
    const { creatorUsername, rating, reviewText } = req.body;
    const reviewerId = req.user.id;

    console.log('Parsed data:', { creatorUsername, rating, reviewText, reviewerId });

    // Validation
    if (!creatorUsername || !rating || !reviewText) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (reviewText.length > 500) {
      return res.status(400).json({ message: 'Review text must be less than 500 characters' });
    }

    // Find the creator
    console.log('Looking for creator with username:', creatorUsername);
    const creator = await User.findOne({ username: creatorUsername });
    if (!creator) {
      console.log('Creator not found');
      return res.status(404).json({ message: 'Creator not found' });
    }
    console.log('Creator found:', creator._id);

    // Check if user is trying to review themselves
    if (creator._id.toString() === reviewerId) {
      console.log('User trying to review themselves');
      return res.status(400).json({ message: 'You cannot review your own profile' });
    }

    // Check if user has already reviewed this creator
    console.log('Checking for existing review...');
    const existingReview = await Review.findOne({ 
      reviewer: reviewerId, 
      creator: creator._id 
    });

    if (existingReview) {
      console.log('User has already reviewed this creator');
      return res.status(400).json({ message: 'You have already reviewed this creator' });
    }

    // Create the review
    console.log('Creating new review...');
    const review = new Review({
      reviewer: reviewerId,
      creator: creator._id,
      rating,
      reviewText: reviewText.trim()
    });

    console.log('Saving review to database...');
    await review.save();
    console.log('Review saved successfully');

    // Populate the review with reviewer details for the response
    await review.populate('reviewer', 'username displayName profileImage');

    res.status(201).json({ 
      message: 'Review created successfully', 
      review 
    });
  } catch (error) {
    console.error('Error creating review:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle duplicate key error (shouldn't happen due to pre-check, but just in case)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this creator' });
    }
    
    res.status(500).json({ message: 'Failed to create review' });
  }
});

// Update a review (optional - allows users to edit their reviews)
router.put('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user.id;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the user owns this review
    if (review.reviewer.toString() !== userId) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    // Validation
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (reviewText !== undefined && reviewText.length > 500) {
      return res.status(400).json({ message: 'Review text must be less than 500 characters' });
    }

    // Update the review
    if (rating !== undefined) review.rating = rating;
    if (reviewText !== undefined) review.reviewText = reviewText.trim();

    await review.save();
    await review.populate('reviewer', 'username displayName profileImage');

    res.json({ 
      message: 'Review updated successfully', 
      review 
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the user owns this review
    if (review.reviewer.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

module.exports = router; 