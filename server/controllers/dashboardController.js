const Journey = require('../models/Journey');
const { computeDashboardStats } = require('../utils/dashboardStats');

const getDashboardStats = async (req, res) => {
    try {
        const journeyRows = await Journey.find({ userId: req.user.uid }).lean();
        const computed = computeDashboardStats(journeyRows);

        res.status(200).json({
            success: true,
            ...computed
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
        });
    }
};

module.exports = { getDashboardStats };
