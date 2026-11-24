const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getClientConfig,
  searchLocations,
  getRoutes,
  parseDurationSeconds
} = require('../controllers/mapsController');

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

test('parseDurationSeconds parses Google Routes duration strings', () => {
  assert.equal(parseDurationSeconds('1540s'), 1540);
  assert.equal(parseDurationSeconds('42.5s'), 42.5);
  assert.equal(parseDurationSeconds(120), 120);
  assert.equal(parseDurationSeconds('invalid'), 0);
});

test('getClientConfig reports Google Maps server key status', async () => {
  const prev = process.env.GOOGLE_MAPS_API_KEY;
  process.env.GOOGLE_MAPS_API_KEY = 'test-google-key';
  try {
    const res = mockRes();
    await getClientConfig({}, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      success: true,
      provider: 'google-maps',
      hasServerKey: true
    });
  } finally {
    if (prev === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = prev;
  }
});

test('searchLocations returns 400 when query is missing', async () => {
  const res = mockRes();
  await searchLocations({ query: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('searchLocations returns 503 when GOOGLE_MAPS_API_KEY is missing', async () => {
  const prevKey = process.env.GOOGLE_MAPS_API_KEY;
  delete process.env.GOOGLE_MAPS_API_KEY;
  try {
    const res = mockRes();
    await searchLocations({ query: { query: 'Swargate' } }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.success, false);
  } finally {
    if (prevKey !== undefined) process.env.GOOGLE_MAPS_API_KEY = prevKey;
  }
});

test('searchLocations maps Google Places (New) results when fetch succeeds', async () => {
  const prevKey = process.env.GOOGLE_MAPS_API_KEY;
  const prevFetch = global.fetch;
  process.env.GOOGLE_MAPS_API_KEY = 'test-google-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      places: [
        {
          id: 'ChIJ123',
          displayName: { text: 'Swargate' },
          formattedAddress: 'Swargate, Pune, Maharashtra, India',
          location: { latitude: 18.5018, longitude: 73.8636 }
        }
      ]
    })
  });

  try {
    const res = mockRes();
    await searchLocations({ query: { query: 'Swargate' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.results.length, 1);
    assert.deepEqual(res.body.results[0], {
      id: 'ChIJ123',
      name: 'Swargate, Pune, Maharashtra, India',
      shortName: 'Swargate',
      address: 'Swargate, Pune, Maharashtra, India',
      lat: 18.5018,
      lon: 73.8636
    });
  } finally {
    global.fetch = prevFetch;
    if (prevKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = prevKey;
  }
});

test('getRoutes returns 400 when coordinates are missing', async () => {
  const res = mockRes();
  await getRoutes({ body: { origin: { lat: 18.5 } } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('getRoutes returns road alternatives and only matching transit services', async () => {
  const prevKey = process.env.GOOGLE_MAPS_API_KEY;
  const prevFetch = global.fetch;
  process.env.GOOGLE_MAPS_API_KEY = 'test-google-key';
  const transitRequests = [];
  global.fetch = async (_, options) => {
    const request = JSON.parse(options.body);
    if (request.travelMode === 'TRANSIT') {
      const allowedMode = request.transitPreferences.allowedTravelModes[0];
      transitRequests.push({
        allowedMode,
        fieldMask: options.headers['X-Goog-FieldMask']
      });

      const transitData = {
        BUS: {
          vehicleType: 'BUS',
          agency: 'Pune Mahanagar Parivahan Mahamandal Limited (PMPML)',
          lineName: '42'
        },
        SUBWAY: {
          vehicleType: 'METRO_RAIL',
          agency: 'Maha Metro',
          lineName: 'Aqua Line'
        },
        TRAIN: {
          vehicleType: 'COMMUTER_TRAIN',
          agency: 'Indian Railways',
          lineName: 'Pune Local'
        }
      }[allowedMode];
      const buildTransitRoute = (vehicleType, lineName, agency) => ({
        description: lineName,
        distanceMeters: 9000,
        duration: '2400s',
        polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC' },
        legs: [
          {
            steps: [
              {
                distanceMeters: 8000,
                transitDetails: {
                  transitLine: {
                    name: lineName,
                    nameShort: lineName,
                    vehicle: { type: vehicleType },
                    agencies: [{ name: agency }]
                  },
                  stopDetails: {
                    departureStop: { name: 'Origin Stop' },
                    arrivalStop: { name: 'Destination Stop' }
                  }
                }
              }
            ]
          }
        ]
      });
      const unsupportedVehicleType = {
        BUS: 'METRO_RAIL',
        SUBWAY: 'BUS',
        TRAIN: 'BUS'
      }[allowedMode];

      return {
        ok: true,
        json: async () => ({
          routes: [
            buildTransitRoute(
              transitData.vehicleType,
              transitData.lineName,
              transitData.agency
            ),
            buildTransitRoute(unsupportedVehicleType, 'Other Line', 'Other Agency')
          ]
        })
      };
    }

    return {
      ok: true,
      json: async () => ({
        routes: [
          {
            description: 'NH 48',
            routeLabels: ['DEFAULT_ROUTE'],
            distanceMeters: 12500,
            duration: '1800s',
            staticDuration: '1200s',
            polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC' },
            travelAdvisory: {
              speedReadingIntervals: [
                { startPolylinePointIndex: 0, endPolylinePointIndex: 1, speed: 'SLOW' }
              ]
            }
          },
          {
            description: 'Baner Rd',
            routeLabels: ['FUEL_EFFICIENT'],
            distanceMeters: 13200,
            duration: '1500s',
            staticDuration: '1380s',
            polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC' }
          }
        ]
      })
    };
  };

  try {
    const res = mockRes();
    await getRoutes(
      {
        body: {
          origin: { lat: 18.5018, lon: 73.8636 },
          destination: { lat: 18.5913, lon: 73.7389 }
        }
      },
      res
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.failedModes, []);
    assert.equal(res.body.routes.car.length, 2);
    assert.equal(res.body.routes.car[0].distance, 12.5);
    assert.equal(res.body.routes.car[0].duration, 30);
    assert.equal(res.body.routes.car[0].staticDuration, 20);
    assert.equal(res.body.routes.car[0].trafficDelayMinutes, 10);
    assert.equal(res.body.routes.car[0].congestionRatio, 1.5);
    assert.equal(res.body.routes.car[0].trafficStatus, 'heavy');
    assert.equal(res.body.routes.car[1].summary, 'Baner Rd');
    assert.equal(res.body.routes.car[1].trafficStatus, 'light');
    assert.equal(res.body.routes.bus.length, 1);
    assert.equal(res.body.routes.metro.length, 1);
    assert.equal(res.body.routes.train.length, 1);
    assert.equal(res.body.routes.bus[0].transitDistance, 8);
    assert.match(res.body.routes.bus[0].transitSummary, /PMPML.*42/);
    assert.equal(res.body.routes.metro[0].transitSegments[0].vehicleType, 'METRO_RAIL');
    assert.match(res.body.routes.metro[0].transitAgencies[0], /Maha Metro/);
    assert.equal(res.body.routes.train[0].transitSegments[0].vehicleType, 'COMMUTER_TRAIN');
    assert.deepEqual(
      transitRequests.map((request) => request.allowedMode).sort(),
      ['BUS', 'SUBWAY', 'TRAIN']
    );
    assert.ok(
      transitRequests.every((request) =>
        request.fieldMask.includes(
          'routes.legs.steps.transitDetails.transitLine.vehicle.type'
        )
      )
    );
  } finally {
    global.fetch = prevFetch;
    if (prevKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = prevKey;
  }
});
