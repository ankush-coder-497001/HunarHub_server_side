const Chat = require('../models/chat.model');
const Booking = require('../models/booking.model');
const User = require('../models/user.model');
const WorkerProfile = require('../models/worker.model');
const mongoose = require('mongoose');

const chatController = {
  // Initialize or get chat for a booking
  initializeChat: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        console.error('No user ID found in request');
        return res.status(401).json({ message: 'User not authenticated' });
      }

      console.log('Initializing chat:', {
        bookingId,
        userId: userId.toString(),
        userType: req.user?.type
      });

      if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ message: 'Invalid booking ID format' });
      }      // Fetch booking with all required populated fields
      const booking = await Booking.findById(bookingId)
        .populate({
          path: 'worker',
          model: 'WorkerProfile',
          populate: {
            path: 'user',
            model: 'User',
            select: '_id name profileImage type'
          }
        })
        .populate({
          path: 'customer',
          model: 'User',
          select: '_id name profileImage type'
        })
        .select('worker customer status')
        .lean();

      if (!booking) {
        console.error('Booking not found:', bookingId);
        return res.status(404).json({ message: 'Booking not found' });
      }



      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }


      if (!booking.customer || !booking.customer._id) {
        return res.status(400).json({ message: 'Invalid booking: missing customer details' });
      }      // Verify worker and customer details
      if (!booking.worker || !booking.worker.user || !booking.worker.user._id) {
        console.error('Missing worker details:', booking.worker);
        return res.status(400).json({ message: 'Invalid booking: missing worker details' });
      }

      if (!booking.customer || !booking.customer._id) {
        console.error('Missing customer details:', booking.customer);
        return res.status(400).json({ message: 'Invalid booking: missing customer details' });
      }      // Debug log the complete booking object

      // Convert IDs to strings for comparison with safe checks
      const userIdStr = userId?.toString();
      const customerIdStr = booking?.customer?._id?.toString();
      const workerUserIdStr = booking?.worker?.user?._id?.toString();



      if (!userIdStr || (!customerIdStr && !workerUserIdStr)) {
        console.error('Missing required IDs for comparison');
        return res.status(400).json({ message: 'Invalid user or booking data' });
      }

      // Check access rights
      const isCustomer = customerIdStr && (customerIdStr === userIdStr);
      const isWorker = workerUserIdStr && (workerUserIdStr === userIdStr);

      if (!isCustomer && !isWorker) {
        console.log('Access denied:', {
          userId: userIdStr,
          customerId: customerIdStr,
          workerUserId: workerUserIdStr,
          isCustomer,
          isWorker
        });
        return res.status(403).json({ message: 'Access denied' });
      }


      let chat = await Chat.findOne({ booking: bookingId });

      if (!chat) {
        // Validate required fields for chat creation
        if (!booking.worker._id) {
          return res.status(400).json({ message: 'Invalid booking: missing worker ID' });
        }        // Create new chat with validated data
        try {
          const chatData = {
            booking: mongoose.Types.ObjectId(bookingId),
            worker: booking.worker._id,
            customer: booking.customer._id,
            messages: []
          };


          chat = await Chat.create(chatData);


        } catch (error) {
          console.error('Error creating chat:', error);
          return res.status(500).json({ message: 'Failed to create chat session' });
        }
      }      // Populate necessary details
      chat = await Chat.findById(chat._id).populate([
        {
          path: 'messages.sender',
          select: '_id name profileImage type'
        }
      ]);

      // Format the response
      const formattedResponse = formatChatResponse(chat, booking, userId);

      // Mark unread messages as read for the requesting user
      if (chat.messages && chat.messages.length > 0) {
        await Chat.updateMany(
          {
            _id: chat._id,
            'messages.sender': { $ne: userId },
            'messages.read': false
          },
          { $set: { 'messages.$[elem].read': true } },
          {
            arrayFilters: [{ 'elem.sender': { $ne: userId } }],
            multi: true
          }
        );
      }

      res.status(200).json(formattedResponse);
    } catch (error) {
      console.error('Error initializing chat:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get chat history with pagination
  getChatHistory: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { page = 1, limit = 100 } = req.query;
      const userId = req.user._id;

      // Find or create chat with populated data
      let chat = await Chat.findOne({ booking: bookingId })
        .populate([
          {
            path: 'worker',
            populate: {
              path: 'user',
              select: 'name profileImage'
            }
          },
          {
            path: 'customer',
            select: 'name profileImage'
          },
          {
            path: 'booking',
            select: 'jobCode status serviceDetails.service'
          },
          {
            path: 'messages.sender',
            select: 'name profileImage type'
          }
        ]);

      if (!chat) {
        const booking = await Booking.findById(bookingId)
          .populate('worker')
          .populate('customer');

        if (!booking) {
          return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify user has access to this booking
        const isWorker = booking.worker && booking.worker.user &&
          booking.worker.user.toString() === userId.toString();
        const isCustomer = booking.customer._id.toString() === userId.toString();

        if (!isWorker && !isCustomer) {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Create new chat
        chat = await Chat.create({
          booking: bookingId,
          worker: booking.worker._id,
          customer: booking.customer._id,
          messages: []
        });

        // Populate the newly created chat
        chat = await Chat.findById(chat._id).populate([
          {
            path: 'worker',
            populate: {
              path: 'user',
              select: 'name profileImage'
            }
          },
          {
            path: 'customer',
            select: 'name profileImage'
          },
          {
            path: 'booking',
            select: 'jobCode status serviceDetails.service'
          },
          {
            path: 'messages.sender',
            select: 'name profileImage type'
          }
        ]);
      } else {
        // Verify user has access to existing chat
        const isWorker = chat.worker && chat.worker.user &&
          chat.worker.user._id.toString() === userId.toString();
        const isCustomer = chat.customer &&
          chat.customer._id.toString() === userId.toString();

        if (!isWorker && !isCustomer) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      // Get paginated messages with proper sorting
      const totalMessages = chat.messages.length;
      const startIdx = Math.max(0, totalMessages - (page * limit));
      const endIdx = Math.max(0, totalMessages - ((page - 1) * limit));      // Get messages for current page and reverse them for proper ordering
      const messages = chat.messages
        .slice(startIdx, endIdx)
        .reverse()
        .map(msg => ({
          _id: msg._id,
          content: msg.content,
          sender: {
            _id: msg.sender._id,
            name: msg.sender.name,
            profileImage: msg.sender.profileImage,
            type: isWorker ? (msg.sender._id.toString() === userId.toString() ? 'worker' : 'customer')
              : (msg.sender._id.toString() === userId.toString() ? 'customer' : 'worker')
          },
          timestamp: msg.timestamp,
          read: msg.read
        }));

      // Mark messages as read
      if (messages.length > 0) {
        await Chat.updateMany(
          {
            _id: chat._id,
            'messages.sender': { $ne: userId },
            'messages.read': false
          },
          { $set: { 'messages.$[elem].read': true } },
          {
            arrayFilters: [{ 'elem.sender': { $ne: userId } }],
            multi: true
          }
        );
      }

      // Return formatted response
      const chatObject = chat.toObject();
      res.status(200).json({
        ...chatObject,
        messages,
        totalMessages,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / limit)
      });
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get all chats for a user
  getAllUserChats: async (req, res) => {
    try {
      const userId = req.user._id;
      const { status = 'active' } = req.query;

      // Find worker profile if exists
      const workerProfile = await User.findById(userId).populate('workerProfile');

      const query = {
        status,
        $or: [
          { customer: userId }
        ]
      };

      // Add worker condition if user has a worker profile
      if (workerProfile?.workerProfile) {
        query.$or.push({ worker: workerProfile.workerProfile._id });
      }

      const chats = await Chat.find(query)
        .populate([
          {
            path: 'worker',
            populate: {
              path: 'user',
              select: 'name profileImage'
            }
          },
          {
            path: 'customer',
            select: 'name profileImage'
          },
          {
            path: 'booking',
            select: 'jobCode status serviceDetails.service'
          },
          {
            path: 'messages.sender',
            select: 'name profileImage'
          }
        ])
        .sort({ updatedAt: -1 });

      // Count unread messages for each chat
      const chatsWithUnreadCount = await Promise.all(chats.map(async (chat) => {
        const unreadCount = chat.messages.filter(msg =>
          !msg.read && msg.sender.toString() !== userId.toString()
        ).length;

        return {
          ...chat.toObject(),
          unreadCount
        };
      }));

      res.status(200).json(chatsWithUnreadCount);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (req, res) => {
    try {
      const { chatId } = req.params;
      const { messageIds } = req.body;
      const userId = req.user._id;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Verify user has access to this chat
      const isWorker = chat.worker && chat.worker.toString() === userId.toString();
      const isCustomer = chat.customer && chat.customer.toString() === userId.toString();
      if (!isWorker && !isCustomer) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Mark specified messages as read
      await Chat.updateOne(
        { _id: chatId },
        {
          $set: {
            'messages.$[elem].read': true
          }
        },
        {
          arrayFilters: [{
            'elem._id': { $in: messageIds },
            'elem.sender': { $ne: userId }
          }],
          multi: true
        }
      );

      res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Archive chat
  archiveChat: async (req, res) => {
    try {
      const { chatId } = req.params;
      const userId = req.user._id;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Verify user has access to this chat
      const isWorker = chat.worker && chat.worker.toString() === userId.toString();
      const isCustomer = chat.customer && chat.customer.toString() === userId.toString();
      if (!isWorker && !isCustomer) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Check if the booking is completed or cancelled
      const booking = await Booking.findById(chat.booking);
      if (!booking || !['completed', 'cancelled'].includes(booking.status)) {
        return res.status(400).json({
          message: 'Chat can only be archived for completed or cancelled bookings'
        });
      }

      chat.status = 'archived';
      await chat.save();

      res.status(200).json({ message: 'Chat archived successfully' });
    } catch (error) {
      console.error('Error archiving chat:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

const formatChatResponse = (chat, booking, userId) => {
  const isWorker = booking.worker.user._id.toString() === userId.toString();

  // Format messages with proper sender types and images
  const messages = chat.messages.map(message => {
    const isSenderWorker = booking.worker.user._id.toString() === message.sender._id.toString();
    return {
      _id: message._id,
      content: message.content,
      timestamp: message.timestamp,
      read: message.read,
      sender: {
        _id: message.sender._id,
        name: message.sender.name,
        profileImage: isSenderWorker ? booking.worker.user.profileImage : booking.customer.profileImage,
        type: isSenderWorker ? 'worker' : 'customer'
      }
    };
  });

  return {
    chatId: chat._id,
    booking: {
      _id: booking._id,
      status: booking.status
    },
    participants: {
      worker: {
        _id: booking.worker.user._id,
        name: booking.worker.user.name,
        profileImage: booking.worker.user.profileImage,
        type: 'worker'
      },
      customer: {
        _id: booking.customer._id,
        name: booking.customer.name,
        profileImage: booking.customer.profileImage,
        type: 'customer'
      }
    },
    currentUser: {
      type: isWorker ? 'worker' : 'customer'
    },
    messages
  };
};

module.exports = chatController;
