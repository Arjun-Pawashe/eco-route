import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEmissionResults,
  decodePolyline,
  rankEmissionResults
} from '../src/utils/carbonCalculator.js';

test('decodePolyline decodes encoded polyline5 coordinates', () => {
  const pts = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
  assert.equal(pts.length, 3);
  assert.ok(Math.abs(pts[0].lat - 38.5) < 0.001);
  assert.ok(Math.abs(pts[0].lng - -120.2) < 0.001);
});

test('calculateEmissionResults & rankEmissionResults compute and rank modes', () => {
  const modes = [
    { name: 'Car', mode: 'car', factor: 0.17 },
    { name: 'Bicycle', mode: 'bike', factor: 0 },
    { name: 'Auto-rickshaw', mode: 'auto-rickshaw', factor: 0.09 }
  ];
  const routeOptions = {
    car: { distance: 10, duration: 25 },
    bike: { distance: 9.5, duration: 35 },
    foot: null
  };

  const results = calculateEmissionResults({
    transportModes: modes,
    routeOptions,
    baselineVehicle: 'petrol-car'
  });

  assert.equal(results.length, 3);

  const auto = results.find((r) => r.mode === 'auto-rickshaw');
  assert.equal(auto.cost, '190');

  const lowestCarbon = rankEmissionResults(results, 'lowest-carbon');
  assert.equal(lowestCarbon[0].mode, 'bike');

  const fastest = rankEmissionResults(results, 'fastest');
  assert.equal(fastest[0].mode, 'car');
});
