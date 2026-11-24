const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const ROUTES_COMPUTE_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

function getGoogleMapsServerKey() {
    const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
    if (!key) {
        const error = new Error(
            'GOOGLE_MAPS_API_KEY is not configured in server/.env.'
        );
        error.statusCode = 503;
        throw error;
    }
    return key;
}

function parseDurationSeconds(durationValue) {
    if (typeof durationValue === 'number' && Number.isFinite(durationValue)) {
        return Math.max(0, durationValue);
    }
    if (typeof durationValue === 'string') {
        const match = durationValue.trim().match(/^(\d+(?:\.\d+)?)s$/);
        if (match) {
            return Math.max(0, Number(match[1]));
        }
    }
    return 0;
}

function classifyTraffic(congestionRatio) {
    if (congestionRatio >= 1.35) return 'heavy';
    if (congestionRatio >= 1.15) return 'moderate';
    return 'light';
}

function normalizeRoute(route, index) {
    const distanceKm = Number(((route.distanceMeters || 0) / 1000).toFixed(2));
    const durationSeconds = parseDurationSeconds(route.duration);
    const staticDurationSeconds =
        parseDurationSeconds(route.staticDuration) || durationSeconds;

    const duration = Math.max(1, Math.round(durationSeconds / 60));
    const staticDuration = Math.max(1, Math.round(staticDurationSeconds / 60));
    const trafficDelayMinutes = Math.max(
        0,
        Math.round((durationSeconds - staticDurationSeconds) / 60)
    );
    const congestionRatio =
        staticDurationSeconds > 0
            ? Number((durationSeconds / staticDurationSeconds).toFixed(3))
            : 1;

    return {
        id: `route-${index + 1}`,
        index,
        summary: route.description?.trim() || `Route ${index + 1}`,
        routeLabels: Array.isArray(route.routeLabels) ? route.routeLabels : [],
        distance: distanceKm,
        duration,
        staticDuration,
        durationSeconds,
        staticDurationSeconds,
        trafficDelayMinutes,
        congestionRatio,
        trafficStatus: classifyTraffic(congestionRatio),
        speedReadingIntervals: Array.isArray(
            route.travelAdvisory?.speedReadingIntervals
        )
            ? route.travelAdvisory.speedReadingIntervals
            : [],
        geometry: route.polyline?.encodedPolyline || ''
    };
}

// GET /api/maps/config
const getClientConfig = async (req, res) => {
    res.status(200).json({
        success: true,
        provider: 'google-maps',
        hasServerKey: Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim())
    });
};

// GET /api/maps/search?query=...
const searchLocations = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter is required'
            });
        }

        const apiKey = getGoogleMapsServerKey();

        const response = await fetch(PLACES_SEARCH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask':
                    'places.id,places.displayName,places.formattedAddress,places.location'
            },
            body: JSON.stringify({
                textQuery: query.trim(),
                maxResultCount: 5,
                languageCode: 'en'
            })
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status || 502).json({
                success: false,
                message:
                    data?.error?.message ||
                    'Google Places search failed. Verify GOOGLE_MAPS_API_KEY and Places API (New).'
            });
        }

        const rawPlaces = Array.isArray(data?.places) ? data.places : [];
        const results = rawPlaces
            .filter(
                (place) =>
                    place.location?.latitude != null &&
                    place.location?.longitude != null
            )
            .slice(0, 5)
            .map((place) => {
                const shortName = place.displayName?.text || '';
                const address = place.formattedAddress || '';
                const name =
                    shortName && address && !address.startsWith(shortName)
                        ? `${shortName}, ${address}`
                        : address || shortName;

                return {
                    id: place.id || null,
                    name,
                    shortName: shortName || name,
                    address,
                    lat: Number(place.location.latitude),
                    lon: Number(place.location.longitude)
                };
            });

        return res.status(200).json({ success: true, results });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Location search failed'
        });
    }
};

// POST /api/maps/routes
const getRoutes = async (req, res) => {
    try {
        const { origin, destination } = req.body;

        if (
            origin?.lat == null ||
            origin?.lon == null ||
            destination?.lat == null ||
            destination?.lon == null
        ) {
            return res.status(400).json({
                success: false,
                message: 'Valid origin and destination coordinates are required'
            });
        }

        const apiKey = getGoogleMapsServerKey();

        const profiles = [
            { key: 'car', travelMode: 'DRIVE', supportsTraffic: true },
            { key: 'twoWheeler', travelMode: 'TWO_WHEELER', supportsTraffic: true },
            { key: 'transit', travelMode: 'TRANSIT', supportsTraffic: false },
            { key: 'bike', travelMode: 'BICYCLE', supportsTraffic: false },
            { key: 'foot', travelMode: 'WALK', supportsTraffic: false }
        ];

        const results = {};
        const failedModes = [];

        await Promise.all(
            profiles.map(async ({ key, travelMode, supportsTraffic }) => {
                try {
                    const requestBody = {
                        origin: {
                            location: {
                                latLng: {
                                    latitude: Number(origin.lat),
                                    longitude: Number(origin.lon)
                                }
                            }
                        },
                        destination: {
                            location: {
                                latLng: {
                                    latitude: Number(destination.lat),
                                    longitude: Number(destination.lon)
                                }
                            }
                        },
                        travelMode,
                        computeAlternativeRoutes: true,
                        languageCode: 'en-US',
                        units: 'METRIC'
                    };

                    if (supportsTraffic) {
                        requestBody.routingPreference = 'TRAFFIC_AWARE';
                        requestBody.extraComputations = ['TRAFFIC_ON_POLYLINE'];
                    }

                    const fieldMask = [
                        'routes.duration',
                        'routes.staticDuration',
                        'routes.distanceMeters',
                        'routes.polyline.encodedPolyline',
                        'routes.description',
                        'routes.routeLabels'
                    ];
                    if (supportsTraffic) {
                        fieldMask.push('routes.travelAdvisory.speedReadingIntervals');
                    }

                    const response = await fetch(ROUTES_COMPUTE_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Goog-Api-Key': apiKey,
                            'X-Goog-FieldMask': fieldMask.join(',')
                        },
                        body: JSON.stringify(requestBody)
                    });

                    const data = await response.json();
                    const rawRoutes = Array.isArray(data?.routes) ? data.routes : [];

                    if (!response.ok || rawRoutes.length === 0) {
                        throw new Error(data?.error?.message || 'No route found');
                    }

                    results[key] = rawRoutes.map((route, idx) =>
                        normalizeRoute(route, idx)
                    );
                } catch {
                    results[key] = [];
                    failedModes.push(key);
                }
            })
        );

        return res.status(200).json({
            success: true,
            routes: results,
            failedModes
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Route calculation failed'
        });
    }
};

module.exports = {
    getClientConfig,
    searchLocations,
    getRoutes,
    parseDurationSeconds,
    normalizeRoute
};
