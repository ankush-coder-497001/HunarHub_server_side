const WorkerModel = require('../models/worker.model');
const UserModel = require('../models/user.model');
const mongoose = require('mongoose');

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

const SearchController = {
  GetWorkersByXkmRadius: async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;

      if (!lat || !lng || !radius) {
        return res.status(400).json({ message: "Missing required parameters: lat, lng, radius" });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusInMeters = parseFloat(radius) * 1000; if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusInMeters)) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      // Drop all existing indexes and create a fresh one
      try {
        await WorkerModel.collection.dropIndexes();
        await WorkerModel.collection.createIndex({ "ServiceArea.location": "2dsphere" });
      } catch (indexError) {
        console.error("Index operation error:", indexError);
      }

      const workers = await WorkerModel.find({
        isActive: true,
        ServiceRadius: { $gte: radiusInMeters / 1000 },
        "ServiceArea.location": {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusInMeters
          }
        }
      })
        .populate('user')
        .populate('services')
        .select('user ProfileImage profession experience rating reviewsCount ServiceArea pricing gallery availability workSchedule ServiceRadius isActive')
        .sort({ reviewsCount: -1 });      // Calculate distances for each worker
      const workersWithDistance = workers.map(worker => {
        const workerDoc = worker.toObject();
        // Calculate distance using coordinates
        const distance = calculateDistance(
          latitude,
          longitude,
          worker.ServiceArea.location.coordinates[1],
          worker.ServiceArea.location.coordinates[0]
        );
        return {
          ...workerDoc,
          distance // distance in km
        };
      });

      res.status(200).json(workersWithDistance);
    } catch (error) {
      console.error("Error in searchWorkerByXkmRadius:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  searchWorkers: async (req, res) => {
    try {
      const { search, services } = req.query;

      if (!search && !services) {
        return res.status(400).json({ message: "Please provide at least a search term or a service." });
      }

      const query = { isActive: true };
      const orConditions = [];

      if (search) {
        const searchRegex = new RegExp(search.trim(), 'i');
        const matchingUsers = await UserModel.find({ name: searchRegex }).select('_id');
        const matchingUserIds = matchingUsers.map(user => user._id);

        orConditions.push(
          { Skills: searchRegex },
          { user: { $in: matchingUserIds } }
        );
      }

      if (services) {
        query.services = { $in: [mongoose.Types.ObjectId(services)] };
      }

      if (orConditions.length > 0) {
        query.$or = orConditions;
      }

      const workers = await WorkerModel.find(query)
        .populate('user')
        .populate('services')
        .select('user profession experience rating reviewsCount ServiceArea pricing gallery availability workSchedule ServiceRadius isActive')
        .sort({ reviewsCount: -1 });

      res.status(200).json(workers);
    } catch (error) {
      console.error("Error in searchWorkers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = SearchController;