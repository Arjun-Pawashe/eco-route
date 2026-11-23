const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getClientToken,
  searchLocations,
  getRoutes
} = require('../controllers/mapplsController');

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

test('getClientToken returns MAPPLS_STATIC_KEY when set', async () => {
  const prev = process.env.MAPPLS_STATIC_KEY;
  process.env.MAPPLS_STATIC_KEY = 'test-static-key';
  try {
    const res = mockRes();
    await getClientToken({}, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { success: true, accessToken: 'test-static-key' });
  } finally {
    if (prev === undefined) delete process.env.MAPPLS_STATIC_KEY;
    else process.env.MAPPLS_STATIC_KEY = prev;
  }
});

test('searchLocations returns 400 when query is missing', async () => {
  const res = mockRes();
  await searchLocations({ query: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('searchLocations maps Mappls results when fetch succeeds', async () => {
  const prevKey = process.env.MAPPLS_STATIC_KEY;
  const prevFetch = global.fetch;
  process.env.MAPPLS_STATIC_KEY = 'test-static-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      suggestedLocations: [
        {
          placeName: 'Swargate',
          placeAddress: 'Pune, Maharashtra',
          latitude: '18.5018',
          longitude: '73.8636',
          eLoc: 'ABC123'
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
      name: 'Swargate, Pune, Maharashtra',
      lat: 18.5018,
      lon: 73.8636,
      eLoc: 'ABC123'
    });
  } finally {
    global.fetch = prevFetch;
    if (prevKey === undefined) delete process.env.MAPPLS_STATIC_KEY;
    else process.env.MAPPLS_STATIC_KEY = prevKey;
  }
});

test('getRoutes returns 400 when coordinates are missing', async () => {
  const res = mockRes();
  await getRoutes({ body: { origin: { lat: 18.5 } } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('getRoutes returns car, bike, and foot routes from Mappls', async () => {
  const prevKey = process.env.MAPPLS_STATIC_KEY;
  const prevFetch = global.fetch;
  process.env.MAPPLS_STATIC_KEY = 'test-static-key';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      routes: [
        {
          distance: 12500,
          duration: 1500,
          geometry: '_p~iF~ps|U_ulLnnqC'
        }
      ]
    })
  });

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
    assert.equal(res.body.routes.car.distance, 12.5);
    assert.equal(res.body.routes.car.duration, 25);
    assert.equal(res.body.routes.bike.distance, 12.5);
    assert.equal(res.body.routes.foot.distance, 12.5);
  } finally {
    global.fetch = prevFetch;
    if (prevKey === undefined) delete process.env.MAPPLS_STATIC_KEY;
    else process.env.MAPPLS_STATIC_KEY = prevKey;
  }
});
