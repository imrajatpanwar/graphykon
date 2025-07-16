const express = require('express');
const router = express.Router();
const PricingPlan = require('../models/PricingPlan');
const adminAuth = require('../middleware/adminAuth');

// Get all pricing plans (public route)
router.get('/plans', async (req, res) => {
  try {
    const plans = await PricingPlan.find({ isActive: true }).sort({ order: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pricing plans', error: error.message });
  }
});

// Get all pricing plans for admin (includes inactive)
router.get('/admin/plans', adminAuth, async (req, res) => {
  try {
    const plans = await PricingPlan.find().sort({ order: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pricing plans', error: error.message });
  }
});

// Create a new pricing plan (admin only)
router.post('/admin/plans', adminAuth, async (req, res) => {
  try {
    const plan = new PricingPlan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create pricing plan', error: error.message });
  }
});

// Update a pricing plan (admin only)
router.put('/admin/plans/:id', adminAuth, async (req, res) => {
  try {
    const plan = await PricingPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!plan) {
      return res.status(404).json({ message: 'Pricing plan not found' });
    }
    
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update pricing plan', error: error.message });
  }
});

// Delete a pricing plan (admin only)
router.delete('/admin/plans/:id', adminAuth, async (req, res) => {
  try {
    const plan = await PricingPlan.findByIdAndDelete(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Pricing plan not found' });
    }
    
    res.json({ message: 'Pricing plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete pricing plan', error: error.message });
  }
});

// Initialize default pricing plans (admin only)
router.post('/admin/initialize', adminAuth, async (req, res) => {
  try {
    // Check if plans already exist
    const existingPlans = await PricingPlan.countDocuments();
    if (existingPlans > 0) {
      return res.status(400).json({ message: 'Pricing plans already exist' });
    }

    const defaultPlans = [
      {
        name: 'basic',
        displayName: 'Basic',
        description: 'Perfect for getting started',
        price: 0,
        currency: '$',
        period: '/month',
        features: [
          { text: 'Limited Downloads (10/month)', included: true },
          { text: 'Standard Quality Assets', included: true },
          { text: 'Watermark on Downloads', included: false },
          { text: 'Limited Community Access', included: true },
          { text: 'No Custom Requests', included: false },
          { text: 'No Early Access', included: false },
          { text: 'No Portfolio Builder', included: false },
          { text: '20 Saved Favorites', included: true },
          { text: 'Ads Included', included: false },
          { text: 'Basic Asset Tagging', included: true }
        ],
        isPopular: false,
        order: 1,
        buttonText: 'Current Plan',
        buttonVariant: 'outline-primary',
        headerStyle: {
          backgroundColor: '#f8f9fa',
          textColor: '#000000'
        },
        borderStyle: 'light'
      },
      {
        name: 'premium',
        displayName: 'Premium',
        description: 'For serious creators',
        price: 9,
        currency: '$',
        period: '/month',
        features: [
          { text: 'Unlimited Downloads', included: true },
          { text: 'HD Quality Assets', included: true },
          { text: 'Watermark-Free Downloads', included: true },
          { text: 'Full Community Access', included: true },
          { text: 'No Custom Requests', included: false },
          { text: 'Early Access to Features', included: true },
          { text: 'Basic Portfolio Templates', included: true },
          { text: '200 Saved Favorites', included: true },
          { text: 'Ad-Free Experience', included: true },
          { text: 'Advanced Auto-Tagging', included: true }
        ],
        isPopular: true,
        order: 2,
        buttonText: 'Upgrade to Premium',
        buttonVariant: 'primary',
        headerStyle: {
          backgroundColor: '#007bff',
          textColor: '#ffffff'
        },
        borderStyle: 'primary'
      },
      {
        name: 'pro',
        displayName: 'Pro',
        description: 'For professional creators',
        price: 19,
        currency: '$',
        period: '/month',
        features: [
          { text: 'Unlimited Downloads', included: true },
          { text: 'HD + Exclusive Pro Assets', included: true },
          { text: 'Watermark-Free Downloads', included: true },
          { text: 'Full + Private Groups', included: true },
          { text: 'Custom Asset Requests', included: true },
          { text: 'Early Access + Beta Tools', included: true },
          { text: 'Advanced Templates + AI Copy', included: true },
          { text: 'Unlimited Collections', included: true },
          { text: 'Ad-Free + Dark Mode', included: true },
          { text: 'Pro Monthly Packs', included: true },
          { text: 'Advanced + Auto SEO Tools', included: true }
        ],
        isPopular: false,
        order: 3,
        buttonText: 'Upgrade to Pro',
        buttonVariant: 'warning',
        headerStyle: {
          backgroundColor: '#ffc107',
          textColor: '#000000'
        },
        borderStyle: 'warning'
      }
    ];

    const plans = await PricingPlan.insertMany(defaultPlans);
    res.status(201).json({ message: 'Default pricing plans initialized', plans });
  } catch (error) {
    res.status(500).json({ message: 'Failed to initialize pricing plans', error: error.message });
  }
});

module.exports = router; 