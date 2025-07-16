const express = require('express');
const router = express.Router();
const User = require('../models/User');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');
const Asset = require('../models/Asset');

// Check username availability
router.post('/check-username', auth, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Find user with the requested username
    const existingUser = await User.findOne({ username });
    
    // If no user found with this username, it's available
    // If the user found is the current user, it's also considered available
    const isAvailable = !existingUser || existingUser._id.toString() === req.user.userId;
    
    res.json({ available: isAvailable });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get creator profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update creator profile
router.put('/profile', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const { displayName, username, location, phoneNumber, bio } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    // Update user fields
    if (displayName) user.displayName = displayName;
    if (username) user.username = username;
    if (location) user.location = location;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio !== undefined) user.bio = bio; // Allow empty bio
    user.isCreator = true;

    // Handle profile image upload
    if (req.file) {
      // Delete old profile image if it exists
      if (user.profileImage) {
        const oldImagePath = path.join(__dirname, '..', user.profileImage);
        try {
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.error('Error deleting old profile image:', error);
        }
      }

      // Update profile image path
      user.profileImage = req.file.path.replace(/\\/g, '/');
    }

    await user.save();

    // Return updated user data (excluding password)
    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update creator cover image
router.put('/profile/cover-image', auth, upload.single('userCoverImage'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle cover image upload
    if (req.file) {
      // Delete old cover image if it exists
      if (user.coverImage) {
        const oldImagePath = path.join(__dirname, '..', user.coverImage);
        try {
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.error('Error deleting old cover image:', error);
        }
      }

      // Update cover image path
      user.coverImage = req.file.path.replace(/\\/g, '/');
    } else {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    await user.save();

    // Return updated user data (excluding password)
    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all assets uploaded by the current creator
router.get('/assets', auth, async (req, res) => {
  try {
    const assets = await Asset.find({ creator: req.user.userId }).sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load uploads', error: error.message });
  }
});

// Get copyright strikes for the current creator
router.get('/copyright-strikes', auth, async (req, res) => {
  try {
    const assets = await Asset.find({ 
      creator: req.user.userId,
      'copyrightStrike.isStruck': true 
    }).populate('copyrightStrike.adminId', 'name email').sort({ 'copyrightStrike.struckAt': -1 });
    
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load copyright strikes', error: error.message });
  }
});

// Submit copyright appeal
router.post('/assets/:id/appeal', auth, async (req, res) => {
  try {
    const { appealReason } = req.body;
    
    if (!appealReason || appealReason.trim() === '') {
      return res.status(400).json({ message: 'Appeal reason is required' });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check if the asset belongs to the current user
    if (asset.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only appeal for your own assets' });
    }

    // Check if the asset has a copyright strike
    if (!asset.copyrightStrike.isStruck) {
      return res.status(400).json({ message: 'This asset does not have a copyright strike' });
    }

    // Check if already appealed
    if (asset.copyrightStrike.appeal.isAppealed) {
      return res.status(400).json({ message: 'This asset has already been appealed' });
    }

    // Submit appeal
    asset.copyrightStrike.appeal = {
      isAppealed: true,
      appealReason: appealReason.trim(),
      appealedAt: new Date(),
      status: 'pending',
      adminResponse: '',
      respondedAt: null
    };

    await asset.save();

    res.json({ message: 'Appeal submitted successfully', asset });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit appeal', error: error.message });
  }
});

// Upload asset
router.post(
  '/upload-asset',
  auth,
  upload.fields([
    { name: 'coverPage', maxCount: 1 },
    { name: 'assetFile', maxCount: 1 },
    { name: 'showcaseImages', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const { title, category, description, keywords, license, format, fileSize, creditRequired, creditText } = req.body;
      const coverPage = req.files['coverPage'] ? req.files['coverPage'][0].path.replace(/\\/g, '/') : '';
      const assetFile = req.files['assetFile'] ? req.files['assetFile'][0].path.replace(/\\/g, '/') : '';
      
      // Handle multiple showcase images
      const showcaseImages = req.files['showcaseImages'] ? 
        req.files['showcaseImages'].map(file => file.path.replace(/\\/g, '/')) : [];

      // Parse format array from string
      const formatArray = format ? JSON.parse(format) : [];

      const asset = new Asset({
        creator: req.user.userId,
        title,
        category: category || 'Other',
        coverPage,
        showcaseImages,
        description,
        keywords,
        assetFile,
        fileSize: fileSize || 'Unknown',
        license,
        format: formatArray,
        creditRequired: creditRequired === 'true',
        creditText: creditText || '',
        dimension: {
          width: 6000,
          height: 4000
        }
      });

      await asset.save();
      res.status(201).json(asset);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload asset', error: error.message });
    }
  }
);

// Update asset
router.put('/assets/:id', auth, upload.fields([
  { name: 'coverPage', maxCount: 1 },
  { name: 'assetFile', maxCount: 1 },
  { name: 'showcaseImages', maxCount: 10 }
]), async (req, res) => {
  try {
    const { title, category, description, keywords, license, format, fileSize, creditRequired, creditText, dimension } = req.body;
    const asset = await Asset.findOne({ _id: req.params.id, creator: req.user.userId });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found or you do not have permission to edit it' });
    }

    // Store old file paths for potential cleanup
    const oldCoverPage = asset.coverPage;
    const oldAssetFile = asset.assetFile;
    const oldShowcaseImages = [...asset.showcaseImages];

    // Update basic fields
    if (title) asset.title = title;
    if (category) asset.category = category;
    if (description) asset.description = description;
    if (keywords !== undefined) asset.keywords = keywords;
    if (license) asset.license = license;
    if (creditRequired !== undefined) asset.creditRequired = creditRequired === 'true';
    if (creditText !== undefined) asset.creditText = creditText;

    // Update format array
    if (format) {
      const formatArray = typeof format === 'string' ? JSON.parse(format) : format;
      asset.format = formatArray;
    }

    // Update dimensions
    if (dimension) {
      const dimensionObj = typeof dimension === 'string' ? JSON.parse(dimension) : dimension;
      if (dimensionObj.width) asset.dimension.width = dimensionObj.width;
      if (dimensionObj.height) asset.dimension.height = dimensionObj.height;
    }

    // Handle file updates
    if (req.files) {
      // Update cover page
      if (req.files['coverPage']) {
        // Delete old cover page
        if (oldCoverPage) {
          const oldCoverPagePath = path.join(__dirname, '..', oldCoverPage);
          try {
            await fs.unlink(oldCoverPagePath);
          } catch (error) {
            console.error('Error deleting old cover page:', error);
          }
        }
        asset.coverPage = req.files['coverPage'][0].path.replace(/\\/g, '/');
      }

      // Update asset file
      if (req.files['assetFile']) {
        // Delete old asset file
        if (oldAssetFile) {
          const oldAssetFilePath = path.join(__dirname, '..', oldAssetFile);
          try {
            await fs.unlink(oldAssetFilePath);
          } catch (error) {
            console.error('Error deleting old asset file:', error);
          }
        }
        asset.assetFile = req.files['assetFile'][0].path.replace(/\\/g, '/');
        
        // Update file size if new file is uploaded
        if (fileSize) asset.fileSize = fileSize;
      }

      // Update showcase images
      if (req.files['showcaseImages']) {
        // Delete old showcase images
        for (const oldShowcaseImage of oldShowcaseImages) {
          const oldShowcaseImagePath = path.join(__dirname, '..', oldShowcaseImage);
          try {
            await fs.unlink(oldShowcaseImagePath);
          } catch (error) {
            console.error('Error deleting old showcase image:', error);
          }
        }
        
        // Set new showcase images
        asset.showcaseImages = req.files['showcaseImages'].map(file => file.path.replace(/\\/g, '/'));
      }
    }

    await asset.save();
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update asset', error: error.message });
  }
});

// Delete asset
router.delete('/assets/:id', auth, async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, creator: req.user.userId });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found or you do not have permission to delete it' });
    }

    // Delete associated files
    if (asset.coverPage) {
      const coverPagePath = path.join(__dirname, '..', asset.coverPage);
      try {
        await fs.unlink(coverPagePath);
      } catch (error) {
        console.error('Error deleting cover page:', error);
      }
    }

    if (asset.assetFile) {
      const assetFilePath = path.join(__dirname, '..', asset.assetFile);
      try {
        await fs.unlink(assetFilePath);
      } catch (error) {
        console.error('Error deleting asset file:', error);
      }
    }

    // Delete showcase images
    if (asset.showcaseImages && asset.showcaseImages.length > 0) {
      for (const showcaseImage of asset.showcaseImages) {
        const showcaseImagePath = path.join(__dirname, '..', showcaseImage);
        try {
          await fs.unlink(showcaseImagePath);
        } catch (error) {
          console.error('Error deleting showcase image:', error);
        }
      }
    }

    await Asset.findByIdAndDelete(req.params.id);
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete asset', error: error.message });
  }
});

// Get public creator profile by username
router.get('/public/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find creator by username
    const creator = await User.findOne({ username, isCreator: true }).select('-password -email -phoneNumber');
    
    if (!creator) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Get creator's public assets, EXCLUDE copyright-struck assets
    const assets = await Asset.find({ creator: creator._id, 'copyrightStrike.isStruck': { $ne: true } }).sort({ createdAt: -1 });
    
    // Return creator info and their assets
    res.json({
      creator,
      assets,
      stats: {
        totalAssets: assets.length,
        totalViews: assets.reduce((sum, asset) => sum + asset.viewCount, 0),
        totalDownloads: assets.reduce((sum, asset) => sum + asset.downloadCount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Follow a creator
router.post('/follow/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.userId;
    
    // Find the creator to follow
    const creatorToFollow = await User.findOne({ username, isCreator: true });
    
    if (!creatorToFollow) {
      return res.status(404).json({ message: 'Creator not found' });
    }
    
    // Check if user is trying to follow themselves
    if (creatorToFollow._id.toString() === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    
    // Check if already following
    if (creatorToFollow.followers.includes(currentUserId)) {
      return res.status(400).json({ message: 'You are already following this creator' });
    }
    
    // Add current user to creator's followers
    creatorToFollow.followers.push(currentUserId);
    await creatorToFollow.save();
    
    // Add creator to current user's following list
    const currentUser = await User.findById(currentUserId);
    if (!currentUser.following.includes(creatorToFollow._id)) {
      currentUser.following.push(creatorToFollow._id);
      await currentUser.save();
    }
    
    res.json({ message: 'Successfully followed creator' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unfollow a creator
router.post('/unfollow/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.userId;
    
    // Find the creator to unfollow
    const creatorToUnfollow = await User.findOne({ username, isCreator: true });
    
    if (!creatorToUnfollow) {
      return res.status(404).json({ message: 'Creator not found' });
    }
    
    // Check if not following
    if (!creatorToUnfollow.followers.includes(currentUserId)) {
      return res.status(400).json({ message: 'You are not following this creator' });
    }
    
    // Remove current user from creator's followers
    creatorToUnfollow.followers = creatorToUnfollow.followers.filter(
      id => id.toString() !== currentUserId
    );
    await creatorToUnfollow.save();
    
    // Remove creator from current user's following list
    const currentUser = await User.findById(currentUserId);
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== creatorToUnfollow._id.toString()
    );
    await currentUser.save();
    
    res.json({ message: 'Successfully unfollowed creator' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 