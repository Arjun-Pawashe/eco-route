const { getUserJourneys } = require('../services/firestore');

const getDashboardStats = async (req, res) => {
    try {
        const journeyRows = await getUserJourneys(req.user.id);
        const result = journeyRows.reduce((total, journey) => ({
            totalJourneys: total.totalJourneys + 1,
            totalDistance: total.totalDistance + (journey.distance || 0),
            totalCarbonEmission: total.totalCarbonEmission + (journey.carbonEmission || 0),
            totalCarbonSaved: total.totalCarbonSaved + (journey.carbonSaved || 0)
        }), {
            totalJourneys: 0,
            totalDistance: 0,
            totalCarbonEmission: 0,
            totalCarbonSaved: 0
        });

        const monthlyMap = new Map();
        const modeMap = new Map();
        const greenDates = new Set();

        for (const journey of journeyRows) {
            const date = new Date(journey.createdAt).toISOString().slice(0, 10);
            if (journey.carbonSaved > 0) greenDates.add(date);

            const month = date.slice(0, 7);
            const monthly = monthlyMap.get(month) || { period: month, carbonEmission: 0, carbonSaved: 0 };
            monthly.carbonEmission += journey.carbonEmission || 0;
            monthly.carbonSaved += journey.carbonSaved || 0;
            monthlyMap.set(month, monthly);

            const mode = modeMap.get(journey.transportMode) || { mode: journey.transportMode, journeys: 0, distance: 0 };
            mode.journeys += 1;
            mode.distance += journey.distance || 0;
            modeMap.set(journey.transportMode, mode);
        }

        const orderedDates = [...greenDates].sort();
        let greenStreak = 0;
        let running = 0;
        let previous = null;
        for (const date of orderedDates) {
            const current = new Date(`${date}T00:00:00Z`);
            if (previous) {
                const gap = (current - previous) / 86400000;
                running = gap === 1 ? running + 1 : 1;
            } else {
                running = 1;
            }
            greenStreak = Math.max(greenStreak, running);
            previous = current;
        }

        res.status(200).json({
            success: true,
            stats: {
                totalJourneys: result.totalJourneys,
                totalDistance: Number(result.totalDistance.toFixed(2)),
                totalCarbonEmission: Number(result.totalCarbonEmission.toFixed(2)),
                totalCarbonSaved: Number(result.totalCarbonSaved.toFixed(2))
            },
            charts: {
                timeSeries: [...monthlyMap.values()].map(row => ({
                    ...row,
                    carbonEmission: Number(row.carbonEmission.toFixed(2)),
                    carbonSaved: Number(row.carbonSaved.toFixed(2))
                })),
                transportModes: [...modeMap.values()].map(row => ({
                    ...row,
                    distance: Number(row.distance.toFixed(2))
                }))
            },
            greenStreak
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
        });
    }
};

module.exports = { getDashboardStats };