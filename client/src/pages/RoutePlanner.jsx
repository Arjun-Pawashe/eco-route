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
import { useAuth } from '../context/AuthContext';
import {
  calculateEmissionResults,
  decodePolyline,
  rankEmissionResults
} from '../utils/carbonCalculator';
import MapView from '../components/MapView';

const TRANSPORT_MODES = [
  { name: 'Bus', mode: 'bus', icon: Bus, factor: 0.08 },
  { name: 'Train', mode: 'train', icon: Train, factor: 0.04 },
  { name: 'Metro', mode: 'metro', icon: TrainFront, factor: 0.035 },
  { name: 'Car', mode: 'car', icon: Car, factor: 0.17 },
  { name: 'Two-wheeler', mode: 'two-wheeler', icon: Bike, factor: 0.05 },
  { name: 'Auto-rickshaw', mode: 'auto-rickshaw', icon: Car, factor: 0.09 },
  { name: 'EV car', mode: 'ev-car', icon: Car, factor: 0.05 },
  { name: 'EV scooter', mode: 'ev-scooter', icon: Bike, factor: 0.02 },
  { name: 'Bicycle', mode: 'bike', icon: Bike, factor: 0 },
  { name: 'Walking', mode: 'walking', icon: Footprints, factor: 0 },
  { name: 'Multimodal', mode: 'multimodal', icon: TrainFront, factor: 0.04 }
];

function RoutePlanner() {
  const { userProfile } = useAuth();

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
  const [baselineVehicle, setBaselineVehicle] = useState('petrol-car');
  const [savedModes, setSavedModes] = useState({});

  const [routeOptions, setRouteOptions] = useState({
    car: null,
    bike: null,
    foot: null,
    metro: null
  });

  const travelPreference = userProfile?.travelPreference || 'balanced';
  const savedPlaces = userProfile?.savedPlaces || [];

  // Fetch Mappls SDK token from Render backend if not provided via env
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
      setSavedModes({});
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

  const emissionResults = calculateEmissionResults({
    transportModes: TRANSPORT_MODES,
    routeOptions,
    baselineVehicle
  });

  const rankedResults = rankEmissionResults(emissionResults, travelPreference);
  const recommendedMode = rankedResults[0]?.mode;

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

  async function saveJourney(mode) {
    if (!origin || !destination) return;
    try {
      const legs =
        mode.mode === 'multimodal'
          ? [
              { mode: 'walking', distance: 0.5, duration: 8, carbonEmission: 0 },
              {
                mode: 'metro',
                distance: Number(mode.distance),
                duration: routeInfo?.duration || 0,
                carbonEmission: Number(mode.emission)
              },
              { mode: 'walking', distance: 0.5, duration: 8, carbonEmission: 0 }
            ]
          : [];
      await API.post('/journeys', {
        origin: {
          name: origin.name,
          coordinates: { lat: origin.lat, lng: origin.lon }
        },
        destination: {
          name: destination.name,
          coordinates: { lat: destination.lat, lng: destination.lon }
        },
        transportMode: mode.mode,
        distance: Number(mode.distance),
        duration: routeInfo?.duration || 0,
        carbonEmission: Number(mode.emission),
        carbonSaved: Math.max(0, Number(mode.carbonSaved)),
        preference: travelPreference,
        legs
      });
      setSavedModes((current) => ({ ...current, [mode.mode]: true }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save journey');
    }
  }

  function applySavedPlace(place, type) {
    selectLocation({ name: place.name, lat: place.lat, lon: place.lon }, type);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800">EcoRoute Planner</h1>

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
              {savedPlaces.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {savedPlaces.map((place) => (
                    <button
                      key={place.label}
                      onClick={() => applySavedPlace(place, 'origin')}
                      className="text-xs bg-green-50 text-green-800 px-3 py-2 rounded-full"
                    >
                      {place.label}: {place.name}
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
              {savedPlaces.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {savedPlaces.map((place) => (
                    <button
                      key={place.label}
                      onClick={() => applySavedPlace(place, 'destination')}
                      className="text-xs bg-green-50 text-green-800 px-3 py-2 rounded-full"
                    >
                      {place.label}: {place.name}
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
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Baseline vehicle
            </label>
            <select
              value={baselineVehicle}
              onChange={(e) => setBaselineVehicle(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="petrol-car">Petrol Car — 0.17 kg/km</option>
              <option value="diesel-car">Diesel Car — 0.16 kg/km</option>
              <option value="petrol-two-wheeler">
                Petrol Two-Wheeler — 0.05 kg/km
              </option>
              <option value="ev-car">EV Car — 0.05 kg/km</option>
              <option value="auto-rickshaw">Auto-Rickshaw — 0.09 kg/km</option>
            </select>
          </div>

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
                    mode.mode === recommendedMode
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-400'
                  }`}
                >
                  {mode.mode === recommendedMode && (
                    <span className="inline-flex items-center gap-1 bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                      <span>✓</span>
                      Recommended
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
                        ? `${mode.carbonSaved} kg less than baseline`
                        : 'Same as baseline'}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 mt-2">
                    Estimated cost: ₹{mode.cost}
                  </p>
                  {Number(mode.costSaved) > 0 && (
                    <p className="text-sm text-green-700">
                      ₹{mode.costSaved} saved
                    </p>
                  )}
                  <button
                    onClick={() => saveJourney(mode)}
                    disabled={savedModes[mode.mode]}
                    className="mt-4 w-full rounded-lg bg-green-700 text-white py-2 disabled:bg-green-200 disabled:text-green-800"
                  >
                    {savedModes[mode.mode] ? 'Saved' : 'Save Journey'}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-5">
              Emission factors are illustrative for prototype testing. Car,
              bicycle and walking use their respective Mappls route distances.
              Bus, train and metro currently use approximate car-route
              distances. Actual emissions may vary.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoutePlanner;