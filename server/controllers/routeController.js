const { calculateCarbon } = require('../utils/carbonCalculator');
const compareRoutes = require('../utils/routeComparator');
const { getUser } = require('../services/firestore');

const planRoute = async (req, res) => {
    try {
        const { origin, destination, preference } = req.body;
        const user = await getUser(req.user.id);
        const effectivePreference = preference || user?.travelPreference || 'balanced';

        if (!origin || !destination) {
            return res.status(400).json({
                success: false,
                message: 'Origin and destination are required'
            });
        }

        // Sample routes for initial development
        const sampleRoutes = [
            {
                routeName: 'Bus Route',
                transportMode: 'bus',
                distance: 10,
                duration: 35,
                transfers: 1
            },
            {
                routeName: 'Metro Route',
                transportMode: 'metro',
                distance: 12,
                duration: 25,
                transfers: 0
            },
            {
                routeName: 'Car Route',
                transportMode: 'car',
                distance: 9,
                duration: 20,
                transfers: 0
            }
        ];

        const routesWithCarbon = sampleRoutes.map(route => ({
            ...route,
            carbonEmission: calculateCarbon(
                route.transportMode,
                route.distance
            )
        }));

        const rankedRoutes = compareRoutes(
            routesWithCarbon,
            effectivePreference
        );

        res.status(200).json({
            success: true,
            origin,
            destination,
            preference: effectivePreference,
            routes: rankedRoutes
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Route planning failed',
            error: error.message
        });
    }
};

module.exports = { planRoute };