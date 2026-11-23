const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

router.get('/stats', requireAuth, getDashboardStats);

module.exports = router;
