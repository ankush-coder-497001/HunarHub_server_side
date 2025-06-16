const mongoose = require('mongoose');
const ReviewModel = require('../models/review.model');
const BookingModel = require('../models/booking.model');
const UserModel = require('../models/user.model');
const workerModel = require('../models/worker.model');

const ReviewController = {
  submitReview: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { bookingId, workerId, rating, comment } = req.body;

      if (!bookingId || !workerId || !rating) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const numericRating = parseFloat(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: 'Invalid rating value' });
      }

      // Validate booking
      const booking = await BookingModel.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (booking.status !== 'completed') {
        return res.status(403).json({ message: 'Booking should be completed before reviewing' });
      }

      // Check if review already exists for this booking
      const existingReview = await ReviewModel.findOne({ booking: bookingId });
      if (existingReview) {
        return res.status(400).json({ message: 'Review already exists for this booking' });
      }

      // Validate customer
      const customer = await UserModel.findById(userId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Validate worker profile
      const workerProfile = await workerModel.findById(workerId);
      if (!workerProfile) {
        return res.status(404).json({ message: 'Worker profile not found' });
      }

      // Validate that the booking exists and has a service
      if (!booking.serviceDetails || !booking.serviceDetails.service) {
        return res.status(400).json({
          message: 'Invalid booking: missing service details'
        });
      }

      // Create review
      const review = new ReviewModel({
        booking: bookingId,
        worker: workerId,
        customer: userId,
        rating: numericRating,
        comment,
        isActive: true // Ensure isActive is set
      });

      // Save the review first
      await review.save();

      // Add review to worker's reviews array
      if (!workerProfile.reviews) {
        workerProfile.reviews = [];
      }
      workerProfile.reviews.push(review._id);

      // Recalculate average rating from all active reviews
      const allWorkerReviews = await ReviewModel.find({
        worker: workerId,
        isActive: true
      });

      const avgRating = allWorkerReviews.reduce((acc, curr) => acc + curr.rating, 0) / allWorkerReviews.length;

      // Update worker profile
      workerProfile.rating = parseFloat(avgRating.toFixed(1));
      workerProfile.reviewsCount = allWorkerReviews.length;
      booking.rated = true; // Mark booking as rated
      await booking.save(); // Save the updated booking
      await workerProfile.save();

      res.status(201).json({
        message: 'Review submitted successfully',
        review,
        workerStats: {
          rating: workerProfile.rating,
          totalReviews: workerProfile.reviewsCount
        }
      });

    } catch (error) {
      console.error('Error submitting review:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  getReviewsByWorker: async (req, res) => {
    try {
      const { workerId } = req.params;
      if (!workerId) {
        return res.status(400).json({ message: 'Worker ID is required' });
      }
      const workerProfile = await workerModel.findOne({ user: workerId });
      if (!workerProfile) {
        return res.status(404).json({ message: 'Worker profile not found' });
      }
      const reviews = await ReviewModel.find({ worker: workerProfile._id })
        .populate('customer')
        .populate({
          path: 'booking',
          model: 'Booking',
          populate: {
            path: 'serviceDetails.service',
            select: 'name description',
            model: 'ServiceCategory'
          }
        }).sort({ createdAt: -1 });
      if (!reviews || reviews.length === 0) {
        return res.status(404).json({ message: 'No reviews found for this worker' });
      }
      res.status(200).json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  getTopReviews: async (req, res) => {
    try {
      // Get a sample review first to debug the relationships
      const sampleReview = await ReviewModel.findOne({ isActive: true })
        .populate('customer')
        .populate({
          path: 'booking',
          populate: {
            path: 'serviceDetails.service',
            model: 'ServiceCategory'
          }
        });

      // Check the actual service document
      if (sampleReview && sampleReview.booking && sampleReview.booking.serviceDetails.service) {
        const serviceId = sampleReview.booking.serviceDetails.service;

        // Check if service exists in servicecategories collection
        const service = await mongoose.connection.collection('servicecategories').findOne({ _id: serviceId });
      }

      const reviews = await ReviewModel.aggregate([
        {
          $match: {
            isActive: true
          }
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'customer',
            foreignField: '_id',
            as: 'reviewer'
          }
        },
        {
          $unwind: {
            path: '$reviewer',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'bookings',
            localField: 'booking',
            foreignField: '_id',
            as: 'bookingData'
          }
        },
        {
          $addFields: {
            hasBooking: { $gt: [{ $size: '$bookingData' }, 0] }
          }
        },
        {
          $lookup: {
            from: 'servicecategories',
            pipeline: [
              {
                $match: {
                  isActive: true
                }
              },
              {
                $limit: 1
              }
            ],
            as: 'defaultService'
          }
        },
        {
          $addFields: {
            booking: {
              $cond: {
                if: { $gt: [{ $size: '$bookingData' }, 0] },
                then: { $arrayElemAt: ['$bookingData', 0] },
                else: null
              }
            },
            defaultServiceName: {
              $cond: {
                if: { $gt: [{ $size: '$defaultService' }, 0] },
                then: { $arrayElemAt: ['$defaultService.name', 0] },
                else: 'General Service'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'servicecategories',
            let: { serviceId: '$booking.serviceDetails.service' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$serviceId'] }
                }
              }
            ],
            as: 'service'
          }
        },
        {
          $addFields: {
            debug_service_array: '$service',
            debug_has_service: { $gt: [{ $size: '$service' }, 0] }
          }
        },
        {
          $unwind: {
            path: '$service',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            id: '$_id',
            rating: 1,
            comment: 1,
            reviewerName: '$reviewer.name',
            reviewerImage: {
              $ifNull: ['$reviewer.profileImage', 'https://randomuser.me/api/portraits/men/1.jpg']
            }, serviceName: {
              $cond: {
                if: '$hasBooking',
                then: { $ifNull: ['$service.name', 'General Service'] },
                else: 'General Service'
              }
            },
            daysAgo: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$createdAt'] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          }
        },
        {
          $limit: 10
        }
      ]);

      if (!reviews || reviews.length === 0) {
        console.log('No reviews found after aggregation');
        return res.status(404).json({ message: 'No reviews found' });
      }


      res.status(200).json(reviews);
    } catch (error) {
      console.error('Error fetching top reviews:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = ReviewController;