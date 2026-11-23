const { createJourney, getUserJourneys, deleteUserJourney } = require('../services/firestore');

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

        const journey = await createJourney({
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
        const journeys = await getUserJourneys(req.user.id);

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
        const deleted = await deleteUserJourney(req.params.id, req.user.id);

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