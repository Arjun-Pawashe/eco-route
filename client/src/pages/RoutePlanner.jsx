import { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  ArrowUpDown,
  Bus,
  Train,
  Car,
  Bike,
  Footprints,
  Leaf,
  Clock,
  AlertTriangle,
  Zap,
  Check
} from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  EMISSION_FACTORS,
  calculateEmissionResults,
  calculateRouteEmission,
  decodePolyline,
  getAvailableTransportModes,
  rankEmissionResults
} from '../utils/carbonCalculator';
import MapView from '../components/MapView';
import TopNav from '../components/TopNav';

const TRANSPORT_MODES = [
  { name: 'Car', mode: 'car', routeKey: 'car', icon: Car, factor: EMISSION_FACTORS.car },
  {
    name: 'Two-wheeler',
    mode: 'two-wheeler',
    routeKey: 'twoWheeler',
    icon: Bike,
    factor: EMISSION_FACTORS['two-wheeler']
  },
  {
    name: 'EV car',
    mode: 'ev-car',
    routeKey: 'car',
    icon: Zap,
    factor: EMISSION_FACTORS['ev-car']
  },
  {
    name: 'EV scooter',
    mode: 'ev-scooter',
    routeKey: 'twoWheeler',
    icon: Zap,
    factor: EMISSION_FACTORS['ev-scooter']
  },
  {
    name: 'Auto-rickshaw',
    mode: 'auto-rickshaw',
    routeKey: 'car',
    icon: Car,
    factor: EMISSION_FACTORS['auto-rickshaw']
  },
  { name: 'Bus', mode: 'bus', routeKey: 'bus', icon: Bus, factor: EMISSION_FACTORS.bus },
  { name: 'Metro', mode: 'metro', routeKey: 'metro', icon: Train, factor: EMISSION_FACTORS.metro },
  { name: 'Train', mode: 'train', routeKey: 'train', icon: Train, factor: EMISSION_FACTORS.train },
  { name: 'Bicycle', mode: 'bike', routeKey: 'bike', icon: Bike, factor: EMISSION_FACTORS.bike },
  {
    name: 'Walking',
    mode: 'walking',
    routeKey: 'foot',
    icon: Footprints,
    factor: EMISSION_FACTORS.walking
  }
];

const TRAFFIC_BADGE_STYLES = {
  light: 'bg-[#E6F4EA] text-[#137333]',
  moderate: 'bg-[#FEF7E0] text-[#B06000]',
  heavy: 'bg-[#FCE8E6] text-[#C5221F]'
};

function RoutePlanner() {
  const { userProfile } = useAuth();
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  const [originResults, setOriginResults] = useState([]);
  const [destinationResults, setDestinationResults] = useState([]);

  const [searchLoading, setSearchLoading] = useState('');
  const [error, setError] = useState('');

  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  const [selectedMode, setSelectedMode] = useState('car');
  const [baselineVehicle, setBaselineVehicle] = useState('petrol-car');
  const [routePriorityOverride, setRoutePriorityOverride] = useState(null);
  const [savedModes, setSavedModes] = useState({});
  const [activePanelTab, setActivePanelTab] = useState('routes'); // 'routes' | 'compare'

  const [routeOptions, setRouteOptions] = useState({
    car: [],
    twoWheeler: [],
    bus: [],
    metro: [],
    train: [],
    bike: [],
    foot: []
  });

  const [selectedRouteIndices, setSelectedRouteIndices] = useState({
    car: 0,
    twoWheeler: 0,
    bus: 0,
    metro: 0,
    train: 0,
    bike: 0,
    foot: 0
  });

  const travelPreference = userProfile?.travelPreference || 'balanced';
  const savedPlaces = userProfile?.savedPlaces || [];
  const defaultRoutePriority =
    travelPreference === 'fastest'
      ? 0
      : travelPreference === 'lowest-carbon'
        ? 100
        : 50;
  const routePriority = routePriorityOverride ?? defaultRoutePriority;

  // Fetch multiple alternative routes with live traffic from Google Routes API v2
  useEffect(() => {
    if (!origin || !destination) {
      setRouteOptions({
        car: [],
        twoWheeler: [],
        bus: [],
        metro: [],
        train: [],
        bike: [],
        foot: []
      });
      setSelectedRouteIndices({
        car: 0,
        twoWheeler: 0,
        bus: 0,
        metro: 0,
        train: 0,
        bike: 0,
        foot: 0
      });
      setRouteLoading(false);
      setSavedModes({});
      return;
    }

    const controller = new AbortController();

    async function fetchAllRoutes() {
      setRouteLoading(true);
      setRouteError('');
      setSavedModes({});
      setRouteOptions({
        car: [],
        twoWheeler: [],
        bus: [],
        metro: [],
        train: [],
        bike: [],
        foot: []
      });
      setSelectedRouteIndices({
        car: 0,
        twoWheeler: 0,
        bus: 0,
        metro: 0,
        train: 0,
        bike: 0,
        foot: 0
      });

      try {
        const response = await API.post(
          '/maps/routes',
          { origin, destination },
          { signal: controller.signal }
        );

        const rawRoutes = response.data?.routes || {};
        const decodeList = (list) =>
          (Array.isArray(list) ? list : []).map((r) => ({
            ...r,
            coordinates: decodePolyline(r.geometry)
          }));

        const parsedRoutes = {
          car: decodeList(rawRoutes.car),
          twoWheeler: decodeList(rawRoutes.twoWheeler),
          bus: decodeList(rawRoutes.bus),
          metro: decodeList(rawRoutes.metro),
          train: decodeList(rawRoutes.train),
          bike: decodeList(rawRoutes.bike),
          foot: decodeList(rawRoutes.foot)
        };
        setRouteOptions(parsedRoutes);
        setSelectedRouteIndices({
          car: 0,
          twoWheeler: 0,
          bus: 0,
          metro: 0,
          train: 0,
          bike: 0,
          foot: 0
        });

        const failedModes = response.data?.failedModes || [];
        if (failedModes.length > 0 && Object.values(parsedRoutes).every((routes) => routes.length === 0)) {
          setRouteError(
            'Could not calculate routes for the selected locations. Verify GOOGLE_MAPS_API_KEY and Routes API.'
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

    fetchAllRoutes();

    return () => controller.abort();
  }, [origin, destination]);

  const availableTransportModes = useMemo(() => {
    return getAvailableTransportModes(TRANSPORT_MODES, routeOptions).map(
      (mode) => {
        const routes = routeOptions[mode.routeKey] || [];
        const providerText = routes
          .flatMap((route) => [
            ...(route.transitAgencies || []),
            ...(route.transitSegments || []).map((segment) => segment.lineName)
          ])
          .join(' ');

        if (
          mode.mode === 'bus' &&
          /PMPML|Pune Mahanagar Parivahan/i.test(providerText)
        ) {
          return { ...mode, name: 'PMPML Bus' };
        }
        if (
          mode.mode === 'metro' &&
          /Pune\s*Metro|Maha(?:rashtra)?[\s-]*Metro/i.test(providerText)
        ) {
          return { ...mode, name: 'Pune Metro' };
        }
        return mode;
      }
    );
  }, [routeOptions]);

  const activeModeConfig =
    availableTransportModes.find((m) => m.mode === selectedMode) ||
    availableTransportModes[0] ||
    TRANSPORT_MODES[0];
  const activeRouteKey = activeModeConfig.routeKey;

  const activeRoutes = useMemo(() => {
    return routeOptions[activeRouteKey] || [];
  }, [routeOptions, activeRouteKey]);

  const selectedRouteIndex = selectedRouteIndices[activeRouteKey] ?? 0;

  // Compute live-traffic emission for each alternative route in the active mode
  const activeRoutesWithEmissions = useMemo(() => {
    return activeRoutes.map((route) => {
      const emissionStats = calculateRouteEmission({
        distanceKm:
          ['bus', 'metro', 'train'].includes(activeModeConfig.mode) &&
          route.transitDistance != null
            ? route.transitDistance
            : route.distance,
        durationMin: route.duration,
        staticDurationMin: route.staticDuration,
        trafficDelayMinutes: route.trafficDelayMinutes,
        congestionRatio: route.congestionRatio,
        mode: activeModeConfig.mode,
        factor: activeModeConfig.factor
      });
      return {
        ...route,
        emission: emissionStats.totalEmission,
        baseEmission: emissionStats.baseEmission,
        trafficImpact: emissionStats.trafficImpact
      };
    });
  }, [activeRoutes, activeModeConfig]);

  // Identify which alternative route has the lowest CO2e
  const ecoRouteIndex = useMemo(() => {
    if (activeRoutesWithEmissions.length === 0) return null;
    let bestIdx = 0;
    let lowest = activeRoutesWithEmissions[0].emission;
    activeRoutesWithEmissions.forEach((r, idx) => {
      if (r.emission < lowest) {
        lowest = r.emission;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [activeRoutesWithEmissions]);

  const emissionResults = useMemo(
    () =>
      calculateEmissionResults({
        transportModes: availableTransportModes,
        routeOptions,
        selectedRouteIndices,
        baselineVehicle
      }),
    [availableTransportModes, routeOptions, selectedRouteIndices, baselineVehicle]
  );

  const rankedResults = useMemo(
    () => rankEmissionResults(emissionResults, routePriority),
    [emissionResults, routePriority]
  );
  const recommendedMode = rankedResults[0]?.mode;

  async function searchLocation(query, type) {
    if (!query.trim()) {
      setError('Please enter a location to search.');
      return;
    }

    setError('');
    setSearchLoading(type);

    try {
      const response = await API.get('/maps/search', {
        params: { query: query.trim() }
      });

      const results = response.data?.results || [];
      if (type === 'origin') {
        setOriginResults(results);
      } else {
        setDestinationResults(results);
      }

      if (results.length === 0) {
        setError('No matching locations found. Try a more specific address.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Location search failed.'
      );
    } finally {
      setSearchLoading('');
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

  function swapLocations() {
    const prevOrigin = origin;
    const prevDest = destination;
    const prevOriginQuery = originQuery;
    const prevDestQuery = destinationQuery;

    setOrigin(prevDest);
    setDestination(prevOrigin);
    setOriginQuery(prevDestQuery);
    setDestinationQuery(prevOriginQuery);
    setOriginResults([]);
    setDestinationResults([]);
  }

  function handleSelectRouteIndex(idx) {
    setSelectedRouteIndices((prev) => ({
      ...prev,
      [activeRouteKey]: idx
    }));
  }

  async function saveJourney(modeResult) {
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
        transportMode: modeResult.mode,
        distance: Number(modeResult.distance),
        duration: modeResult.duration ?? 0,
        carbonEmission: Number(modeResult.emission),
        carbonSaved: Math.max(0, Number(modeResult.carbonSaved)),
        preference: travelPreference
      });
      setSavedModes((current) => ({ ...current, [modeResult.mode]: true }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save journey');
    }
  }

  function applySavedPlace(place, type) {
    if (place?.lat == null || place?.lon == null) return;
    selectLocation({ name: place.name, lat: place.lat, lon: place.lon }, type);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <TopNav />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 pb-16 md:pb-0">
        {/* Google Maps Style Left Directions & Routes Drawer */}
        <aside className="w-full lg:w-[440px] xl:w-[470px] shrink-0 bg-white border-r border-[#DADCE0] flex flex-col lg:h-[calc(100vh-4rem)] lg:overflow-y-auto z-10 shadow-[0_2px_8px_rgba(60,64,67,0.08)]">
          {/* Travel Mode Strip */}
          <div className="p-4 border-b border-[#E8EAED]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {availableTransportModes.map((m) => {
                const Icon = m.icon;
                const isSelected = activeModeConfig.mode === m.mode;
                return (
                  <button
                    key={m.mode}
                    type="button"
                    onClick={() => setSelectedMode(m.mode)}
                    title={m.name}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]'
                        : 'bg-[#F1F3F4] text-[#5F6368] border border-transparent hover:bg-[#E8EAED] hover:text-[#202124]'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Origin & Destination Inputs */}
            <div className="mt-4 flex items-stretch gap-2">
              <div className="flex-1 space-y-2.5">
                {/* Origin */}
                <div>
                  <div className="flex items-center gap-2 bg-[#F1F3F4] rounded-xl px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1A73E8] border border-transparent focus-within:border-[#1A73E8] transition">
                    <MapPin size={16} className="text-[#1A73E8] shrink-0" />
                    <input
                      type="text"
                      value={originQuery}
                      onChange={(e) => {
                        setOriginQuery(e.target.value);
                        setOrigin(null);
                        setOriginResults([]);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') searchLocation(originQuery, 'origin');
                      }}
                      placeholder="Choose starting point..."
                      className="w-full bg-transparent text-sm text-[#202124] placeholder-[#5F6368] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => searchLocation(originQuery, 'origin')}
                      disabled={searchLoading !== ''}
                      className="p-1.5 rounded-lg text-[#1A73E8] hover:bg-[#E8F0FE] disabled:opacity-40 cursor-pointer"
                      aria-label="Search starting location"
                    >
                      <Search size={16} />
                    </button>
                  </div>

                  {searchLoading === 'origin' && (
                    <p className="text-xs text-[#5F6368] mt-1.5 pl-1">Searching Google Places...</p>
                  )}

                  {originResults.length > 0 && (
                    <div className="mt-1.5 bg-white border border-[#DADCE0] rounded-xl shadow-md divide-y divide-[#F1F3F4] overflow-hidden">
                      {originResults.map((place, idx) => (
                        <button
                          key={`${place.lat}-${place.lon}-${idx}`}
                          type="button"
                          onClick={() => selectLocation(place, 'origin')}
                          className="w-full text-left px-3.5 py-2.5 text-xs text-[#202124] hover:bg-[#F8F9FA] flex items-start gap-2 cursor-pointer"
                        >
                          <MapPin size={14} className="text-[#5F6368] mt-0.5 shrink-0" />
                          <span>{place.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination */}
                <div>
                  <div className="flex items-center gap-2 bg-[#F1F3F4] rounded-xl px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1A73E8] border border-transparent focus-within:border-[#1A73E8] transition">
                    <Navigation size={16} className="text-[#EA4335] shrink-0" />
                    <input
                      type="text"
                      value={destinationQuery}
                      onChange={(e) => {
                        setDestinationQuery(e.target.value);
                        setDestination(null);
                        setDestinationResults([]);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') searchLocation(destinationQuery, 'destination');
                      }}
                      placeholder="Choose destination..."
                      className="w-full bg-transparent text-sm text-[#202124] placeholder-[#5F6368] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => searchLocation(destinationQuery, 'destination')}
                      disabled={searchLoading !== ''}
                      className="p-1.5 rounded-lg text-[#1A73E8] hover:bg-[#E8F0FE] disabled:opacity-40 cursor-pointer"
                      aria-label="Search destination"
                    >
                      <Search size={16} />
                    </button>
                  </div>

                  {searchLoading === 'destination' && (
                    <p className="text-xs text-[#5F6368] mt-1.5 pl-1">Searching Google Places...</p>
                  )}

                  {destinationResults.length > 0 && (
                    <div className="mt-1.5 bg-white border border-[#DADCE0] rounded-xl shadow-md divide-y divide-[#F1F3F4] overflow-hidden">
                      {destinationResults.map((place, idx) => (
                        <button
                          key={`${place.lat}-${place.lon}-${idx}`}
                          type="button"
                          onClick={() => selectLocation(place, 'destination')}
                          className="w-full text-left px-3.5 py-2.5 text-xs text-[#202124] hover:bg-[#F8F9FA] flex items-start gap-2 cursor-pointer"
                        >
                          <MapPin size={14} className="text-[#EA4335] mt-0.5 shrink-0" />
                          <span>{place.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Swap Origin & Destination */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={swapLocations}
                  title="Swap starting point and destination"
                  className="p-2 rounded-full text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124] transition cursor-pointer"
                  aria-label="Swap locations"
                >
                  <ArrowUpDown size={18} />
                </button>
              </div>
            </div>

            {/* Saved Places Chips */}
            {savedPlaces.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {savedPlaces.map((place) => (
                  <button
                    key={place.label}
                    type="button"
                    onClick={() =>
                      applySavedPlace(place, origin ? 'destination' : 'origin')
                    }
                    className="text-xs px-2.5 py-1 rounded-full bg-[#F1F3F4] text-[#3C4043] hover:bg-[#E8F0FE] hover:text-[#1A73E8] font-medium transition cursor-pointer"
                  >
                    {place.label}: {place.name}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-start gap-2 bg-[#FCE8E6] text-[#C5221F] text-xs font-medium p-3 rounded-xl">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Sub-tabs: Multiple Routes vs Mode Comparison */}
          <div className="grid grid-cols-2 border-b border-[#E8EAED] bg-[#F8F9FA]">
            <button
              type="button"
              onClick={() => setActivePanelTab('routes')}
              className={`py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activePanelTab === 'routes'
                  ? 'border-[#1A73E8] text-[#1A73E8] bg-white'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              Routes ({activeRoutesWithEmissions.length})
            </button>
            <button
              type="button"
              onClick={() => setActivePanelTab('compare')}
              className={`py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activePanelTab === 'compare'
                  ? 'border-[#1A73E8] text-[#1A73E8] bg-white'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              Compare Modes ({rankedResults.length})
            </button>
          </div>

          {/* Panel Body */}
          <div className="p-4 flex-1 space-y-3">
            {routeLoading && (
              <div className="p-4 rounded-xl bg-[#E8F0FE] text-[#1967D2] text-xs font-medium">
                Fetching live Google Maps routes & traffic conditions...
              </div>
            )}

            {routeError && (
              <div className="p-3 rounded-xl bg-[#FCE8E6] text-[#C5221F] text-xs font-medium">
                {routeError}
              </div>
            )}

            {!origin || !destination ? (
              <div className="py-10 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto mb-3">
                  <Navigation size={22} />
                </div>
                <p className="text-sm font-semibold text-[#202124]">
                  Search origin and destination
                </p>
                <p className="text-xs text-[#5F6368] mt-1">
                  Compare multiple live-traffic Google Maps routes and see real-time
                  time, distance, and congestion-adjusted CO₂e estimates.
                </p>
              </div>
            ) : activePanelTab === 'routes' ? (
              <div className="space-y-2.5">
                {activeRoutesWithEmissions.length === 0 && !routeLoading && (
                  <p className="text-xs text-[#5F6368] py-6 text-center">
                    No routes returned for {activeModeConfig.name}. Try another travel mode.
                  </p>
                )}

                {activeRoutesWithEmissions.map((route, idx) => {
                  const isSelected = idx === selectedRouteIndex;
                  const isEco = idx === ecoRouteIndex;
                  const trafficBadge =
                    TRAFFIC_BADGE_STYLES[route.trafficStatus] ||
                    TRAFFIC_BADGE_STYLES.light;

                  return (
                    <div
                      key={route.id || idx}
                      onClick={() => handleSelectRouteIndex(idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSelectRouteIndex(idx);
                        }
                      }}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? isEco
                            ? 'border-2 border-[#188038] bg-[#E6F4EA]/40 shadow-sm'
                            : 'border-2 border-[#1A73E8] bg-[#E8F0FE]/40 shadow-sm'
                          : 'border-[#DADCE0] bg-white hover:bg-[#F8F9FA]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-bold text-[#202124]">
                              {route.duration} min
                            </span>
                            <span className="text-xs font-medium text-[#5F6368]">
                              ({route.distance} km)
                            </span>
                            {isEco && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#137333]">
                                <Leaf size={11} />
                                Most eco
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#5F6368] mt-1">
                            via <span className="font-medium text-[#3C4043]">{route.summary}</span>
                          </p>
                          {route.transitSummary && (
                            <p className="text-xs text-[#5F6368] mt-1">
                              {route.transitSummary}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#202124]">
                            {route.emission.toFixed(2)} kg
                          </p>
                          <p className="text-[11px] text-[#5F6368]">CO₂e</p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${trafficBadge}`}
                        >
                          <Clock size={11} />
                          {route.trafficDelayMinutes > 0
                            ? `+${route.trafficDelayMinutes} min live traffic`
                            : 'Clear live traffic'}
                        </span>

                        {route.trafficImpact > 0 && (
                          <span className="text-[11px] text-[#5F6368]">
                            Base {route.baseEmission.toFixed(2)} kg + Traffic{' '}
                            +{route.trafficImpact.toFixed(2)} kg
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Baseline & Priority Controls */}
                <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#3C4043] mb-1">
                      Baseline vehicle for savings
                    </label>
                    <select
                      value={baselineVehicle}
                      onChange={(e) => setBaselineVehicle(e.target.value)}
                      className="w-full bg-white border border-[#DADCE0] text-xs text-[#202124] rounded-lg px-3 py-2 outline-none focus:border-[#1A73E8]"
                    >
                      <option value="petrol-car">Petrol Car (0.17 kg/km)</option>
                      <option value="diesel-car">Diesel Car (0.16 kg/km)</option>
                      <option value="petrol-two-wheeler">
                        Petrol Two-Wheeler (0.05 kg/km)
                      </option>
                      <option value="ev-car">EV Car (0.05 kg/km)</option>
                      <option value="auto-rickshaw">Auto-Rickshaw (0.09 kg/km)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-[#3C4043]">Route priority</span>
                      <span className="text-[#5F6368]">{routePriority}% eco weight</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={routePriority}
                      onChange={(e) => setRoutePriorityOverride(Number(e.target.value))}
                      className="w-full accent-[#1A73E8] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-[#5F6368]">
                      <span>Fastest time</span>
                      <span>Lowest CO₂e</span>
                    </div>
                  </div>
                </div>

                {/* Ranked Mode Cards */}
                {rankedResults.map((item) => {
                  const Icon = item.icon;
                  const isRecommended = item.mode === recommendedMode;
                  const trafficBadge =
                    TRAFFIC_BADGE_STYLES[item.trafficStatus] ||
                    TRAFFIC_BADGE_STYLES.light;

                  return (
                    <div
                      key={item.mode}
                      className={`p-3.5 rounded-xl border transition ${
                        isRecommended
                          ? 'border-2 border-[#188038] bg-[#E6F4EA]/30'
                          : 'border-[#DADCE0] bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0">
                            <Icon size={18} />
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-semibold text-[#202124]">
                                {item.name}
                              </h3>
                              {isRecommended && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E6F4EA] text-[#137333]">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#5F6368]">
                              {item.distance} km · {item.duration ?? '—'} min
                            </p>
                            {item.transitSummary && (
                              <p className="text-xs text-[#5F6368] mt-0.5">
                                {item.transitSummary}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-base font-bold text-[#202124]">
                            {item.emission} kg
                          </p>
                          <p className="text-[11px] text-[#5F6368]">CO₂e</p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md font-medium ${trafficBadge}`}>
                          {item.trafficDelayMinutes > 0
                            ? `+${item.trafficDelayMinutes} min traffic (+${item.trafficImpact} kg)`
                            : 'Clear traffic'}
                        </span>
                        <span className="text-[#5F6368]">
                          Est. ₹{item.cost}
                          {Number(item.carbonSaved) > 0 && (
                            <span className="text-[#137333] font-semibold ml-2">
                              · {item.carbonSaved} kg saved
                            </span>
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => saveJourney(item)}
                        disabled={savedModes[item.mode]}
                        className="mt-3 w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 bg-[#1A73E8] text-white hover:bg-[#1765CC] disabled:bg-[#E6F4EA] disabled:text-[#137333] transition cursor-pointer"
                      >
                        {savedModes[item.mode] ? (
                          <>
                            <Check size={14} />
                            Saved to History
                          </>
                        ) : (
                          'Save Journey'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Full-Bleed Google Map Canvas */}
        <main className="flex-1 min-w-0 lg:h-[calc(100vh-4rem)]">
          <MapView
            apiKey={googleMapsApiKey}
            origin={origin}
            destination={destination}
            routes={activeRoutesWithEmissions}
            selectedRouteIndex={selectedRouteIndex}
            onSelectRoute={handleSelectRouteIndex}
            ecoRouteIndex={ecoRouteIndex}
          />
        </main>
      </div>
    </div>
  );
}

export default RoutePlanner;