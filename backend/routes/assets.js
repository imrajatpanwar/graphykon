const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const User = require('../models/User');
const Earnings = require('../models/Earnings');
const Download = require('../models/Download');
const auth = require('../middleware/auth');

// Search assets by title, creator username, or creator display name
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json([]);
    }

    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive search

    // Find users that match the search term (username or display name)
    const matchingUsers = await User.find({
      $or: [
        { username: searchRegex },
        { displayName: searchRegex }
      ]
    }).select('_id');

    const userIds = matchingUsers.map(user => user._id);

    // Search assets by title or creator, EXCLUDE copyright-struck assets
    const assets = await Asset.find({
      $and: [
        {
          $or: [
            { title: searchRegex }, // Search by asset title
            { creator: { $in: userIds } }, // Search by creator
            { keywords: searchRegex }, // Search by keywords
            { description: searchRegex } // Search by description
          ]
        },
        { 'copyrightStrike.isStruck': { $ne: true } }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('creator', 'displayName username profileImage')
    .limit(20); // Limit results for performance

    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// Get all assets (public)
router.get('/assets', async (req, res) => {
  try {
    const assets = await Asset.find({ 'copyrightStrike.isStruck': { $ne: true } })
      .sort({ createdAt: -1 })
      .populate('creator', 'displayName username profileImage');
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load assets', error: error.message });
  }
});

// Get single asset by ID (public)
router.get('/assets/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('creator', 'displayName username profileImage bio followers');
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load asset', error: error.message });
  }
});

// Increment view count for an asset
router.post('/assets/:id/view', async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json({ viewCount: asset.viewCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update view count', error: error.message });
  }
});

// Increment download count for an asset (with optional authentication and unique download tracking)
router.post('/assets/:id/download', auth.optionalAuth, async (req, res) => {
  try {
    const assetId = req.params.id;
    const userId = req.user?.id || req.user?.userId;
    
    // Get user IP and user agent for tracking
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Find the asset
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    let existingDownload = null;
    
    if (userId) {
      // For authenticated users, check by user ID
      existingDownload = await Download.findOne({
        user: userId,
        asset: assetId
      });
    } else {
      // For anonymous users, check by IP address (less reliable but better than nothing)
      existingDownload = await Download.findOne({
        asset: assetId,
        ipAddress: ipAddress,
        user: { $exists: false }
      });
    }
    
    if (existingDownload) {
      // User/IP has already downloaded this asset, return current count without incrementing
      return res.json({ 
        downloadCount: asset.downloadCount,
        alreadyDownloaded: true,
        message: userId ? 'You have already downloaded this asset' : 'This asset has already been downloaded from this location'
      });
    }
    
    // Create new download record
    const downloadData = {
      asset: assetId,
      ipAddress,
      userAgent
    };
    
    if (userId) {
      downloadData.user = userId;
    }
    
    const download = new Download(downloadData);
    
    try {
      await download.save();
    } catch (downloadError) {
      // Handle duplicate key error (race condition)
      if (downloadError.code === 11000) {
        return res.json({ 
          downloadCount: asset.downloadCount,
          alreadyDownloaded: true,
          message: userId ? 'You have already downloaded this asset' : 'This asset has already been downloaded from this location'
        });
      }
      throw downloadError;
    }
    
    // Increment download count since this is a new download
    const updatedAsset = await Asset.findByIdAndUpdate(
      assetId,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    
    // If it's a premium asset and user is authenticated, record earnings for the creator
    if (asset.license === 'Premium' && userId) {
      try {
        const earning = new Earnings({
          creator: asset.creator,
          asset: asset._id,
          downloader: userId,
          amount: 0.90, // 0.90 INR per download
          status: 'pending'
        });
        
        await earning.save();
        
        // Update asset's total earnings
        await Asset.findByIdAndUpdate(asset._id, {
          $inc: { totalEarnings: 0.90 }
        });
      } catch (earningError) {
        console.error('Failed to record earning:', earningError);
        // Don't fail the download if earning recording fails
        // But log the error for debugging
      }
    }
    
    res.json({ 
      downloadCount: updatedAsset.downloadCount,
      alreadyDownloaded: false,
      message: 'Asset downloaded successfully',
      earningsRecorded: asset.license === 'Premium' && userId
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Failed to update download count', error: error.message });
  }
});

module.exports = router; 