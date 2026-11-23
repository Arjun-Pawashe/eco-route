import { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  Bus,
  Train,
  Car,
  Bike,
  Footprints
} from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  EMISSION_FACTORS,
  calculateEmissionResults,
  decodePolyline,
  rankEmissionResults
} from '../utils/carbonCalculator';
import MapView from '../components/MapView';
import Sidebar from '../components/Sidebar';

const TRANSPORT_MODES = [
  { name: 'Bus', mode: 'bus', icon: Bus, factor: EMISSION_FACTORS.bus },
  { name: 'Train', mode: 'train', icon: Train, factor: EMISSION_FACTORS.train },
  { name: 'Car', mode: 'car', icon: Car, factor: EMISSION_FACTORS.car },
  {
    name: 'Two-wheeler',
    mode: 'two-wheeler',
    icon: Bike,
    factor: EMISSION_FACTORS['two-wheeler']
  },
  {
    name: 'Auto-rickshaw',
    mode: 'auto-rickshaw',
    icon: Car,
    factor: EMISSION_FACTORS['auto-rickshaw']
  },
  {
    name: 'EV car',
    mode: 'ev-car',
    icon: Car,
    factor: EMISSION_FACTORS['ev-car']
  },
  {
    name: 'EV scooter',
    mode: 'ev-scooter',
    icon: Bike,
    factor: EMISSION_FACTORS['ev-scooter']
  },
  { name: 'Bicycle', mode: 'bike', icon: Bike, factor: EMISSION_FACTORS.bike },
  {
    name: 'Walking',
    mode: 'walking',
    icon: Footprints,
    factor: EMISSION_FACTORS.walking
  }
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
    foot: null
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
        foot: null
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
        foot: null
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
            : null
        };

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
        duration: mode.duration ?? routeInfo?.duration ?? 0,
        carbonEmission: Number(mode.emission),
        carbonSaved: Math.max(0, Number(mode.carbonSaved)),
        preference: travelPreference
      });
      setSavedModes((current) => ({ ...current, [mode.mode]: true }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save journey');
    }
  }

  function applySavedPlace(place, type) {
    if (place?.lat == null || place?.lon == null) return;
    selectLocation({ name: place.name, lat: place.lat, lon: place.lon }, type);
  }

  return (
    <div className="min-h-screen bg-[#F4F3F7] flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-5 pt-20 pb-24 md:p-10 md:pt-10 md:pb-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold text-[#644DFF] mb-1.5">Journey</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-[#111018]">
            EcoRoute <span className="text-[#644DFF]">Planner</span>
          </h1>

          <p className="text-[#6E6B7B] text-sm mt-2 mb-6">
            Plan smarter journeys and reduce your carbon footprint.
          </p>

        {/* Location Search */}
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E4E1F2] shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-[#111018] mb-5">
            Plan Your Journey
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Origin */}
            <div>
              <label className="block text-sm font-medium text-[#111018] mb-2">
                <MapPin className="inline mr-2 text-[#644DFF]" size={16} />
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
                  className="w-full bg-[#ECEAF3] text-[#111018] placeholder-[#9A96A6] rounded-[10px] px-4 py-3 outline-none focus:ring-2 focus:ring-[#644DFF]"
                />

                <button
                  onClick={() => searchLocation(originQuery, 'origin')}
                  disabled={loading !== ''}
                  className="bg-[#644DFF] text-white px-4 rounded-[10px] hover:bg-[#533CE6] disabled:opacity-50 transition cursor-pointer"
                >
                  <Search size={19} />
                </button>
              </div>

              {loading === 'origin' && (
                <p className="text-sm text-[#6E6B7B] mt-2">Searching...</p>
              )}

              {originResults.length > 0 && (
                <div className="border border-[#E4E1F2] bg-white rounded-[10px] mt-2 divide-y divide-[#E4E1F2]">
                  {originResults.map((place, index) => (
                    <button
                      key={`${place.lat}-${place.lon}-${index}`}
                      onClick={() => selectLocation(place, 'origin')}
                      className="w-full text-left p-3 text-sm text-[#111018] hover:bg-[#ECEAF3] transition"
                    >
                      {place.name}
                    </button>
                  ))}
                </div>
              )}
              {savedPlaces.length > 0 && (
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  {savedPlaces.map((place) => {
                    const isActive = origin?.name === place.name;
                    return (
                      <button
                        key={place.label}
                        type="button"
                        onClick={() => applySavedPlace(place, 'origin')}
                        className={`text-xs px-3 py-1.5 rounded-[8px] font-medium transition cursor-pointer ${
                          isActive
                            ? 'bg-[#644DFF] text-white'
                            : 'bg-[#ECEAF3] text-[#111018] hover:bg-[#E5E0FF] hover:text-[#5D45F8]'
                        }`}
                      >
                        {place.label}: {place.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-[#111018] mb-2">
                <Navigation className="inline mr-2 text-[#FF5D47]" size={16} />
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
                  className="w-full bg-[#ECEAF3] text-[#111018] placeholder-[#9A96A6] rounded-[10px] px-4 py-3 outline-none focus:ring-2 focus:ring-[#644DFF]"
                />

                <button
                  onClick={() =>
                    searchLocation(destinationQuery, 'destination')
                  }
                  disabled={loading !== ''}
                  className="bg-[#644DFF] text-white px-4 rounded-[10px] hover:bg-[#533CE6] disabled:opacity-50 transition cursor-pointer"
                >
                  <Search size={19} />
                </button>
              </div>

              {loading === 'destination' && (
                <p className="text-sm text-[#6E6B7B] mt-2">Searching...</p>
              )}

              {destinationResults.length > 0 && (
                <div className="border border-[#E4E1F2] bg-white rounded-[10px] mt-2 divide-y divide-[#E4E1F2]">
                  {destinationResults.map((place, index) => (
                    <button
                      key={`${place.lat}-${place.lon}-${index}`}
                      onClick={() => selectLocation(place, 'destination')}
                      className="w-full text-left p-3 text-sm text-[#111018] hover:bg-[#ECEAF3] transition"
                    >
                      {place.name}
                    </button>
                  ))}
                </div>
              )}
              {savedPlaces.length > 0 && (
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  {savedPlaces.map((place) => {
                    const isActive = destination?.name === place.name;
                    return (
                      <button
                        key={place.label}
                        type="button"
                        onClick={() => applySavedPlace(place, 'destination')}
                        className={`text-xs px-3 py-1.5 rounded-[8px] font-medium transition cursor-pointer ${
                          isActive
                            ? 'bg-[#644DFF] text-white'
                            : 'bg-[#ECEAF3] text-[#111018] hover:bg-[#E5E0FF] hover:text-[#5D45F8]'
                        }`}
                      >
                        {place.label}: {place.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

          {error && (
            <p className="bg-[#FCE4E1] text-[#D94A38] text-sm font-medium p-3 rounded-[10px] mt-4">
              {error}
            </p>
          )}

          <p className="text-xs text-[#9A96A6] mt-3 mb-4">
            Location search, maps, and routing powered by Mappls (MapmyIndia).
          </p>

        {/* Map */}
        <MapView
          accessToken={mapToken}
          origin={origin}
          destination={destination}
          routeCoordinates={routeCoordinates}
        />

        {/* Travel Mode Selector */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E4E1F2] shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-[#111018] mb-4">
            Select Travel Mode
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#111018] mb-2">
              Baseline vehicle
            </label>
            <select
              value={baselineVehicle}
              onChange={(e) => setBaselineVehicle(e.target.value)}
              className="bg-[#ECEAF3] text-[#111018] rounded-[10px] px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#644DFF]"
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
              { id: 'foot', label: 'Walking', icon: Footprints }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition cursor-pointer ${
                  selectedMode === mode.id
                    ? 'bg-[#E5E0FF] border-[#644DFF] text-[#5D45F8]'
                    : 'bg-[#FFFFFF] border-[#E4E1F2] text-[#6E6B7B] hover:border-[#644DFF]/50 hover:text-[#111018]'
                }`}
              >
                <mode.icon size={24} />
                <span className="font-semibold text-sm">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {routeLoading && (
          <p className="mt-4 text-sm font-medium text-[#644DFF]">Calculating your route...</p>
        )}

        {routeError && (
          <p className="mt-4 bg-[#FCE4E1] text-[#D94A38] text-sm font-medium p-3 rounded-[10px]">
            {routeError}
          </p>
        )}

        {routeInfo && (
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E4E1F2] shadow-sm p-6 mt-6">
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#111018] mb-1">
              Carbon Emission Comparison
            </h2>

            <p className="text-[#6E6B7B] text-sm mb-6">
              Compare the estimated carbon footprint of different transport
              modes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {emissionResults.map((mode) => (
                <div
                  key={mode.name}
                  className={`relative border rounded-2xl p-5 transition ${
                    mode.mode === recommendedMode
                      ? 'border-2 border-[#644DFF] bg-[#F4F3F7]'
                      : 'border-[#E4E1F2] bg-[#FFFFFF] hover:border-[#644DFF]/50'
                  }`}
                >
                  {mode.mode === recommendedMode && (
                    <span className="inline-flex items-center gap-1 bg-[#D9F7F4] text-[#0E9F96] text-xs font-semibold px-3 py-1 rounded-[8px] mb-3">
                      <span>✓</span>
                      Recommended
                    </span>
                  )}

                  <div className="w-11 h-11 rounded-[10px] bg-[#E5E0FF] flex items-center justify-center mb-3">
                    <mode.icon
                      size={22}
                      className="text-[#644DFF]"
                      strokeWidth={1.8}
                    />
                  </div>

                  <h3 className="font-semibold text-lg text-[#111018]">
                    {mode.name}
                  </h3>

                  <p className="text-sm text-[#6E6B7B] mt-2">
                    Distance: <span className="text-[#111018] font-medium">{mode.distance} km</span>
                    {mode.approximateDistance && (
                      <span className="text-xs text-[#5D45F8] block">
                        Approximate route distance
                      </span>
                    )}
                  </p>

                  {mode.duration != null && (
                    <p className="text-sm text-[#6E6B7B] mt-1">
                      Travel time: <span className="text-[#111018] font-medium">{mode.duration} min</span>
                      {mode.approximateDuration && (
                        <span className="text-xs text-[#5D45F8] block">
                          Approximate travel time
                        </span>
                      )}
                    </p>
                  )}

                  <p className="text-2xl font-bold tracking-[-0.02em] text-[#111018] mt-2">
                    {mode.emission} kg
                  </p>

                  <p className="text-xs text-[#9A96A6] mt-0.5">
                    CO₂e per journey
                  </p>

                  {mode.name !== 'Car' && (
                    <p className="text-xs font-semibold text-[#0E9F96] bg-[#D9F7F4] inline-block px-2.5 py-1 rounded-[6px] mt-3">
                      {Number(mode.carbonSaved) > 0
                        ? `${mode.carbonSaved} kg less than baseline`
                        : 'Same as baseline'}
                    </p>
                  )}
                  <p className="text-sm text-[#6E6B7B] mt-3">
                    Estimated cost: <span className="text-[#111018] font-medium">₹{mode.cost}</span>
                  </p>
                  {Number(mode.costSaved) > 0 && (
                    <p className="text-xs font-semibold text-[#0E9F96] mt-1">
                      ₹{mode.costSaved} saved
                    </p>
                  )}
                  <button
                    onClick={() => saveJourney(mode)}
                    disabled={savedModes[mode.mode]}
                    className="mt-4 w-full rounded-[10px] bg-[#644DFF] text-white font-semibold py-2.5 hover:bg-[#533CE6] disabled:bg-[#ECEAF3] disabled:text-[#6E6B7B] transition cursor-pointer"
                  >
                    {savedModes[mode.mode] ? 'Saved' : 'Save Journey'}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#9A96A6] mt-5">
              Emission factors are illustrative for prototype testing. Car,
              bicycle and walking use their respective Mappls route distances
              and durations. Bus, train, and other road modes use approximate
              car-route distances and estimated travel times. Actual emissions
              may vary.
            </p>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default RoutePlanner;