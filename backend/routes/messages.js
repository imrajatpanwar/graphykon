const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for message attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/message-attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'attachment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Apply auth middleware to all routes
router.use(auth);

// Get all conversations for current user
router.get('/conversations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const conversations = await Message.getConversations(req.user.userId, page, limit);
    
    res.json({
      conversations,
      currentPage: page,
      hasMore: conversations.length === limit
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    // Verify user is part of this conversation
    const [userId1, userId2] = conversationId.split('_');
    if (req.user.userId !== userId1 && req.user.userId !== userId2) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    const messages = await Message.getConversationMessages(conversationId, page, limit);
    
    // Mark messages as read for the current user
    await Message.markAsRead(conversationId, req.user.userId);
    
    res.json({
      messages,
      currentPage: page,
      hasMore: messages.length === limit
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a new message
router.post('/send', async (req, res) => {
  try {
    console.log('=== MESSAGE SEND REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);
    console.log('Request headers:', req.headers);
    
    const { receiverId, content, messageType = 'text' } = req.body;
    
    console.log('Extracted data:', { receiverId, content, messageType });
    
    if (!receiverId || !content) {
      console.log('Missing required fields:', { receiverId: !!receiverId, content: !!content });
      return res.status(400).json({ message: 'Receiver and content are required' });
    }
    
    if (!req.user || !req.user.userId) {
      console.log('User not authenticated:', req.user);
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Check if receiver exists
    console.log('Looking for receiver with ID:', receiverId);
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      console.log('Receiver not found in database');
      return res.status(404).json({ message: 'Receiver not found' });
    }
    console.log('Receiver found:', receiver.name);
    
    // Check if user is trying to message themselves
    if (req.user.userId === receiverId) {
      console.log('User trying to message themselves');
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }
    
    // Generate conversation ID
    const conversationId = Message.generateConversationId(req.user.userId, receiverId);
    console.log('Generated conversation ID:', conversationId);
    
    // Create message
    const message = new Message({
      sender: req.user.userId,
      receiver: receiverId,
      content,
      conversationId,
      messageType
    });
    
    console.log('Created message object:', message);
    
    await message.save();
    console.log('Message saved to database');
    
    // Populate sender and receiver info
    await message.populate('sender', 'name displayName username profileImage verificationType');
    await message.populate('receiver', 'name displayName username profileImage verificationType');
    console.log('Message populated with user info');
    
    // Emit real-time message to receiver
    const io = req.app.get('io');
    if (io) {
      io.emit('new-message', {
        message,
        conversationId,
        receiverId
      });
      console.log('Message emitted via socket');
    } else {
      console.log('Socket.IO not available');
    }
    
    console.log('Sending success response');
    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('=== MESSAGE SEND ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message with attachment
router.post('/send-with-attachment', upload.single('attachment'), async (req, res) => {
  try {
    const { receiverId, content, messageType = 'file' } = req.body;
    
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver is required' });
    }
    
    if (!req.file && !content) {
      return res.status(400).json({ message: 'Either content or attachment is required' });
    }
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    // Check if user is trying to message themselves
    if (req.user.userId === receiverId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }
    
    // Generate conversation ID
    const conversationId = Message.generateConversationId(req.user.userId, receiverId);
    
    // Prepare attachment data
    const attachments = [];
    if (req.file) {
      attachments.push({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/message-attachments/${req.file.filename}`
      });
    }
    
    // Create message
    const message = new Message({
      sender: req.user.userId,
      receiver: receiverId,
      content: content || `Sent an attachment: ${req.file?.originalname || 'file'}`,
      conversationId,
      messageType,
      attachments
    });
    
    await message.save();
    
    // Populate sender and receiver info
    await message.populate('sender', 'name displayName username profileImage verificationType');
    await message.populate('receiver', 'name displayName username profileImage verificationType');
    
    // Emit real-time message to receiver
    const io = req.app.get('io');
    if (io) {
      io.emit('new-message', {
        message,
        conversationId,
        receiverId
      });
    }
    
    res.status(201).json({
      message: 'Message with attachment sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark conversation as read
router.put('/conversations/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Verify user is part of this conversation
    const [userId1, userId2] = conversationId.split('_');
    if (req.user.userId !== userId1 && req.user.userId !== userId2) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    const result = await Message.markAsRead(conversationId, req.user.userId);
    
    res.json({
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread message count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.userId);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the sender
    if (message.sender.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Can only delete your own messages' });
    }
    
    await message.softDelete(req.user.userId);
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Report a message
router.post('/messages/:messageId/report', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Report reason is required' });
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is part of this conversation
    const [userId1, userId2] = message.conversationId.split('_');
    if (req.user.userId !== userId1 && req.user.userId !== userId2) {
      return res.status(403).json({ message: 'Can only report messages in your conversations' });
    }
    
    await message.report(req.user.userId, reason);
    
    res.json({ message: 'Message reported successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search users for messaging
router.get('/search-users', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    const users = await User.find({
      _id: { $ne: req.user.userId }, // Exclude current user
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name displayName username profileImage verificationType isCreator')
    .limit(10);
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start a new conversation
router.post('/conversations/start', async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is trying to message themselves
    if (req.user.userId === receiverId) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }
    
    // Generate conversation ID
    const conversationId = Message.generateConversationId(req.user.userId, receiverId);
    
    // Check if conversation already exists
    const existingMessage = await Message.findOne({ conversationId });
    
    if (existingMessage) {
      return res.json({
        message: 'Conversation already exists',
        conversationId,
        exists: true
      });
    }
    
    res.json({
      message: 'Conversation ready to start',
      conversationId,
      exists: false,
      receiver: {
        _id: receiver._id,
        name: receiver.name,
        displayName: receiver.displayName,
        username: receiver.username,
        profileImage: receiver.profileImage,
        verificationType: receiver.verificationType,
        isCreator: receiver.isCreator
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 