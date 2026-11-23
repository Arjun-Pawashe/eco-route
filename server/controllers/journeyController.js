const Journey = require('../models/Journey');

// POST /api/journeys
const saveJourney = async (req, res) => {
    try {
        const {
            origin,
            destination,
            transportMode,
            distance,
            duration,
            carbonEmission,
            carbonSaved,
            preference,
            legs
        } = req.body;

        if (!origin?.name || !destination?.name || !transportMode) {
            return res.status(400).json({
                success: false,
                message: 'Origin, destination, and transportMode are required'
            });
        }

        const journey = await Journey.create({
            userId: req.user.uid,
            origin,
            destination,
            transportMode,
            distance: Number(distance) || 0,
            duration: Number(duration) || 0,
            carbonEmission: Number(carbonEmission) || 0,
            carbonSaved: Number(carbonSaved) || 0,
            preference: preference || 'balanced',
            legs: Array.isArray(legs) ? legs : []
        });

        res.status(201).json({
            success: true,
            message: 'Journey saved successfully',
            journey
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to save journey',
            error: error.message
        });
    }
};

// GET /api/journeys
const getMyJourneys = async (req, res) => {
    try {
        const journeys = await Journey.find({ userId: req.user.uid })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: journeys.length,
            journeys
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve journeys'
        });
    }
};

// DELETE /api/journeys/:id
const deleteJourney = async (req, res) => {
    try {
        const deleted = await Journey.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.uid
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Journey not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Journey deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete journey'
        });
    }
};

module.exports = {
    saveJourney,
    getMyJourneys,
    deleteJourney
};
