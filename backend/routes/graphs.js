const express = require('express');
const router = express.Router();
const Graph = require('../models/Graph');
const auth = require('../middleware/auth');

// Get all graphs (public or owned by user)
router.get('/', auth, async (req, res) => {
  try {
    const graphs = await Graph.find({
      $or: [
        { isPublic: true },
        { createdBy: req.user.userId }
      ]
    }).populate('createdBy', 'username');
    res.json(graphs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single graph
router.get('/:id', auth, async (req, res) => {
  try {
    const graph = await Graph.findById(req.params.id).populate('createdBy', 'username');
    if (!graph) {
      return res.status(404).json({ message: 'Graph not found' });
    }
    
    // Check if user has access
    if (!graph.isPublic && graph.createdBy._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(graph);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new graph
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, nodes, edges, isPublic } = req.body;
    
    const graph = new Graph({
      title,
      description,
      nodes,
      edges,
      isPublic,
      createdBy: req.user.userId
    });

    await graph.save();
    res.status(201).json(graph);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update graph
router.put('/:id', auth, async (req, res) => {
  try {
    const graph = await Graph.findById(req.params.id);
    if (!graph) {
      return res.status(404).json({ message: 'Graph not found' });
    }

    // Check ownership
    if (graph.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, nodes, edges, isPublic } = req.body;
    
    graph.title = title || graph.title;
    graph.description = description || graph.description;
    graph.nodes = nodes || graph.nodes;
    graph.edges = edges || graph.edges;
    graph.isPublic = isPublic !== undefined ? isPublic : graph.isPublic;

    await graph.save();
    res.json(graph);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete graph
router.delete('/:id', auth, async (req, res) => {
  try {
    const graph = await Graph.findById(req.params.id);
    if (!graph) {
      return res.status(404).json({ message: 'Graph not found' });
    }

    // Check ownership
    if (graph.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await graph.remove();
    res.json({ message: 'Graph deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 