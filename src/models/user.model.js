// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  role: { type: String, enum: ['customer', 'worker', 'admin'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String },
  otpExpires: { type: Date },
  profileImage: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    zip: { type: String }
  },
  location: {
    type: {
      type: String, // 'Point'
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { type: [Number], index: '2dsphere' } // [longitude, latitude]
  },
  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
}

userSchema.methods.generateOTP = async function (length) {
  //only numbers 
  const numbers = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return result;
}

userSchema.methods.generateToken = async function () {
  const token = jwt.sign({ userId: this._id, email: this.email, phone: this.phone, role: this.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return token;
}


module.exports = mongoose.model('User', userSchema);
