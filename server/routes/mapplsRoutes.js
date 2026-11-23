const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/authMiddleware');
const {
    getClientToken,
    searchLocations,
    getRoutes
} = require('../controllers/mapplsController');

router.get('/token', getClientToken);
router.get('/search', requireAuth, searchLocations);
router.post('/routes', requireAuth, getRoutes);

module.exports = router;
