// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  jobCode: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true },

  serviceDetails: {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', required: true },
    urgency: { type: String, enum: ['low', 'medium', 'high'], required: true },
    type: { type: String },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
  },

  date: { type: Date, required: true },
  time: { type: String, required: true },

  location: {
    address: String,
    lat: Number,
    lng: Number,
  },

  status: {
    type: String,
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },

  customerNotes: String,
  acceptedReminder30Min: { type: Boolean, default: false },
  acceptedReminder1Hour: { type: Boolean, default: false },
  overdueRequestedReminder: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  rated: { type: Boolean, default: false },
}, { timestamps: true });

bookingSchema.index(
  { worker: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['requested', 'accepted'] }
    }
  }
);


module.exports = mongoose.model('Booking', bookingSchema);
