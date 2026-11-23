const compareRoutes = (routes, preference = 'balanced') => {
    const weights = {
        'lowest-carbon': { carbon: 0.7, time: 0.2, transfers: 0.1 },
        'fastest': { carbon: 0.2, time: 0.7, transfers: 0.1 },
        'balanced': { carbon: 0.4, time: 0.4, transfers: 0.2 }
    };

    const selectedWeights = weights[preference] || weights.balanced;

    if (!Array.isArray(routes) || routes.length === 0) {
        return [];
    }

    const maxCarbon = Math.max(...routes.map(r => r.carbonEmission), 1);
    const maxTime = Math.max(...routes.map(r => r.duration), 1);
    const maxTransfers = Math.max(...routes.map(r => r.transfers || 0), 1);

    const rankedRoutes = routes.map(route => {
        const carbonScore = route.carbonEmission / maxCarbon;
        const timeScore = route.duration / maxTime;
        const transferScore = (route.transfers || 0) / maxTransfers;

        const score =
            carbonScore * selectedWeights.carbon +
            timeScore * selectedWeights.time +
            transferScore * selectedWeights.transfers;

        return { ...route, score };
    });

    return rankedRoutes.sort((a, b) => a.score - b.score);
};

module.exports = compareRoutes;