const User = require('../models/User');

// GET or POST /api/users/profile — finds or creates the MongoDB user profile for the Firebase UID
const getOrCreateProfile = async (req, res) => {
    try {
        const { uid, email, name: tokenName } = req.user;
        const bodyName = req.body?.name;

        let user = await User.findOne({ firebaseUid: uid });
        if (!user) {
            user = await User.create({
                firebaseUid: uid,
                name: bodyName || tokenName || (email ? email.split('@')[0] : 'EcoRoute User'),
                email: email || ''
            });
        } else if (bodyName && user.name !== bodyName) {
            user.name = bodyName;
            await user.save();
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to load user profile'
        });
    }
};

// PUT /api/users/preferences
const updatePreferences = async (req, res) => {
    try {
        const { travelPreference } = req.body;
        const validPreferences = ['lowest-carbon', 'balanced', 'fastest'];

        if (!validPreferences.includes(travelPreference)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid travel preference'
            });
        }

        const user = await User.findOneAndUpdate(
            { firebaseUid: req.user.uid },
            {
                $set: { travelPreference },
                $setOnInsert: {
                    firebaseUid: req.user.uid,
                    email: req.user.email || '',
                    name: req.user.name || 'EcoRoute User'
                }
            },
            { new: true, upsert: true }
        );

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

// PUT /api/users/saved-places
const updateSavedPlaces = async (req, res) => {
    try {
        const { savedPlaces } = req.body;
        if (!Array.isArray(savedPlaces)) {
            return res.status(400).json({
                success: false,
                message: 'savedPlaces must be an array'
            });
        }

        const user = await User.findOneAndUpdate(
            { firebaseUid: req.user.uid },
            {
                $set: { savedPlaces },
                $setOnInsert: {
                    firebaseUid: req.user.uid,
                    email: req.user.email || '',
                    name: req.user.name || 'EcoRoute User'
                }
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update saved places'
        });
    }
};

module.exports = {
    getOrCreateProfile,
    updatePreferences,
    updateSavedPlaces
};
