const express = require('express');
const router = express.Router();

const {
    saveJourney,
    getMyJourneys,
    deleteJourney
} = require('../controllers/journeyController');

const protect = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validationMiddleware');

const {
    saveJourneyValidator,
    journeyIdValidator
} = require('../validators/journeyValidator');

// Save journey
router.post(
    '/',
    protect,
    saveJourneyValidator,
    validateRequest,
    saveJourney
);

// Get logged-in user's journeys
router.get('/', protect, getMyJourneys);

// Delete journey
router.delete(
    '/:id',
    protect,
    journeyIdValidator,
    validateRequest,
    deleteJourney
);

module.exports = router;