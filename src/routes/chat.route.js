const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/Authentication');
const chatController = require('../controllers/chat.ctrl');

// Initialize or get existing chat for a booking
router.get('/booking/:bookingId', authenticate, chatController.initializeChat);

// Get chat history for a booking with pagination
router.get('/history/:bookingId', authenticate, chatController.getChatHistory);

// Get all chats for a user (both as worker and customer)
router.get('/user/all', authenticate, chatController.getAllUserChats);

// Mark messages as read
router.put('/:chatId/read', authenticate, chatController.markMessagesAsRead);

// Archive chat
router.put('/:chatId/archive', authenticate, chatController.archiveChat);

module.exports = router;
