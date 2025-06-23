const userModel = require("../models/user.model");
const workerModel = require("../models/worker.model");
const EmailService = require('../services/email.svc')
const bcrypt = require("bcryptjs");
const UserController = {
  register: async (req, res) => {
    try {
      const { phone, role, name, email, password } = req.body;
      if (!phone || !role || !name || !email || !password) {
        return res.status(400).json({ message: "Please fill all the fields" });
      }

      if (role !== "worker" && role !== "customer" && role !== "admin") {
        return res.status(400).json({ message: "Please select a valid role" });
      }
      const existingUser = await userModel.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ message: "This phone number is already registered" });
      }

      const existingEmail = await userModel.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "This email is already registered" });
      }

      const newUser = new userModel({
        phone,
        role,
        name,
        email,
        password, // The pre-save middleware will hash this
      });
      if (!newUser) {
        return res.status(400).json({ message: "Error creating user" });
      }
      await newUser.save();
      EmailService.WelcomeEmail(
        email,
        name,
      ).catch((error) => {
        console.error('Error sending welcome email:', error);
      });
      res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  login: async (req, res) => {
    try {
      const { phone, password } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ message: "Please fill all the fields" });
      }
      const user = await userModel.findOne({ phone });
      if (!user) {
        return res.status(400).json({ message: "You Don't have an account! Please Register" });
      }
      if (user.isBlocked) {
        return res.status(400).json({ message: "Your account has been blocked" });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const token = await user.generateToken();
      if (!token) {
        return res.status(400).json({ message: "Error generating token" });
      }
      res.status(200).json({
        token,
        user: {
          id: user._id,
          phone: user.phone,
          role: user.role,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  sendOtp: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Please fill all the fields" });
      }
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "You Don't have an account! Please Register" });
      }
      const otp = await user.generateOTP(6);
      if (!otp) {
        return res.status(400).json({ message: "Error generating OTP" });
      }
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();
      const message = `Your OTP is ${otp}. It is valid for 10 minutes.`;
      await EmailService.SendOTP(email, message);
      res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  verifyOtp: async (req, res) => {
    try {
      const { otp, email } = req.body;
      if (!otp || !email) {
        return res.status(400).json({ message: "Please fill all the fields" });
      }
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "You Don't have an account! Please Register" });
      }
      if (user.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      if (user.otpExpires < Date.now()) {
        return res.status(400).json({ message: "OTP has expired" });
      }
      user.otp = undefined;
      user.otpExpires = undefined;
      user.isVerified = true;
      await user.save();
      res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Please fill all the fields" });
      }
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "You Don't have an account! Please Register" });
      } user.password = password; // The pre-save middleware will hash this
      user.isVerified = true;
      await user.save();
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const { password, newpassword } = req.body;
      const userId = req.user.userId;
      if (!userId) {
        return res.status(400).json({ message: "User not found" });
      }
      if (!password || !newpassword) {
        return res.status(400).json({ message: "Please fill all the fields" });
      }
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      } user.password = newpassword; // The pre-save middleware will hash this
      await user.save();
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  profile: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: "User not found" });
      }
      const user = await userModel.findById(userId).select("-password -otp -otpExpires");
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      res.status(200).json({ user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  UpdateProfile: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: "User not found" });
      }

      // If a new image was uploaded, it will be in req.body.imageUrl from the middleware
      if (req.body.imageUrl) {
        req.body.profileImage = req.body.imageUrl;
        delete req.body.imageUrl;
      }
      const user = await userModel.findByIdAndUpdate(userId, {
        $set: req.body
      }, {
        new: true
      }).select("-password -otp -otpExpires");
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      res.status(200).json({ message: "Profile Updated successfully", user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  UpdateLocation: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: "User not found" });
      }
      const { latitude, longitude } = req.body;
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Please provide latitude and longitude" });
      }
      const user = await userModel.findByIdAndUpdate(userId, {
        location: {
          type: "Point",
          coordinates: [longitude, latitude] // [longitude, latitude]
        }
      }, {
        new: true
      }).select("-password -otp -otpExpires");
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      res.status(200).json({ message: "Location updated successfully", user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  DeleteAccount: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: "User not found" });
      }
      const user = await userModel.findByIdAndDelete(userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  GetAllUsers: async (req, res) => {
    try {
      const users = await userModel.find({ role: "customer" })
        .select("name email phone isBlocked isActive createdAt")
        .lean();

      if (!users?.length) {
        return res.status(200).json({ customers: [] });
      }

      const formattedUsers = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.isBlocked ? 'blocked' : (user.isActive ? 'active' : 'inactive'),
        joinedDate: user.createdAt.toISOString().split('T')[0]
      }));

      res.status(200).json({ customers: formattedUsers });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  UpdateStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      const { isBlocked } = req.body;
      if (!userId || typeof isBlocked !== 'boolean') {
        return res.status(400).json({ message: "Invalid request" });
      }
      const user = await userModel.findByIdAndUpdate(userId, { isBlocked }, { new: true });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`, user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  GetAccountBlockStatus: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: "User not found" });
      }
      const user = await userModel.findById(userId).select("isBlocked");
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      res.status(200).json({ isBlocked: user.isBlocked });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = UserController;