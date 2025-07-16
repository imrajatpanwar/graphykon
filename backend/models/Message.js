const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Admin moderation fields
  isReported: {
    type: Boolean,
    default: false
  },
  reportedAt: {
    type: Date,
    default: null
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reportReason: {
    type: String,
    default: null
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderatedAt: {
    type: Date,
    default: null
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderationAction: {
    type: String,
    enum: ['approved', 'hidden', 'deleted']
  },
  moderationReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Create compound index for efficient conversation queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });

// Static method to generate conversation ID
messageSchema.statics.generateConversationId = function(userId1, userId2) {
  // Sort IDs to ensure consistent conversation ID regardless of order
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return sortedIds.join('_');
};

// Static method to get conversations for a user
messageSchema.statics.getConversations = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) }
        ],
        isDeleted: false
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.sender',
        foreignField: '_id',
        as: 'senderInfo'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.receiver',
        foreignField: '_id',
        as: 'receiverInfo'
      }
    },
    {
      $addFields: {
        otherUser: {
          $cond: [
            { $eq: ['$lastMessage.sender', new mongoose.Types.ObjectId(userId)] },
            { $arrayElemAt: ['$receiverInfo', 0] },
            { $arrayElemAt: ['$senderInfo', 0] }
          ]
        }
      }
    },
    {
      $project: {
        conversationId: '$_id',
        lastMessage: {
          _id: '$lastMessage._id',
          content: '$lastMessage.content',
          messageType: '$lastMessage.messageType',
          createdAt: '$lastMessage.createdAt',
          sender: '$lastMessage.sender',
          receiver: '$lastMessage.receiver',
          isRead: '$lastMessage.isRead'
        },
        unreadCount: 1,
        otherUser: {
          _id: '$otherUser._id',
          name: '$otherUser.name',
          displayName: '$otherUser.displayName',
          username: '$otherUser.username',
          profileImage: '$otherUser.profileImage',
          verificationType: '$otherUser.verificationType',
          isCreator: '$otherUser.isCreator'
        }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ]);

  return conversations;
};

// Static method to get conversation messages
messageSchema.statics.getConversationMessages = async function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({
    conversationId: conversationId,
    isDeleted: false,
    isModerated: { $ne: true }
  })
  .populate('sender', 'name displayName username profileImage verificationType')
  .populate('receiver', 'name displayName username profileImage verificationType')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

  return messages.reverse(); // Return in chronological order
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function(conversationId, userId) {
  const result = await this.updateMany(
    {
      conversationId: conversationId,
      receiver: userId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
  return result;
};

// Static method to get unread count for a user
messageSchema.statics.getUnreadCount = async function(userId) {
  const count = await this.countDocuments({
    receiver: userId,
    isRead: false,
    isDeleted: false
  });
  return count;
};

// Instance method to soft delete message
messageSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Instance method to report message
messageSchema.methods.report = function(reportedBy, reason) {
  this.isReported = true;
  this.reportedAt = new Date();
  this.reportedBy = reportedBy;
  this.reportReason = reason;
  return this.save();
};

// Instance method to moderate message
messageSchema.methods.moderate = function(moderatedBy, action, reason) {
  this.isModerated = true;
  this.moderatedAt = new Date();
  this.moderatedBy = moderatedBy;
  this.moderationAction = action;
  this.moderationReason = reason;
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema); 