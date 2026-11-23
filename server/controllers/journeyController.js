const Journey = require('../models/Journey');

// POST: Save a journey
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

        const journey = await Journey.create({
            user: req.user.id,
            origin,
            destination,
            transportMode,
            distance,
            duration,
            carbonEmission,
            carbonSaved,
            preference,
            legs
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

// GET: Retrieve logged-in user's journeys
const getMyJourneys = async (req, res) => {
    try {
        const journeys = await Journey.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

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

// DELETE: Delete a saved journey
const deleteJourney = async (req, res) => {
    try {
        const journey = await Journey.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!journey) {
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