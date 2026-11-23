const express = require('express');
const router = express.Router();

const { updatePreferences, updateSavedPlaces } = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validationMiddleware');

const { preferenceValidator } = require('../validators/userValidator');

router.put(
    '/preferences',
    protect,
    preferenceValidator,
    validateRequest,
    updatePreferences
);
router.put('/places', protect, updateSavedPlaces);

module.exports = router;