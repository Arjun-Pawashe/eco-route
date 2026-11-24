import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMISSION_FACTORS,
  calculateEmissionResults,
  calculateRouteEmission,
  computeCarbonEquivalents,
  decodePolyline,
  rankEmissionResults
} from '../src/utils/carbonCalculator.js';

test('decodePolyline decodes encoded polyline5 coordinates', () => {
  const pts = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
  assert.equal(pts.length, 3);
  assert.ok(Math.abs(pts[0].lat - 38.5) < 0.001);
  assert.ok(Math.abs(pts[0].lng - -120.2) < 0.001);
});

test('calculateRouteEmission increases CO2e under live traffic delay', () => {
  const freeFlow = calculateRouteEmission({
    distanceKm: 10,
    durationMin: 20,
    staticDurationMin: 20,
    trafficDelayMinutes: 0,
    congestionRatio: 1,
    mode: 'car',
    factor: EMISSION_FACTORS.car
  });
  const congested = calculateRouteEmission({
    distanceKm: 10,
    durationMin: 35,
    staticDurationMin: 20,
    trafficDelayMinutes: 15,
    congestionRatio: 1.75,
    mode: 'car',
    factor: EMISSION_FACTORS.car
  });

  assert.ok(Math.abs(freeFlow.baseEmission - 1.7) < 0.001);
  assert.equal(freeFlow.trafficImpact, 0);
  assert.ok(congested.totalEmission > freeFlow.totalEmission);
  assert.ok(congested.trafficImpact > 0);
});

test('calculateEmissionResults & rankEmissionResults handle multi-route arrays and traffic', () => {
  const modes = [
    { name: 'Bus', mode: 'bus', factor: EMISSION_FACTORS.bus },
    { name: 'Car', mode: 'car', factor: EMISSION_FACTORS.car },
    { name: 'Bicycle', mode: 'bike', factor: EMISSION_FACTORS.bike },
    {
      name: 'Auto-rickshaw',
      mode: 'auto-rickshaw',
      factor: EMISSION_FACTORS['auto-rickshaw']
    }
  ];
  const routeOptions = {
    car: [
      {
        id: 'route-1',
        summary: 'NH 48',
        distance: 10,
        duration: 30,
        staticDuration: 20,
        trafficDelayMinutes: 10,
        congestionRatio: 1.5,
        trafficStatus: 'heavy'
      },
      {
        id: 'route-2',
        summary: 'Bypass Rd',
        distance: 11,
        duration: 22,
        staticDuration: 21,
        trafficDelayMinutes: 1,
        congestionRatio: 1.05,
        trafficStatus: 'light'
      }
    ],
    bike: [{ id: 'bike-1', distance: 9.5, duration: 20 }],
    foot: []
  };

  const results = calculateEmissionResults({
    transportModes: modes,
    routeOptions,
    selectedRouteIndices: { car: 0, bike: 0 },
    baselineVehicle: 'petrol-car'
  });

  assert.equal(results.length, 4);

  const car = results.find((r) => r.mode === 'car');
  assert.equal(car.trafficStatus, 'heavy');
  assert.equal(car.trafficDelayMinutes, 10);
  assert.ok(Number(car.trafficImpact) > 0);

  const bike = results.find((r) => r.mode === 'bike');
  assert.equal(bike.duration, 20);
  assert.equal(bike.emission, '0.00');

  const lowestCarbon = rankEmissionResults(results, 'lowest-carbon');
  assert.equal(lowestCarbon[0].mode, 'bike');
});

test('computeCarbonEquivalents calculates approximate trees, phone charges, and petrol avoided', () => {
  const eq = computeCarbonEquivalents(21);
  assert.equal(eq.trees, '1.0');
  assert.equal(eq.phoneCharges, 2625);
  assert.equal(eq.petrolLiters, '9.1');
});
