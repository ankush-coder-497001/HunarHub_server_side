const userModel = require("../models/user.model");
const workerModel = require('../models/worker.model')
const BookingModel = require('../models/booking.model')
const ServiceModel = require('../models/service.model')
const { SetWorkersServiceArea } = require('../services/location.svc');
const defaultProfessions = require('../defaultProfession');

const getServicesByProfession = async (profession) => {
  const prof = defaultProfessions.find(p => p.profession === profession);
  return prof ? prof.services : [];
}

const WorkerController = {
  checkOnboardingStatus: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const worker = await workerModel.findOne({ user: userId });
      // If worker profile does not exist, return needsOnboarding as true
      if (!worker) {
        return res.status(200).json({
          message: "Worker profile not found",
          needsOnboarding: true,
          userId: userId
        });
      }
      return res.status(200).json({
        needsOnboarding: !worker.onboardingCompleted,
        userId: userId,
      });
    } catch (error) {
      return res.status(500).json({ message: "Error checking onboarding status" });
    }
  },

  CreateProfile: async (req, res) => {
    try {
      const { workerId, bio, profession, serviceArea, experience, pricing, availability, radius, emergencyService } = req.body;
      const user = await userModel.findById(workerId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.role !== 'worker') {
        return res.status(403).json({ message: "Only workers can create a profile" });
      }

      // Convert availability object to workSchedule array
      const workSchedule = Object.entries(availability || {})
        .filter(([_, value]) => value?.isAvailable)
        .map(([day, value]) => ({
          day,
          startTime: value.start,
          endTime: value.end,
        }));
      let services = [];
      //create service array from profession
      const defaultServices = await getServicesByProfession(profession);

      if (defaultServices && defaultServices.length > 0) {
        const serviceDocs = await Promise.all(
          defaultServices.map(async name => {
            const existingService = await ServiceModel.findOne({ name });
            if (existingService) {
              return existingService; // If service already exists, return it
            }
            // If service does not exist, create a new one
            return new ServiceModel({ name }).save();
          })
        );
        services = serviceDocs.map(service => service._id);
      }

      const workerProfile = {
        user: workerId,
        onboardingCompleted: true, // Set to true when profile is created
        bio,
        profession: profession,
        experience,
        emergencyService: emergencyService || false,
        pricing,
        workSchedule,
        ServiceRadius: radius || 0,
        ServiceArea: serviceArea || {
          name: "Default Area",
          location: {
            type: "Point",
            coordinates: [0, 0]
          }
        },
        // Files are now URLs after being processed by ImageUpload middleware
        IdProof: req.body.IdProof,
        Certification: req.body.Certification,
        ProfileImage: req.body.ProfileImage,
        services: services,
      };

      const worker = await workerModel.create(workerProfile);
      if (!worker) {
        return res.status(500).json({ message: "Failed to create worker profile" });
      }

      res.status(201).json({ message: "Worker profile created successfully", worker });
    } catch (error) {
      console.error("Error creating worker profile:", error);
      res.status(500).json({ message: error.message });
    }
  },
  UpdateProfile: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      if (req.body.availability) {
        // Convert availability object to workSchedule array
        const workSchedule = Object.entries(req.body.availability || {})
          .filter(([_, value]) => value?.isAvailable)
          .map(([day, value]) => ({
            day,
            startTime: value.start,
            endTime: value.end,
          }));
        req.body.workSchedule = workSchedule;
        delete req.body.availability; // Remove availability from the request body
      }

      if (req.body.name || req.body.email || req.body.phone) {
        const user = await userModel.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.phone) user.phone = req.body.phone;
        await user.save();
        delete req.body.name;
        delete req.body.email;
        delete req.body.phone;
      }

      if (req.body.profileImage) {
        // If profileImage is provided, it should be a URL after being processed by ImageUpload middleware
        req.body.ProfileImage = req.body.profileImage;
        delete req.body.profileImage; // Remove profileImage from the request body
      }


      if (req.body.services && req.body.services.length > 0) {
        //create each service and store the service id and prevent duplicate services
        const services = req.body.services.map(
          async (service) => {
            const existingService = await ServiceModel.findOne({ name: service });
            if (existingService) {  // If service already exists, return its ID
              return existingService._id;
            }
            const newService = await ServiceModel.create({ name: service });
            return newService._id;
          }
        );
        req.body.services = await Promise.all(services);
      }

      const worker = await workerModel.findOneAndUpdate(
        { user: userId },
        { $set: req.body },
        { new: true }
      );
      if (!worker) {
        return res.status(404).json({ message: "Worker profile not found" });
      }
      res.status(200).json(
        { message: "Worker profile updated successfully", worker }
      )
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  DeleteAccount: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const worker = await workerModel.findOneAndDelete({ user: userId });
      if (!worker) {
        return res.status(404).json({ message: "Worker profile not found" });
      }
      const user = await userModel.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  getProfileById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Worker ID is required" });
      }
      const worker = await workerModel.findById(id).populate('user').populate('services').populate({
        path: 'reviews',
        match: { isApproved: true },
        populate: [
          {
            path: 'booking'
          },
          {
            path: 'customer'
          }
        ]

      });
      if (!worker) {
        return res.status(404).json({ message: "Worker profile not found" });
      }
      res.status(200).json({ message: "Worker profile fetched successfully", worker });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  getProfile: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const worker = await workerModel.findOne({ user: userId }).populate('user').populate('services').populate({
        path: 'reviews',
        match: { isApproved: true },
      });
      if (!worker) {
        return res.status(404).json({ message: "Worker profile not found" });
      }
      res.status(200).json({ message: "Worker profile fetched successfully", worker });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  GetAllWorkers: async (req, res) => {
    try {
      // First get all worker users
      const workerUsers = await userModel.find({ role: "worker" })
        .select("name email phone isBlocked isActive createdAt")
        .lean();

      if (!workerUsers?.length) {
        return res.status(200).json({ workers: [] });
      }

      // Get all worker profiles
      const workerProfiles = await workerModel.find({
        user: { $in: workerUsers.map(w => w._id) }
      }).lean();

      // Create a map of worker profiles by user ID for easy lookup
      const profileMap = new Map(workerProfiles.map(profile => [profile.user.toString(), profile]));

      const formattedWorkers = workerUsers.map(user => {
        const profile = profileMap.get(user._id.toString());
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.isBlocked ? 'blocked' : (profile?.isVerified ? 'verified' : 'pending'),
          joinedDate: user.createdAt.toISOString().split('T')[0],
          rating: profile?.rating || 0,
          idProof: profile?.IdProof || '',
          isVerified: profile?.isVerified || false,
          isActive: user.isActive
        };
      });

      res.status(200).json({ workers: formattedWorkers });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  setServiceAreas: async (req, res) => {
    try {
      const { workerId, lat, lon, radiusKm } = req.body;
      if (!workerId || !lat || !lon || !radiusKm) {
        return res.status(400).json({ message: "Worker ID, latitude, longitude, and radius are required." });
      }
      const serviceAreas = await SetWorkersServiceArea(workerId, lat, lon, radiusKm);
      if (!serviceAreas || serviceAreas.length === 0) {
        return res.status(404).json({ message: "No service areas found for the worker" });
      }
      res.status(200).json({ message: "Service areas set successfully", serviceAreas });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },
  getWorkerStats: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const worker = await workerModel.findOne({ user: userId }).populate({
        path: 'reviews',
        select: 'rating' // only fetch rating from each review
      });
      if (!worker) {
        return res.status(404).json({ message: "Worker profile not found" });
      }

      // Calculate average rating
      const averageRating = worker.reviews.length
        ? worker.reviews.reduce((acc, review) => acc + review.rating, 0) / worker.reviews.length
        : 0;

      // Calculate total earnings from all completed bookings using the correct price field
      const totalEarningsAgg = await BookingModel.aggregate([
        {
          $match: {
            worker: worker._id,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$serviceDetails.price' }
          }
        }
      ]);
      const totalEarnings = totalEarningsAgg[0]?.total || 0;

      const completedJobs = await BookingModel.countDocuments({ worker: worker._id, status: 'completed' });
      const totalBookings = await BookingModel.countDocuments({ worker: worker._id });

      // Calculate this month's stats using the correct date field
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      // Get completed bookings for this month using the correct date and price fields
      const monthlyBookingsAgg = await BookingModel.aggregate([
        {
          $match: {
            worker: worker._id,
            status: 'completed',
            date: { $gte: startOfMonth, $lt: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            bookings: { $sum: 1 },
            earnings: { $sum: '$serviceDetails.price' }
          }
        }
      ]);

      const monthlyStats = monthlyBookingsAgg[0] || { bookings: 0, earnings: 0 };

      // Calculate completion rate for this month
      const totalMonthlyBookings = await BookingModel.countDocuments({
        worker: worker._id,
        date: { $gte: startOfMonth, $lt: endOfMonth },
        status: { $in: ['completed', 'cancelled'] }
      });

      const completionRate = totalMonthlyBookings > 0
        ? (monthlyStats.bookings / totalMonthlyBookings) * 100
        : 0;

      // Calculate upcoming bookings using the correct date field
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const endOfToday = new Date(today.setHours(23, 59, 59, 999));

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const todayBookings = await BookingModel.countDocuments({
        worker: worker._id,
        status: 'requested',
        date: { $gte: startOfToday, $lt: endOfToday }
      });

      const weekBookings = await BookingModel.countDocuments({
        worker: worker._id,
        status: 'requested',
        date: { $gte: startOfWeek, $lt: endOfWeek }
      });

      res.status(200).json({
        message: "Worker stats fetched successfully",
        stats: {
          averageRating,
          totalEarnings,
          completedJobs,
          totalBookings,
          thisMonthStats: {
            bookings: monthlyStats.bookings,
            earnings: monthlyStats.earnings,
            completionRate: Math.round(completionRate * 10) / 10  // Round to 1 decimal place
          },
          upComingStats: {
            today: todayBookings,
            thisWeek: weekBookings
          }
        }
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },
  AddGallery: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const worker = await workerModel.findOne({ user: userId }); if (!worker) {
        return res.status(404).json({ message: "Worker profile not found" });
      }

      const imageUrl = req.body.imageUrl;
      if (!imageUrl) {
        return res.status(400).json({ message: "No image provided" });
      }

      // Add the new image to the gallery array
      if (!worker.gallery) {
        worker.gallery = [];
      }

      // Limit gallery to 3 images
      if (worker.gallery.length >= 3) {
        return res.status(400).json({ message: "Gallery already has maximum of 3 images" });
      }

      worker.gallery.push(imageUrl);
      await worker.save();

      res.status(200).json({ message: "Image added to gallery successfully", gallery: worker.gallery });
    } catch (error) {
      console.error("Error adding gallery:", error);
      res.status(500).json({ message: error.message });
    }
  },
  RemoveGalleryImage: async (req, res) => {
    try {
      const { userId } = req.user;
      const { imageUrl } = req.params;

      if (!userId || !imageUrl) {
        return res.status(400).json({
          success: false,
          message: "User ID and image URL are required"
        });
      }

      const worker = await workerModel.findOne({ user: userId });
      if (!worker) {
        return res.status(404).json({
          success: false,
          message: "Worker profile not found"
        });
      }

      if (!worker.gallery) {
        worker.gallery = [];
        await worker.save();
        return res.status(200).json({
          success: true,
          message: "Gallery is already empty",
          gallery: []
        });
      }

      // Decode the URL before comparison since it comes encoded from the request
      const decodedUrl = decodeURIComponent(imageUrl);

      // Remove the image from the gallery array
      if (!worker.gallery.includes(decodedUrl)) {
        return res.status(404).json({
          success: false,
          message: "Image not found in gallery"
        });
      }

      worker.gallery = worker.gallery.filter(img => img !== decodedUrl);
      await worker.save();

      return res.status(200).json({
        success: true,
        message: "Image removed from gallery successfully",
        gallery: worker.gallery
      });

    } catch (error) {
      console.error("Error removing gallery image:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error removing gallery image"
      });
    }
  },
  TopWorkers: async (req, res) => {
    try {
      // Get top workers using aggregate pipeline
      const topWorkers = await BookingModel.aggregate([
        {
          $match: {
            status: 'completed'  // Only get completed bookings
          }
        },
        {
          $group: {
            _id: '$worker',  // Group by the worker ID
            totalEarnings: {
              $sum: '$serviceDetails.price'  // Sum the prices
            },
            completedJobs: { $sum: 1 }  // Count the bookings
          }
        },
        {
          $sort: { totalEarnings: -1, completedJobs: -1 }
        },
        {
          $limit: 10
        },
        {
          $lookup: {
            from: 'workerprofiles',
            localField: '_id',
            foreignField: '_id',
            as: 'workerProfile'
          }
        },
        {
          $unwind: '$workerProfile'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'workerProfile.user',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $unwind: '$userDetails'
        },
        {
          $project: {
            _id: 0,
            workerId: '$workerProfile._id',
            userId: '$userDetails._id',
            name: '$userDetails.name',
            email: '$userDetails.email',
            phone: '$userDetails.phone',
            totalEarnings: 1,
            completedJobs: 1,
            workerDetails: {
              profession: '$workerProfile.profession',
              rating: '$workerProfile.rating',
              reviewsCount: '$workerProfile.reviewsCount',
              profileImage: '$workerProfile.ProfileImage',
              experience: '$workerProfile.experience',
              pricing: '$workerProfile.pricing'
            }
          }
        }
      ]);


      if (!topWorkers || topWorkers.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No workers found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Top workers fetched successfully",
        data: topWorkers
      });
    } catch (error) {
      console.error("Error fetching top workers:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error fetching top workers"
      });
    }
  },
  VerifyWorker: async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }

      const worker = await workerModel.findOne({ user: userId });
      if (!worker) {
        return res.status(404).json({
          success: false,
          message: "Worker profile not found"
        });
      }

      // Update the worker's verification status
      worker.isVerified = true;
      await worker.save();

      res.status(200).json({
        success: true,
        message: "Worker verified successfully",
        worker
      });
    } catch (error) {
      console.error("Error verifying worker:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error verifying worker"
      });
    }
  }
}

module.exports = WorkerController;