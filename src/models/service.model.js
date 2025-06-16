// models/ServiceCategory.js
const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  iconUrl: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);
