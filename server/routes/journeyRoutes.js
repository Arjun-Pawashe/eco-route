const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const {
    saveJourney,
    getMyJourneys,
    deleteJourney
} = require('../controllers/journeyController');

router.post('/', requireAuth, saveJourney);
router.get('/', requireAuth, getMyJourneys);
router.delete('/:id', requireAuth, deleteJourney);

module.exports = router;
