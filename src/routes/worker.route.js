const express = require('express');
const router = express.Router();
const workerController = require('../controllers/worker.ctrl');
const Auth = require('../middleware/Authentication');
const RoleValidation = require('../middleware/RoleValidation');
const { handleImageUpload, handleUploadMultipleFiles } = require('../middleware/ImageUpload')

router.get('/onboarding-status', Auth, workerController.checkOnboardingStatus);
router.post('/create-profile', handleUploadMultipleFiles(['IdProof', 'Certification', 'ProfileImage']), workerController.CreateProfile);
router.put('/update-profile', Auth, RoleValidation(['worker']), handleImageUpload('IdProof'), workerController.UpdateProfile);
router.put('/add-gallery', Auth, RoleValidation(['worker']), handleImageUpload('image'), workerController.AddGallery);
router.delete('/remove-gallery-image/:imageUrl', Auth, RoleValidation(['worker']), workerController.RemoveGalleryImage);
router.get('/profile/worker', Auth, RoleValidation(['worker']), workerController.getProfile);
router.get('/get-worker/:id', workerController.getProfileById);
router.delete('/delete-profile', Auth, RoleValidation(['worker']), workerController.DeleteAccount);
router.post('/set-service-areas', workerController.setServiceAreas);
router.get('/stats', Auth, RoleValidation(['worker']), workerController.getWorkerStats);
router.get('/top-workers', Auth, workerController.TopWorkers);
router.put('/:userId/verify', Auth, RoleValidation(['admin']), workerController.VerifyWorker);
//admin routes
router.get('/get-all-workers', Auth, RoleValidation(['admin', 'worker']), workerController.GetAllWorkers);

module.exports = router;