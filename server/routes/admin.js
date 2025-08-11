const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Asset = require('../models/Asset');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, requireAdmin);

// GET /api/admin/users - list users with pagination and optional search
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const query = {};
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { username: new RegExp(search, 'i') },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users: users.map(u => u.getUserInfo()),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ message: 'Server error while listing users' });
  }
});

// PUT /api/admin/users/:id/role - update user role
router.put('/users/:id/role', [
  body('role').isIn(['user', 'admin']).withMessage('Invalid role'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    if (req.user._id.toString() === req.params.id && req.body.role !== 'admin') {
      return res.status(400).json({ message: 'Admins cannot demote themselves' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, user: updated.getUserInfo() });
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ message: 'Server error while updating role' });
  }
});

// DELETE /api/admin/users/:id - delete a user and their assets
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Admins cannot delete themselves' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete assets owned by user
    await Asset.deleteMany({ creator: user._id });

    // Delete the user
    await User.deleteOne({ _id: user._id });

    res.json({ success: true, message: 'User and assets deleted' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// GET /api/admin/assets - list all assets with filters
router.get('/assets', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, category, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const [assets, total] = await Promise.all([
      Asset.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('creator', 'name username email role'),
      Asset.countDocuments(query),
    ]);

    res.json({
      success: true,
      assets: assets.map(a => a.getAssetInfo()),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Admin list assets error:', error);
    res.status(500).json({ message: 'Server error while listing assets' });
  }
});

// PUT /api/admin/assets/:id - update asset (e.g., status)
router.put('/assets/:id', [
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const updated = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json({ success: true, asset: updated.getAssetInfo() });
  } catch (error) {
    console.error('Admin update asset error:', error);
    res.status(500).json({ message: 'Server error while updating asset' });
  }
});

// DELETE /api/admin/assets/:id - delete asset
router.delete('/assets/:id', async (req, res) => {
  try {
    const deleted = await Asset.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    console.error('Admin delete asset error:', error);
    res.status(500).json({ message: 'Server error while deleting asset' });
  }
});

module.exports = router;


