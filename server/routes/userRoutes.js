const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
    getOrCreateProfile,
    updatePreferences,
    updateSavedPlaces
} = require('../controllers/userController');

router.get('/profile', requireAuth, getOrCreateProfile);
router.post('/profile', requireAuth, getOrCreateProfile);
router.put('/preferences', requireAuth, updatePreferences);
router.put('/saved-places', requireAuth, updateSavedPlaces);

module.exports = router;
