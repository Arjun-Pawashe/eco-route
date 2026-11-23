const express = require('express');
const router = express.Router();

const {
    saveJourney,
    getMyJourneys,
    deleteJourney
} = require('../controllers/journeyController');

const protect = require('../middleware/authMiddleware');

router.post('/', protect, saveJourney);
router.get('/', protect, getMyJourneys);
router.delete('/:id', protect, deleteJourney);

module.exports = router;