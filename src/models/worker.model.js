// models/WorkerProfile.js
const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  onboardingCompleted: { type: Boolean, default: false }, // Track onboarding completion
  ProfileImage: { type: String, default: null }, // URL to profile image
  bio: { type: String },
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' }],
  Skills: [{ type: String }],
  ProfileImage: { type: String, default: null }, // URL to profile image
  profession: { type: String, required: true },
  experience: { type: Number, default: 0 }, // in years
  emergencyService: { type: Boolean, default: false }, // Whether worker provides emergency services
  IdProof: { type: String, default: null }, // URL to ID proof image
  Certification: { type: String, default: null }, // URL to certification image
  pricing: {
    hourlyRate: { type: Number },
    fixedRate: { type: Number },
  },
  isVerified: { type: Boolean, default: false }, // Whether worker is verified
  gallery: [String],
  ServiceArea: {
    name: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  workSchedule: [{
    day: { type: String, required: true },
    startTime: { type: String, required: true }, // e.g., '09:00'
    endTime: { type: String, required: true } // e.g., '17:00'
  }],
  ServiceRadius: { type: Number, default: 0 }, // in kilometers
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  isActive: { type: Boolean, default: true }

}, { timestamps: true });


workerProfileSchema.index({ 'ServiceAreas.location': '2dsphere' });


module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
