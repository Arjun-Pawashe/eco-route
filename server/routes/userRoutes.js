const express = require('express');
const router = express.Router();

const { updatePreferences } = require('../controllers/userController');
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

module.exports = router;