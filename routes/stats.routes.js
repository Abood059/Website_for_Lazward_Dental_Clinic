const express = require('express');
const statsController = require('../controllers/stats.controller');

const router = express.Router();

// Public endpoint — no authentication required
router.get('/', statsController.getStats);

module.exports = router;
