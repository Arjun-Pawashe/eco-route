const express = require('express');
const router = express.Router();

const {
    saveJourney,
    getMyJourneys,
    deleteJourney
} = require('../controllers/journeyController');

const protect = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validationMiddleware');
const { saveJourneyValidator, journeyIdValidator } = require('../validators/journeyValidator');

router.post('/', protect, saveJourneyValidator, validateRequest, saveJourney);
router.get('/', protect, getMyJourneys);
router.delete('/:id', protect, journeyIdValidator, validateRequest, deleteJourney);

module.exports = router;