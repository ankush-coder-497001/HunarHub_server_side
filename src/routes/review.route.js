const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/review.ctrl');
const Auth = require('../middleware/Authentication')
router.post('/submit', Auth, ReviewController.submitReview);
router.get('/worker/:workerId', ReviewController.getReviewsByWorker);
router.get('/top-reviews', ReviewController.getTopReviews);

module.exports = router;