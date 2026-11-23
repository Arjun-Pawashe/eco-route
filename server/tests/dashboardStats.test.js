const test = require('node:test');
const assert = require('node:assert/strict');
const { computeDashboardStats } = require('../utils/dashboardStats');

test('computeDashboardStats handles empty journey list', () => {
    const result = computeDashboardStats([]);
    assert.deepEqual(result.stats, {
        totalJourneys: 0,
        totalDistance: 0,
        totalCarbonEmission: 0,
        totalCarbonSaved: 0
    });
    assert.deepEqual(result.charts, { timeSeries: [], transportModes: [] });
    assert.equal(result.greenStreak, 0);
});

test('computeDashboardStats aggregates totals, charts, and green streak', () => {
    const journeys = [
        {
            transportMode: 'metro',
            distance: 10,
            carbonEmission: 0.35,
            carbonSaved: 1.35,
            createdAt: '2026-11-20T10:00:00.000Z'
        },
        {
            transportMode: 'bus',
            distance: 5,
            carbonEmission: 0.4,
            carbonSaved: 0.45,
            createdAt: '2026-11-21T10:00:00.000Z'
        },
        {
            transportMode: 'metro',
            distance: 12,
            carbonEmission: 0.42,
            carbonSaved: 1.62,
            createdAt: '2026-11-22T10:00:00.000Z'
        },
        {
            transportMode: 'car',
            distance: 8,
            carbonEmission: 1.36,
            carbonSaved: 0,
            createdAt: '2026-11-23T10:00:00.000Z'
        }
    ];

    const result = computeDashboardStats(journeys);
    assert.equal(result.stats.totalJourneys, 4);
    assert.equal(result.stats.totalDistance, 35);
    assert.equal(result.stats.totalCarbonEmission, 2.53);
    assert.equal(result.stats.totalCarbonSaved, 3.42);
    assert.equal(result.greenStreak, 3);
    assert.equal(result.charts.timeSeries.length, 1);
    assert.equal(result.charts.timeSeries[0].period, '2026-11');
    assert.equal(result.charts.transportModes.length, 3);
});
