const User = require('../models/User');

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

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { travelPreference },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Preferences updated successfully',
            user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update preferences'
        });
    }
};

module.exports = { updatePreferences };