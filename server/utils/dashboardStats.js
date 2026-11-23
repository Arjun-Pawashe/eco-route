function computeDashboardStats(journeyRows = []) {
    const result = journeyRows.reduce(
        (total, journey) => ({
            totalJourneys: total.totalJourneys + 1,
            totalDistance: total.totalDistance + (Number(journey.distance) || 0),
            totalCarbonEmission: total.totalCarbonEmission + (Number(journey.carbonEmission) || 0),
            totalCarbonSaved: total.totalCarbonSaved + (Number(journey.carbonSaved) || 0)
        }),
        {
            totalJourneys: 0,
            totalDistance: 0,
            totalCarbonEmission: 0,
            totalCarbonSaved: 0
        }
    );

    const monthlyMap = new Map();
    const modeMap = new Map();
    const greenDates = new Set();

    for (const journey of journeyRows) {
        const createdDate = journey.createdAt ? new Date(journey.createdAt) : new Date();
        const date = Number.isNaN(createdDate.getTime())
            ? new Date().toISOString().slice(0, 10)
            : createdDate.toISOString().slice(0, 10);

        if ((Number(journey.carbonSaved) || 0) > 0) {
            greenDates.add(date);
        }

        const month = date.slice(0, 7);
        const monthly = monthlyMap.get(month) || {
            period: month,
            carbonEmission: 0,
            carbonSaved: 0
        };
        monthly.carbonEmission += Number(journey.carbonEmission) || 0;
        monthly.carbonSaved += Number(journey.carbonSaved) || 0;
        monthlyMap.set(month, monthly);

        const modeKey = journey.transportMode || 'unknown';
        const mode = modeMap.get(modeKey) || {
            mode: modeKey,
            journeys: 0,
            distance: 0
        };
        mode.journeys += 1;
        mode.distance += Number(journey.distance) || 0;
        modeMap.set(modeKey, mode);
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

    return {
        stats: {
            totalJourneys: result.totalJourneys,
            totalDistance: Number(result.totalDistance.toFixed(2)),
            totalCarbonEmission: Number(result.totalCarbonEmission.toFixed(2)),
            totalCarbonSaved: Number(result.totalCarbonSaved.toFixed(2))
        },
        charts: {
            timeSeries: [...monthlyMap.values()]
                .sort((a, b) => a.period.localeCompare(b.period))
                .map((row) => ({
                    ...row,
                    carbonEmission: Number(row.carbonEmission.toFixed(2)),
                    carbonSaved: Number(row.carbonSaved.toFixed(2))
                })),
            transportModes: [...modeMap.values()].map((row) => ({
                ...row,
                distance: Number(row.distance.toFixed(2))
            }))
        },
        greenStreak
    };
}

module.exports = { computeDashboardStats };
