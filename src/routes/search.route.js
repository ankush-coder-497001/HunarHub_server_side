const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/search.ctrl');

router.get('/nearby', SearchController.GetWorkersByXkmRadius);
router.get('/workers', SearchController.searchWorkers);

module.exports = router;