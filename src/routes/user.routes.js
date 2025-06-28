const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.ctrl')
const RoleValidation = require('../middleware/RoleValidation')
const Auth = require('../middleware/Authentication');
const { handleImageUpload } = require('../middleware/ImageUpload');

//auth routes for user (worker/customer)
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/send-otp', userController.sendOtp);
router.post('/verify-otp', userController.verifyOtp);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', Auth, userController.resetPassword);
router.put('/update-fcm-token', Auth, userController.SaveFCMToken);

//user profile routes (can use for both worker and customer)
router.get('/profile', Auth, userController.profile);
router.put('/profile', Auth, handleImageUpload('profileImage'), userController.UpdateProfile);
router.put('/update-location', Auth, userController.UpdateLocation);
router.put('/delete-account', Auth, userController.DeleteAccount);
router.put('/:userId/status', Auth, RoleValidation(['admin']), userController.UpdateStatus);

//admin routes
router.get('/customers', Auth, RoleValidation(['admin']), userController.GetAllUsers);
router.get('/blocked', Auth, userController.GetAccountBlockStatus);

module.exports = router;
