const express = require('express');
const router = express.Router();

const {
    getClientToken,
    searchLocations,
    getRoutes
} = require('../controllers/mapplsController');

router.get('/token', getClientToken);
router.get('/search', searchLocations);
router.post('/routes', getRoutes);

module.exports = router;
