const { updateUser } = require('../services/firestore');

// Update user travel preference
const updatePreferences = async (req, res) => {
    try {
        const { travelPreference } = req.body;

        const validPreferences = [
            'lowest-carbon',
            'balanced',
            'fastest'
        ];

        if (!validPreferences.includes(travelPreference)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid travel preference'
            });
        }

        const user = await updateUser(req.user.id, { travelPreference });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const { password, ...publicUser } = user;
        res.status(200).json({
            success: true,
            message: 'Preferences updated successfully',
            user: publicUser
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update preferences'
        });
    }
};

const updateSavedPlaces = async (req, res) => {
    try {
        const { savedPlaces } = req.body;
        if (!Array.isArray(savedPlaces)) {
            return res.status(400).json({ success: false, message: 'savedPlaces must be an array' });
        }
        const user = await updateUser(req.user.id, { savedPlaces });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const { password, ...publicUser } = user;
        res.status(200).json({ success: true, user: publicUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update saved places' });
    }
};

module.exports = { updatePreferences, updateSavedPlaces };