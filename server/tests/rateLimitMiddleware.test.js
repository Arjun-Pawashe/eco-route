const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

function createMockRes() {
    return {
        statusCode: 200,
        headers: {},
        body: null,
        setHeader(name, value) {
            this.headers[name] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
}

test('createRateLimiter allows requests up to max and blocks excess with 429', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 2 });
    const req = { ip: '127.0.0.1', headers: {} };

    let nextCalls = 0;
    const next = () => {
        nextCalls += 1;
    };

    const res1 = createMockRes();
    limiter(req, res1, next);
    assert.equal(nextCalls, 1);
    assert.equal(res1.headers['RateLimit-Remaining'], '1');

    const res2 = createMockRes();
    limiter(req, res2, next);
    assert.equal(nextCalls, 2);
    assert.equal(res2.headers['RateLimit-Remaining'], '0');

    const res3 = createMockRes();
    limiter(req, res3, next);
    assert.equal(nextCalls, 2);
    assert.equal(res3.statusCode, 429);
    assert.equal(res3.body.success, false);
});
