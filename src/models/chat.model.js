const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkerProfile',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    content: String,
    timestamp: Date,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for faster queries and constraints
chatSchema.index({ booking: 1 }, { unique: true });  // Ensure one chat per booking
chatSchema.index({ worker: 1, status: 1 });          // For worker's chat list queries
chatSchema.index({ customer: 1, status: 1 });        // For customer's chat list queries

module.exports = mongoose.model('Chat', chatSchema);
