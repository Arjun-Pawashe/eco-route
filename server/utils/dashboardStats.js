function computeBadgesAndGoal({
    stats,
    greenStreak,
    timeSeries = [],
    monthlyGoalKg = 25,
    currentMonth
}) {
    const monthKey = currentMonth || new Date().toISOString().slice(0, 7);
    const currentMonthEntry = timeSeries.find((row) => row.period === monthKey);
    const savedThisMonth = currentMonthEntry ? Number(currentMonthEntry.carbonSaved) || 0 : 0;

    const monthlyGoal = {
        month: monthKey,
        targetKg: monthlyGoalKg,
        savedKg: Number(savedThisMonth.toFixed(2)),
        percent:
            monthlyGoalKg > 0
                ? Math.min(100, Math.round((savedThisMonth / monthlyGoalKg) * 100))
                : 0
    };

    const badges = [
        {
            id: 'first-green-trip',
            label: 'First green trip',
            description: 'Save CO₂e on a recorded journey',
            earned: stats.totalCarbonSaved > 0
        },
        {
            id: 'streak-7',
            label: '7-day streak',
            description: 'Log green journeys 7 days in a row',
            earned: greenStreak >= 7
        },
        {
            id: 'saved-50kg',
            label: '50 kg saved',
            description: 'Save 50 kg of CO₂e across all journeys',
            earned: stats.totalCarbonSaved >= 50
        },
        {
            id: 'distance-100km',
            label: '100 km travelled',
            description: 'Track 100 km of journeys',
            earned: stats.totalDistance >= 100
        },
        {
            id: 'journeys-10',
            label: '10 journeys',
            description: 'Log 10 journeys in EcoRoute',
            earned: stats.totalJourneys >= 10
        }
    ];

    return { badges, monthlyGoal };
}

function computeDashboardStats(journeyRows = [], options = {}) {
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

    const stats = {
        totalJourneys: result.totalJourneys,
        totalDistance: Number(result.totalDistance.toFixed(2)),
        totalCarbonEmission: Number(result.totalCarbonEmission.toFixed(2)),
        totalCarbonSaved: Number(result.totalCarbonSaved.toFixed(2))
    };

    const timeSeries = [...monthlyMap.values()]
        .sort((a, b) => a.period.localeCompare(b.period))
        .map((row) => ({
            ...row,
            carbonEmission: Number(row.carbonEmission.toFixed(2)),
            carbonSaved: Number(row.carbonSaved.toFixed(2))
        }));

    const transportModes = [...modeMap.values()].map((row) => ({
        ...row,
        distance: Number(row.distance.toFixed(2))
    }));

    const { badges, monthlyGoal } = computeBadgesAndGoal({
        stats,
        greenStreak,
        timeSeries,
        monthlyGoalKg: options.monthlyGoalKg,
        currentMonth: options.currentMonth
    });

    return {
        stats,
        charts: {
            timeSeries,
            transportModes
        },
        greenStreak,
        badges,
        monthlyGoal
    };
}

module.exports = { computeDashboardStats, computeBadgesAndGoal };
