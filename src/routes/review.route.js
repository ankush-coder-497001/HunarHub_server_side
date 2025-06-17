const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/review.ctrl');
const Auth = require('../middleware/Authentication')
const RoleValidation = require('../middleware/RoleValidation')

router.post('/submit', Auth, ReviewController.submitReview);
router.get('/worker/:workerId', ReviewController.getReviewsByWorker);
router.get('/top-reviews', ReviewController.getTopReviews);
router.get('/admin', Auth, RoleValidation("admin"), ReviewController.GetAdminReviews);
router.put('/:reviewId/status', Auth, RoleValidation("admin"), ReviewController.UpdateReviewStatus);

module.exports = router;