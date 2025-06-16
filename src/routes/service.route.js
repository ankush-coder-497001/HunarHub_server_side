const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/service.ctrl');
const Auth = require('../middleware/Authentication');
const RoleValidation = require('../middleware/RoleValidation');


router.get('/all', Auth, RoleValidation(['admin', 'worker', 'customer']), ServiceController.getAllServices);
router.get('/:workerId', ServiceController.getServiceByWorkerId);
router.post('/add', Auth, RoleValidation(['admin', 'worker']), ServiceController.addNewService);
router.put('/update/:id', Auth, RoleValidation(['admin', 'worker']), ServiceController.updateService);
router.delete('/delete/:id', Auth, RoleValidation(['admin', 'worker']), ServiceController.deleteService);

module.exports = router;