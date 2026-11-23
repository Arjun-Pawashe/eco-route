let cachedToken = null;
let tokenExpiresAt = 0;

async function getMapplsAuth() {
    if (process.env.MAPPLS_STATIC_KEY) {
        return { token: process.env.MAPPLS_STATIC_KEY.trim(), isStatic: true };
    }

    if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
        return { token: cachedToken, isStatic: false };
    }

    const clientId = process.env.MAPPLS_CLIENT_ID;
    const clientSecret = process.env.MAPPLS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            'MAPPLS_STATIC_KEY (or MAPPLS_CLIENT_ID and MAPPLS_CLIENT_SECRET) must be set in server/.env'
        );
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const response = await fetch(
        'https://outpost.mappls.com/api/security/oauth/token',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json'
            },
            body: params.toString()
        }
    );

    const data = await response.json();
    if (!response.ok || !data.access_token) {
        throw new Error(
            data.error_description || 'Failed to authenticate with Mappls'
        );
    }

    cachedToken = data.access_token;
    const expiresInMs = (data.expires_in || 86400) * 1000;
    tokenExpiresAt = Date.now() + expiresInMs;

    return { token: cachedToken, isStatic: false };
}

// GET /api/mappls/token
const getClientToken = async (req, res) => {
    try {
        const { token } = await getMapplsAuth();
        res.status(200).json({ success: true, accessToken: token });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch Mappls access token'
        });
    }
};

// GET /api/mappls/search?query=...
const searchLocations = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter is required'
            });
        }

        const { token, isStatic } = await getMapplsAuth();
        const url = new URL('https://atlas.mappls.com/api/places/search/json');
        url.searchParams.set('query', query.trim());
        url.searchParams.set('region', 'IND');
        url.searchParams.set('access_token', token);

        const headers = isStatic ? {} : { Authorization: `Bearer ${token}` };
        const response = await fetch(url.toString(), { headers });

        const data = await response.json();
        if (!response.ok) {
            const fallbackUrl = new URL('https://nominatim.openstreetmap.org/search');
            fallbackUrl.searchParams.set('format', 'json');
            fallbackUrl.searchParams.set('q', query.trim());
            fallbackUrl.searchParams.set('countrycodes', 'in');
            fallbackUrl.searchParams.set('limit', '5');
            fallbackUrl.searchParams.set('addressdetails', '1');

            const fallbackResponse = await fetch(fallbackUrl.toString(), {
                headers: {
                    Accept: 'application/json',
                    'Accept-Language': 'en',
                    'User-Agent': 'EcoRoute/1.0'
                }
            });
            const fallbackData = await fallbackResponse.json();

            if (!fallbackResponse.ok) {
                throw new Error('Location search is unavailable. Verify Mappls credentials.');
            }

            const fallbackResults = fallbackData
                .filter((place) => place.lat && place.lon)
                .slice(0, 5)
                .map((place) => ({
                    name: place.display_name,
                    lat: Number(place.lat),
                    lon: Number(place.lon),
                    eLoc: null
                }));

            return res.status(200).json({
                success: true,
                results: fallbackResults,
                fallback: true
            });
        }

        const rawList = data?.suggestedLocations || [];

        const results = rawList
            .filter((place) => place.latitude && place.longitude)
            .slice(0, 5)
            .map((place) => ({
                name: place.placeAddress
                    ? `${place.placeName}, ${place.placeAddress}`
                    : place.placeName,
                lat: Number(place.latitude),
                lon: Number(place.longitude),
                eLoc: place.eLoc || null
            }));

        res.status(200).json({ success: true, results });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Location search failed'
        });
    }
};

// POST /api/mappls/routes
const getRoutes = async (req, res) => {
    try {
        const { origin, destination } = req.body;

        if (
            !origin?.lat ||
            !origin?.lon ||
            !destination?.lat ||
            !destination?.lon
        ) {
            return res.status(400).json({
                success: false,
                message: 'Valid origin and destination coordinates are required'
            });
        }

        const { token, isStatic } = await getMapplsAuth();

        const profiles = [
            { key: 'car', profile: 'driving' },
            { key: 'bike', profile: 'biking' },
            { key: 'foot', profile: 'walking' }
        ];

        const results = {};
        const failedModes = [];
        const headers = isStatic ? {} : { Authorization: `Bearer ${token}` };

        await Promise.all(
            profiles.map(async ({ key, profile }) => {
                try {
                    const url = new URL(
                        `https://route.mappls.com/route/direction/route_adv/${profile}/` +
                            `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`
                    );
                    url.searchParams.set('geometries', 'polyline');
                    url.searchParams.set('overview', 'full');
                    url.searchParams.set('access_token', token);

                    const response = await fetch(url.toString(), { headers });

                    const data = await response.json();
                    const route = data?.routes?.[0];
                    if (!response.ok || !route) {
                        throw new Error('No route found');
                    }

                    results[key] = {
                        distance: (route.distance || 0) / 1000,
                        duration: Math.round((route.duration || 0) / 60),
                        geometry: route.geometry || ''
                    };
                } catch (err) {
                    results[key] = null;
                    failedModes.push(key);
                }
            })
        );

        res.status(200).json({
            success: true,
            routes: results,
            failedModes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Route calculation failed'
        });
    }
};

module.exports = {
    getClientToken,
    searchLocations,
    getRoutes
};
