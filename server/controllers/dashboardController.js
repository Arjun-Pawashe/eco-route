const Journey = require('../models/Journey');

const getDashboardStats = async (req, res) => {
    try {
        const stats = await Journey.aggregate([
            {
                $match: {
                    user: req.user.id
                }
            },
            {
                $group: {
                    _id: null,
                    totalJourneys: { $sum: 1 },
                    totalDistance: { $sum: '$distance' },
                    totalCarbonEmission: { $sum: '$carbonEmission' },
                    totalCarbonSaved: { $sum: '$carbonSaved' }
                }
            }
        ]);

        const result = stats[0] || {
            totalJourneys: 0,
            totalDistance: 0,
            totalCarbonEmission: 0,
            totalCarbonSaved: 0
        };

        res.status(200).json({
            success: true,
            stats: {
                totalJourneys: result.totalJourneys,
                totalDistance: Number(result.totalDistance.toFixed(2)),
                totalCarbonEmission: Number(result.totalCarbonEmission.toFixed(2)),
                totalCarbonSaved: Number(result.totalCarbonSaved.toFixed(2))
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
        });
    }
};

module.exports = { getDashboardStats };