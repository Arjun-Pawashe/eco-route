const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/authMiddleware');
const {
    getClientConfig,
    searchLocations,
    getRoutes
} = require('../controllers/mapsController');

router.get('/config', getClientConfig);
router.get('/search', requireAuth, searchLocations);
router.post('/routes', requireAuth, getRoutes);

module.exports = router;
