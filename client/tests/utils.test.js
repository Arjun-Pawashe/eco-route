import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMISSION_FACTORS,
  calculateEmissionResults,
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

test('calculateEmissionResults & rankEmissionResults compute duration and rank modes', () => {
  const modes = [
    { name: 'Bus', mode: 'bus', factor: EMISSION_FACTORS.bus },
    { name: 'Car', mode: 'car', factor: EMISSION_FACTORS.car },
    { name: 'Bicycle', mode: 'bike', factor: EMISSION_FACTORS.bike },
    { name: 'Auto-rickshaw', mode: 'auto-rickshaw', factor: EMISSION_FACTORS['auto-rickshaw'] }
  ];
  const routeOptions = {
    car: { distance: 10, duration: 25 },
    bike: { distance: 9.5, duration: 20 },
    foot: null
  };

  const results = calculateEmissionResults({
    transportModes: modes,
    routeOptions,
    baselineVehicle: 'petrol-car'
  });

  assert.equal(results.length, 4);

  const auto = results.find((r) => r.mode === 'auto-rickshaw');
  assert.equal(auto.cost, '190');
  assert.equal(auto.duration, 25);
  assert.equal(auto.approximateDuration, true);

  const bus = results.find((r) => r.mode === 'bus');
  assert.equal(bus.duration, 35);
  assert.equal(bus.approximateDuration, true);

  const bike = results.find((r) => r.mode === 'bike');
  assert.equal(bike.duration, 20);
  assert.equal(bike.approximateDuration, false);

  const lowestCarbon = rankEmissionResults(results, 'lowest-carbon');
  assert.equal(lowestCarbon[0].mode, 'bike');

  const fastest = rankEmissionResults(results, 'fastest');
  assert.equal(fastest[0].mode, 'bike');
  assert.equal(fastest[fastest.length - 1].mode, 'bus');
});

test('computeCarbonEquivalents calculates approximate trees, phone charges, and petrol avoided', () => {
  const eq = computeCarbonEquivalents(21);
  assert.equal(eq.trees, '1.0');
  assert.equal(eq.phoneCharges, 2625);
  assert.equal(eq.petrolLiters, '9.1');

  const zero = computeCarbonEquivalents(-5);
  assert.equal(zero.trees, '0.0');
  assert.equal(zero.phoneCharges, 0);
});
