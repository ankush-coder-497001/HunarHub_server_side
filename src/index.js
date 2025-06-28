require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ORIGIN || ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  transports: ['polling', 'websocket'], // Try polling first
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
  cookie: false
});

//middleware
const ORIGIN = process.env.ORIGIN || ['http://localhost:5173', 'http://localhost:4173'];
app.use(cors({
  origin: ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const userRoutes = require('./routes/user.routes');
const workerRoutes = require('./routes/worker.route');
const serviceRoutes = require('./routes/service.route');
const bookingRoutes = require('./routes/booking.route');
const searchRoutes = require('./routes/search.route');
const reviewRoutes = require('./routes/review.route');
const chatRoutes = require('./routes/chat.route');

app.use('/api/users', userRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chats', chatRoutes);

// Socket.IO setup

// Socket.IO setup
const Chat = require('./models/chat.model');
const User = require('./models/user.model');
const WorkerProfile = require('./models/worker.model');
const Booking = require('./models/booking.model');
const jwt = require('jsonwebtoken');
const sendPushNotification = require('./services/Message.svc');

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role; // Role is stored in token

    if (decoded.role === 'worker') {
      // If user is a worker, get their worker profile ID
      const workerProfile = await WorkerProfile.findOne({ user: decoded.userId });
      if (workerProfile) {
        socket.workerId = workerProfile._id;
      }
    }

    next();
  } catch (err) {
    console.error('Socket auth error:', err);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {

  socket.on('join_chat', async ({ bookingId, userId }) => {
    try {


      // Find or initialize chat
      let chat = await Chat.findOne({ booking: bookingId });

      if (!chat) {
        // Get booking details to create chat
        const booking = await Booking.findById(bookingId)
          .populate('worker', 'user')
          .populate('customer');

        if (!booking) {
          socket.emit('error', { message: 'Booking not found' });
          return;
        }

        // Create new chat
        chat = await Chat.create({
          booking: bookingId,
          worker: booking.worker._id,
          customer: booking.customer._id,
          messages: []
        });
      }      // Verify user has access
      const isWorker = chat.worker.toString() === socket.workerId?.toString();
      const isCustomer = chat.customer.toString() === socket.userId.toString();

      if (!isWorker && !isCustomer) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      await socket.join(`chat_${bookingId}`);

      // Confirm room joining to client
      socket.emit('joined_chat', { bookingId, roomName: `chat_${bookingId}` });
    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit('error', { message: 'Error joining chat' });
    }
  });
  socket.on('send_message', async ({ bookingId, content }) => {
    try {
      // Use the authenticated user's ID from socket
      if (!socket.userId) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      let chat = await Chat.findOne({ booking: bookingId });
      if (!chat) {
        // Get booking details to create chat
        const booking = await Booking.findById(bookingId)
          .populate('worker')
          .populate('customer');

        if (!booking) {
          socket.emit('error', { message: 'Booking not found' });
          return;
        }

        // Verify user has access to this booking
        if (socket.userRole === 'worker' && socket.workerId) {
          if (booking.worker._id.toString() !== socket.workerId.toString()) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }
        } else if (booking.customer._id.toString() !== socket.userId.toString()) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Create new chat
        chat = await Chat.create({
          booking: bookingId,
          worker: booking.worker._id,
          customer: booking.customer._id,
          messages: []
        });
      }

      // Verify user has access to this chat
      if (socket.userRole === 'worker' && socket.workerId) {
        if (chat.worker.toString() !== socket.workerId.toString()) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }
      } else if (chat.customer.toString() !== socket.userId.toString()) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }      // Get the full user information first
      const user = await User.findById(socket.userId).select('name profileImage');
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }      // Add message to chat with proper User reference
      const newMessage = {
        _id: new mongoose.Types.ObjectId(),  // Explicitly create a new ObjectId
        sender: socket.userId,  // References User model as required
        content,
        timestamp: new Date(),
        read: false
      };

      // Add message and update lastMessage
      chat.messages.push(newMessage); chat.lastMessage = {
        content,
        timestamp: new Date(),
        sender: socket.userId
      };

      await chat.save();
      const populatedMessage = {
        _id: newMessage._id.toString(), // Convert ObjectId to string
        content: newMessage.content,
        timestamp: newMessage.timestamp,
        read: newMessage.read,
        sender: {
          _id: user._id.toString(),
          name: user.name,
          profileImage: user.profileImage || (socket.userRole === 'worker' ? 'default-worker.jpg' : 'default-customer.jpg'),
          type: socket.userRole
        }
      };

      // Emit the new message to all users in the chat room including sender
      io.in(`chat_${bookingId}`).emit('new_message', populatedMessage);


      // Get the populated chat to ensure we have all sender details
      const populatedChat = await Chat.findById(chat._id)
        .populate({
          path: 'messages.sender',
          select: 'name profileImage'
        });

      const savedMessage = populatedChat.messages[populatedChat.messages.length - 1];

      // Create populated message for socket emission
      const messageToSend = {
        _id: savedMessage._id.toString(),
        content: savedMessage.content,
        timestamp: savedMessage.timestamp,
        read: savedMessage.read,
        sender: {
          _id: user._id,
          name: user.name,
          profileImage: user.profileImage,
          type: socket.userRole
        }
      };

      const booking = await Booking.findById(bookingId)
        .populate({
          path: 'worker',
          select: 'user',
          populate: {
            path: 'user',
          }
        })
        .populate('customer');

      // If the sender is a worker, also notify the customer
      if (socket.userRole === 'worker') {
        await sendPushNotification(booking.customer._id, 'New Message', `You have a new message from ${user.name}: ${content}`).catch((err) => console.error('error sending push notification for new message ', err));
      } else {
        // If the sender is a customer, notify the worker
        await sendPushNotification(booking.worker.user._id, 'New Message', `You have a new message from ${user.name}: ${content}`).catch((err) => console.error('error sending push notification for new message ', err));
      }

      // Emit the properly formatted message
      io.to(`chat_${bookingId}`).emit('new_message', messageToSend);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Error sending message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

//monodb setup
mongoose.connect(process.env.MONGO_STRING).then((res) => {
  console.log('MongoDB connected');
  // Import and start the booking cleanup job
  require('./jobs/bookingCleanup')
  require('./jobs/acceptedReminder30Min');
  require('./jobs/acceptedReminder1Hour');
  require('./jobs/overdueRequestedReminder');
}).catch((err) => {
  console.log('MongoDB connection error:', err);
});

//starting the server
const PORT = process.env.PORT || 8001;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});