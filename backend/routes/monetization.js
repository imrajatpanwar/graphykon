const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Earnings = require('../models/Earnings');
const Asset = require('../models/Asset');
const User = require('../models/User');

// Get creator's monetization overview
router.get('/overview', auth, async (req, res) => {
  try {
    const creatorId = req.user.userId;
    console.log('Fetching monetization data for creator:', creatorId);

    // Validate creatorId
    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
      return res.status(400).json({ message: 'Invalid creator ID' });
    }

    const creatorObjectId = new mongoose.Types.ObjectId(creatorId);

    // Get total earnings
    const totalEarnings = await Earnings.aggregate([
      { $match: { creator: creatorObjectId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get pending earnings
    const pendingEarnings = await Earnings.aggregate([
      { $match: { creator: creatorObjectId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get paid earnings
    const paidEarnings = await Earnings.aggregate([
      { $match: { creator: creatorObjectId, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get earnings by month (last 12 months)
    const monthlyEarnings = await Earnings.aggregate([
      { $match: { creator: creatorObjectId } },
      {
        $group: {
          _id: {
            year: { $year: '$downloadDate' },
            month: { $month: '$downloadDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get top earning assets
    const topEarningAssets = await Earnings.aggregate([
      { $match: { creator: creatorObjectId } },
      {
        $group: {
          _id: '$asset',
          totalEarnings: { $sum: '$amount' },
          downloadCount: { $sum: 1 }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'assets',
          localField: '_id',
          foreignField: '_id',
          as: 'asset'
        }
      },
      { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          assetId: '$_id',
          title: { $ifNull: ['$asset.title', 'Unknown Asset'] },
          totalEarnings: 1,
          downloadCount: 1,
          license: { $ifNull: ['$asset.license', 'Unknown'] }
        }
      }
    ]);

    const result = {
      totalEarnings: totalEarnings[0]?.total || 0,
      pendingEarnings: pendingEarnings[0]?.total || 0,
      paidEarnings: paidEarnings[0]?.total || 0,
      monthlyEarnings: monthlyEarnings || [],
      topEarningAssets: topEarningAssets || []
    };

    console.log('Monetization data result:', result);
    res.json(result);
  } catch (error) {
    console.error('Monetization overview error:', error);
    res.status(500).json({ message: 'Failed to fetch monetization data', error: error.message });
  }
});

// Get earnings history
router.get('/earnings-history', auth, async (req, res) => {
  try {
    const creatorId = req.user.userId;
    const { page = 1, limit = 20, status } = req.query;

    const query = { creator: creatorId };
    if (status) {
      query.status = status;
    }

    const earnings = await Earnings.find(query)
      .populate('asset', 'title coverPage license')
      .sort({ downloadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Earnings.countDocuments(query);

    res.json({
      earnings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch earnings history', error: error.message });
  }
});

// Get earnings by asset
router.get('/asset/:assetId', auth, async (req, res) => {
  try {
    const { assetId } = req.params;
    const creatorId = req.user.userId;

    // Verify the asset belongs to the creator
    const asset = await Asset.findOne({ _id: assetId, creator: creatorId });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const earnings = await Earnings.find({ asset: assetId })
      .sort({ downloadDate: -1 });

    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0);
    const pendingEarnings = earnings
      .filter(earning => earning.status === 'pending')
      .reduce((sum, earning) => sum + earning.amount, 0);

    res.json({
      asset: {
        _id: asset._id,
        title: asset.title,
        license: asset.license,
        downloadCount: asset.downloadCount,
        totalEarnings: asset.totalEarnings
      },
      earnings,
      totalEarnings,
      pendingEarnings,
      totalDownloads: earnings.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch asset earnings', error: error.message });
  }
});

// Get earnings summary for all assets
router.get('/assets-summary', auth, async (req, res) => {
  try {
    const creatorId = req.user.userId;
    console.log('Fetching assets summary for creator:', creatorId);

    // Validate creatorId
    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
      return res.status(400).json({ message: 'Invalid creator ID' });
    }

    const creatorObjectId = new mongoose.Types.ObjectId(creatorId);

    const assetsSummary = await Asset.aggregate([
      { $match: { creator: creatorObjectId } },
      {
        $lookup: {
          from: 'earnings',
          localField: '_id',
          foreignField: 'asset',
          as: 'earnings'
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          license: 1,
          downloadCount: 1,
          totalEarnings: 1,
          coverPage: 1,
          earningsCount: { $size: '$earnings' },
          totalEarned: { $sum: '$earnings.amount' },
          pendingEarnings: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$earnings',
                    cond: { $eq: ['$$this.status', 'pending'] }
                  }
                },
                as: 'earning',
                in: '$$earning.amount'
              }
            }
          }
        }
      },
      { $sort: { totalEarned: -1 } }
    ]);

    console.log('Assets summary result:', assetsSummary);
    res.json(assetsSummary);
  } catch (error) {
    console.error('Assets summary error:', error);
    res.status(500).json({ message: 'Failed to fetch assets summary', error: error.message });
  }
});

// Record a new earning (called when premium asset is downloaded)
router.post('/record-earning', auth, async (req, res) => {
  try {
    const { assetId } = req.body;
    const creatorId = req.user.userId;

    // Verify the asset exists and is premium
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.license !== 'Premium') {
      return res.status(400).json({ message: 'Only premium assets generate earnings' });
    }

    // Create new earning record
    const earning = new Earnings({
      creator: asset.creator,
      asset: assetId,
      amount: 0.90, // 0.90 INR per download
      status: 'pending'
    });

    await earning.save();

    // Update asset's total earnings
    await Asset.findByIdAndUpdate(assetId, {
      $inc: { totalEarnings: 0.90 }
    });

    res.status(201).json(earning);
  } catch (error) {
    res.status(500).json({ message: 'Failed to record earning', error: error.message });
  }
});

// Admin Routes (require admin authentication)
const adminAuth = require('../middleware/adminAuth');

// Get platform-wide monetization overview (admin only)
router.get('/admin/overview', adminAuth, async (req, res) => {
  try {
    console.log('Fetching admin monetization overview');

    // Get platform-wide earnings statistics
    const totalEarnings = await Earnings.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingEarnings = await Earnings.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paidEarnings = await Earnings.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get earnings by month (last 12 months)
    const monthlyEarnings = await Earnings.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$downloadDate' },
            month: { $month: '$downloadDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get top earning creators
    const topEarningCreators = await Earnings.aggregate([
      {
        $group: {
          _id: '$creator',
          totalEarnings: { $sum: '$amount' },
          earningsCount: { $sum: 1 }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          creatorId: '$_id',
          name: { $ifNull: ['$creator.displayName', '$creator.name'] },
          username: '$creator.username',
          totalEarnings: 1,
          earningsCount: 1
        }
      }
    ]);

    // Get premium assets statistics
    const premiumAssetsStats = await Asset.aggregate([
      { $match: { license: 'Premium' } },
      {
        $group: {
          _id: null,
          totalPremiumAssets: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
          totalEarnings: { $sum: '$totalEarnings' }
        }
      }
    ]);

    const result = {
      totalEarnings: totalEarnings[0]?.total || 0,
      pendingEarnings: pendingEarnings[0]?.total || 0,
      paidEarnings: paidEarnings[0]?.total || 0,
      monthlyEarnings: monthlyEarnings || [],
      topEarningCreators: topEarningCreators || [],
      premiumAssetsStats: premiumAssetsStats[0] || {
        totalPremiumAssets: 0,
        totalDownloads: 0,
        totalEarnings: 0
      }
    };

    console.log('Admin monetization overview result:', result);
    res.json(result);
  } catch (error) {
    console.error('Admin monetization overview error:', error);
    res.status(500).json({ message: 'Failed to fetch admin monetization data', error: error.message });
  }
});

// Get all earnings with creator details (admin only)
router.get('/admin/earnings', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, creatorId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (creatorId) query.creator = creatorId;

    const earnings = await Earnings.find(query)
      .populate('creator', 'name displayName username email')
      .populate('asset', 'title license')
      .sort({ downloadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Earnings.countDocuments(query);

    res.json({
      earnings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Admin earnings fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch earnings', error: error.message });
  }
});

// Update earnings status (admin only)
router.put('/admin/earnings/:earningId', adminAuth, async (req, res) => {
  try {
    const { earningId } = req.params;
    const { status, notes, transactionId } = req.body;

    const updateData = { status };
    if (notes) updateData.notes = notes;
    if (transactionId) updateData.transactionId = transactionId;
    if (status === 'paid') updateData.paymentDate = new Date();

    const earning = await Earnings.findByIdAndUpdate(earningId, updateData, { new: true })
      .populate('creator', 'name displayName username email')
      .populate('asset', 'title license');

    if (!earning) {
      return res.status(404).json({ message: 'Earning not found' });
    }

    res.json(earning);
  } catch (error) {
    console.error('Admin earning update error:', error);
    res.status(500).json({ message: 'Failed to update earning', error: error.message });
  }
});

// Get creators with earnings summary (admin only)
router.get('/admin/creators-summary', adminAuth, async (req, res) => {
  try {
    const creatorsSummary = await Earnings.aggregate([
      {
        $group: {
          _id: '$creator',
          totalEarnings: { $sum: '$amount' },
          pendingEarnings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
            }
          },
          paidEarnings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
            }
          },
          earningsCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'assets',
          let: { creatorId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$creator', '$$creatorId'] }, license: 'Premium' } },
            { $group: { _id: null, count: { $sum: 1 } } }
          ],
          as: 'premiumAssets'
        }
      },
      {
        $project: {
          creatorId: '$_id',
          name: { $ifNull: ['$creator.displayName', '$creator.name'] },
          username: '$creator.username',
          email: '$creator.email',
          totalEarnings: 1,
          pendingEarnings: 1,
          paidEarnings: 1,
          earningsCount: 1,
          premiumAssetsCount: { $ifNull: [{ $arrayElemAt: ['$premiumAssets.count', 0] }, 0] }
        }
      },
      { $sort: { totalEarnings: -1 } }
    ]);

    res.json(creatorsSummary);
  } catch (error) {
    console.error('Admin creators summary error:', error);
    res.status(500).json({ message: 'Failed to fetch creators summary', error: error.message });
  }
});

module.exports = router; 