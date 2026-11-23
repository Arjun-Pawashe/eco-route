import { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  Bus,
  TrainFront,
  Train,
  Car,
  Bike,
  Footprints
} from 'lucide-react';
import API from '../services/api';
import MapView from '../components/MapView';

// Decodes Mappls/Google encoded polyline5 string into [{ lat, lng }, ...]
function decodePolyline(encoded) {
  if (!encoded) return [];
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

function RoutePlanner() {
  const [mapToken, setMapToken] = useState(
    import.meta.env.VITE_MAPPLS_ACCESS_TOKEN || ''
  );

  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  const [originResults, setOriginResults] = useState([]);
  const [destinationResults, setDestinationResults] = useState([]);

  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  const [selectedMode, setSelectedMode] = useState('car');

  const [routeOptions, setRouteOptions] = useState({
    car: null,
    bike: null,
    foot: null,
    metro: null
  });

  const transportModes = [
    { name: 'Bus', icon: Bus, factor: 0.08 },
    { name: 'Train', icon: Train, factor: 0.04 },
    { name: 'Metro', icon: TrainFront, factor: 0.035 },
    { name: 'Car', icon: Car, factor: 0.17 },
    { name: 'Bicycle', icon: Bike, factor: 0 },
    { name: 'Walking', icon: Footprints, factor: 0 }
  ];

  // Fetch Mappls SDK token from backend if not provided via env
  useEffect(() => {
    if (mapToken) return;

    API.get('/mappls/token')
      .then((res) => {
        if (res.data?.accessToken) {
          setMapToken(res.data.accessToken);
        }
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            'Could not load Mappls token. Check MAPPLS_CLIENT_ID and MAPPLS_CLIENT_SECRET in server/.env.'
        );
      });
  }, [mapToken]);

  useEffect(() => {
    if (!origin || !destination) {
      setRouteOptions({
        car: null,
        bike: null,
        foot: null,
        metro: null
      });
      setRouteCoordinates([]);
      setRouteInfo(null);
      return;
    }

    const controller = new AbortController();

    async function getAllRoutes() {
      setRouteLoading(true);
      setRouteError('');

      setRouteOptions({
        car: null,
        bike: null,
        foot: null,
        metro: null
      });

      try {
        const response = await API.post(
          '/mappls/routes',
          { origin, destination },
          { signal: controller.signal }
        );

        const rawRoutes = response.data?.routes || {};
        const parsed = {
          car: rawRoutes.car
            ? {
                ...rawRoutes.car,
                coordinates: decodePolyline(rawRoutes.car.geometry)
              }
            : null,
          bike: rawRoutes.bike
            ? {
                ...rawRoutes.bike,
                coordinates: decodePolyline(rawRoutes.bike.geometry)
              }
            : null,
          foot: rawRoutes.foot
            ? {
                ...rawRoutes.foot,
                coordinates: decodePolyline(rawRoutes.foot.geometry)
              }
            : null,
          metro: null
        };

        if (parsed.car) {
          parsed.metro = {
            ...parsed.car,
            coordinates: parsed.car.coordinates,
            approximate: true
          };
        }

        setRouteOptions(parsed);

        const failedModes = response.data?.failedModes || [];
        if (failedModes.length > 0) {
          setRouteError(
            `Could not calculate routes for: ${failedModes.join(', ')}.`
          );
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setRouteError(
            err.response?.data?.message || err.message || 'Route calculation failed.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setRouteLoading(false);
        }
      }
    }

    getAllRoutes();

    return () => controller.abort();
  }, [origin, destination]);

  useEffect(() => {
    const selectedRoute = routeOptions[selectedMode];

    if (selectedRoute) {
      setRouteCoordinates(selectedRoute.coordinates);

      setRouteInfo({
        distance: selectedRoute.distance.toFixed(2),
        duration: selectedRoute.duration
      });
    } else {
      setRouteCoordinates([]);
      setRouteInfo(null);
    }
  }, [routeOptions, selectedMode]);

  const emissionResults = routeOptions.car
    ? transportModes
        .map((mode) => {
          let distance;
          let approximateDistance = false;

          if (mode.name === 'Car') {
            distance = routeOptions.car.distance;
          } else if (mode.name === 'Bicycle') {
            if (!routeOptions.bike) return null;
            distance = routeOptions.bike.distance;
          } else if (mode.name === 'Walking') {
            if (!routeOptions.foot) return null;
            distance = routeOptions.foot.distance;
          } else {
            // Public transport uses car distance as an approximation
            distance = routeOptions.car.distance;
            approximateDistance = true;
          }

          const emission = distance * mode.factor;
          const carEmission = routeOptions.car.distance * 0.17;

          return {
            ...mode,
            distance: distance.toFixed(2),
            approximateDistance,
            emission: emission.toFixed(2),
            carbonSaved: (carEmission - emission).toFixed(2)
          };
        })
        .filter(Boolean)
    : [];

  const bestMotorized = emissionResults
    .filter((mode) => !['Bicycle', 'Walking'].includes(mode.name))
    .reduce(
      (best, current) =>
        Number(current.emission) < Number(best.emission) ? current : best,
      emissionResults.find(
        (mode) => !['Bicycle', 'Walking'].includes(mode.name)
      )
    );

  async function searchLocation(query, type) {
    if (!query.trim()) {
      setError('Please enter a location.');
      return;
    }

    setError('');
    setLoading(type);

    try {
      const response = await API.get('/mappls/search', {
        params: { query: query.trim() }
      });

      const results = response.data?.results || [];

      if (type === 'origin') {
        setOriginResults(results);
      } else {
        setDestinationResults(results);
      }

      if (results.length === 0) {
        setError('No matching locations found. Try another search.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Location search failed.'
      );
    } finally {
      setLoading('');
    }
  }

  function selectLocation(place, type) {
    if (type === 'origin') {
      setOrigin(place);
      setOriginQuery(place.name);
      setOriginResults([]);
    } else {
      setDestination(place);
      setDestinationQuery(place.name);
      setDestinationResults([]);
    }

    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800">
          EcoRoute Planner
        </h1>

        <p className="text-gray-500 mt-2 mb-6">
          Plan smarter journeys and reduce your carbon footprint.
        </p>

        {/* Location Search */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-green-800 mb-5">
            Plan Your Journey
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Origin */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <MapPin className="inline mr-2 text-green-600" size={18} />
                Starting Location
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={originQuery}
                  onChange={(e) => {
                    setOriginQuery(e.target.value);
                    setOrigin(null);
                    setOriginResults([]);
                  }}
                  placeholder="Enter starting location (e.g. Swargate, Pune)..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                />

                <button
                  onClick={() => searchLocation(originQuery, 'origin')}
                  disabled={loading !== ''}
                  className="bg-green-700 text-white px-4 rounded-lg hover:bg-green-800 disabled:opacity-50"
                >
                  <Search size={20} />
                </button>
              </div>

              {loading === 'origin' && (
                <p className="text-sm text-gray-500 mt-2">Searching...</p>
              )}

              {originResults.length > 0 && (
                <div className="border rounded-lg mt-2 divide-y">
                  {originResults.map((place, index) => (
                    <button
                      key={`${place.lat}-${place.lon}-${index}`}
                      onClick={() => selectLocation(place, 'origin')}
                      className="w-full text-left p-3 text-sm hover:bg-green-50"
                    >
                      {place.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Navigation className="inline mr-2 text-red-500" size={18} />
                Destination
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={destinationQuery}
                  onChange={(e) => {
                    setDestinationQuery(e.target.value);
                    setDestination(null);
                    setDestinationResults([]);
                  }}
                  placeholder="Enter destination (e.g. Hinjewadi, Pune)..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                />

                <button
                  onClick={() =>
                    searchLocation(destinationQuery, 'destination')
                  }
                  disabled={loading !== ''}
                  className="bg-green-700 text-white px-4 rounded-lg hover:bg-green-800 disabled:opacity-50"
                >
                  <Search size={20} />
                </button>
              </div>

              {loading === 'destination' && (
                <p className="text-sm text-gray-500 mt-2">Searching...</p>
              )}

              {destinationResults.length > 0 && (
                <div className="border rounded-lg mt-2 divide-y">
                  {destinationResults.map((place, index) => (
                    <button
                      key={`${place.lat}-${place.lon}-${index}`}
                      onClick={() => selectLocation(place, 'destination')}
                      className="w-full text-left p-3 text-sm hover:bg-green-50"
                    >
                      {place.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

          <p className="text-xs text-gray-400 mt-4">
            Location search, maps, and routing powered by Mappls (MapmyIndia).
          </p>
        </div>

        {/* Map */}
        <MapView
          accessToken={mapToken}
          origin={origin}
          destination={destination}
          routeCoordinates={routeCoordinates}
        />

        {/* Travel Mode Selector */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mt-6">
          <h2 className="text-lg font-semibold text-green-800 mb-4">
            Select Travel Mode
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'car', label: 'Car', icon: Car },
              { id: 'bike', label: 'Bicycle', icon: Bike },
              { id: 'foot', label: 'Walking', icon: Footprints },
              { id: 'metro', label: 'Metro', icon: TrainFront }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${
                  selectedMode === mode.id
                    ? 'bg-green-50 border-green-600 text-green-800'
                    : 'border-gray-200 text-gray-600 hover:border-green-400'
                }`}
              >
                <mode.icon size={26} />
                <span className="font-medium">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {routeLoading && (
          <p className="mt-4 text-green-700">Calculating your route...</p>
        )}

        {routeError && <p className="mt-4 text-red-600">{routeError}</p>}

        {routeInfo && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Carbon Emission Comparison
            </h2>

            <p className="text-gray-500 text-sm mb-6">
              Compare the estimated carbon footprint of different transport
              modes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {emissionResults.map((mode) => (
                <div
                  key={mode.name}
                  className={`relative border rounded-xl p-5 transition ${
                    mode.name === bestMotorized?.name
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-400'
                  }`}
                >
                  {mode.name === bestMotorized?.name && (
                    <span className="inline-flex items-center gap-1 bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                      <span>✓</span>
                      Best Motorized Option
                    </span>
                  )}

                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                    <mode.icon
                      size={26}
                      className="text-green-700"
                      strokeWidth={1.8}
                    />
                  </div>

                  <h3 className="font-semibold text-lg text-gray-800">
                    {mode.name}
                  </h3>

                  <p className="text-sm text-gray-600 mt-2">
                    Distance: {mode.distance} km
                    {mode.approximateDistance && (
                      <span className="text-xs text-orange-600 block">
                        Approximate route distance
                      </span>
                    )}
                  </p>

                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {mode.emission} kg
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    CO₂e per journey
                  </p>

                  {mode.name !== 'Car' && (
                    <p className="text-sm text-green-700 mt-3 font-medium">
                      {Number(mode.carbonSaved) > 0
                        ? `${mode.carbonSaved} kg less than car`
                        : 'Same as car baseline'}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-5">
              Emission factors are illustrative for prototype testing. Car,
              bicycle and walking use their respective Mappls route distances.
              Bus, train and metro currently use approximate car-route distances.
              Actual emissions may vary.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoutePlanner;