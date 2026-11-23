function createRateLimiter({
    windowMs = 15 * 60 * 1000,
    max = 60,
    message = 'Too many requests, please try again later.'
} = {}) {
    const hits = new Map();

    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';

        // Prune expired entries when map grows to avoid unbounded memory usage
        if (hits.size > 1000) {
            for (const [entryKey, entry] of hits.entries()) {
                if (now >= entry.resetAt) {
                    hits.delete(entryKey);
                }
            }
        }

        let record = hits.get(key);
        if (!record || now >= record.resetAt) {
            record = { count: 0, resetAt: now + windowMs };
            hits.set(key, record);
        }

        record.count += 1;

        const remaining = Math.max(0, max - record.count);
        const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

        res.setHeader('RateLimit-Limit', String(max));
        res.setHeader('RateLimit-Remaining', String(remaining));
        res.setHeader('RateLimit-Reset', String(resetSeconds));

        if (record.count > max) {
            return res.status(429).json({
                success: false,
                message
            });
        }

        return next();
    };
}

module.exports = { createRateLimiter };
