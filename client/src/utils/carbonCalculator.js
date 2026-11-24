export const EMISSION_FACTORS = {
  bus: 0.08,
  train: 0.04,
  car: 0.17,
  'two-wheeler': 0.05,
  'auto-rickshaw': 0.09,
  'ev-car': 0.05,
  'ev-scooter': 0.02,
  bike: 0,
  walking: 0
};

export const BASELINE_FACTORS = {
  'petrol-car': EMISSION_FACTORS.car,
  'diesel-car': 0.16,
  'petrol-two-wheeler': EMISSION_FACTORS['two-wheeler'],
  'ev-car': EMISSION_FACTORS['ev-car'],
  'auto-rickshaw': EMISSION_FACTORS['auto-rickshaw']
};

export const COST_FACTORS = {
  bus: 1.5,
  train: 0.8,
  car: 10 / 15,
  'two-wheeler': 10 / 45,
  'auto-rickshaw': 12,
  'ev-car': 1.8,
  'ev-scooter': 0.3,
  bike: 0,
  walking: 0
};

// Sensitivity to stop-and-go congestion and idle CO2e (kg/hour of traffic delay)
const TRAFFIC_SENSITIVITY = {
  car: { congestionPenaltyRate: 0.35, idleKgPerHour: 0.85 },
  'auto-rickshaw': { congestionPenaltyRate: 0.35, idleKgPerHour: 0.45 },
  'two-wheeler': { congestionPenaltyRate: 0.2, idleKgPerHour: 0.25 },
  bus: { congestionPenaltyRate: 0.25, idleKgPerHour: 0.35 },
  'ev-car': { congestionPenaltyRate: 0.05, idleKgPerHour: 0.15 },
  'ev-scooter': { congestionPenaltyRate: 0.04, idleKgPerHour: 0.03 },
  train: { congestionPenaltyRate: 0, idleKgPerHour: 0 },
  bike: { congestionPenaltyRate: 0, idleKgPerHour: 0 },
  walking: { congestionPenaltyRate: 0, idleKgPerHour: 0 }
};

export function computeCarbonEquivalents(kgSaved) {
  const saved = Math.max(0, Number(kgSaved) || 0);
  return {
    trees: (saved / 21).toFixed(1),
    phoneCharges: Math.round(saved / 0.008),
    petrolLiters: (saved / 2.31).toFixed(1)
  };
}

// Decodes Google/Mappls encoded polyline5 string into [{ lat, lng }, ...]
export function decodePolyline(encoded) {
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

/**
 * Computes live-traffic-adjusted CO2e emission for a single route and mode.
 * Incorporates distance, traffic congestion ratio (duration / staticDuration),
 * and traffic delay minutes (idling/stop-and-go).
 */
export function calculateRouteEmission({
  distanceKm,
  durationMin,
  staticDurationMin,
  trafficDelayMinutes,
  congestionRatio,
  mode,
  factor
}) {
  const dist = Math.max(0, Number(distanceKm) || 0);
  const effectiveFactor = factor ?? EMISSION_FACTORS[mode] ?? 0;
  const baseEmission = dist * effectiveFactor;

  if (effectiveFactor === 0) {
    return {
      baseEmission: 0,
      trafficImpact: 0,
      totalEmission: 0,
      trafficMultiplier: 1,
      trafficDelayMinutes: 0,
      congestionRatio: 1
    };
  }

  const sensitivity = TRAFFIC_SENSITIVITY[mode] || {
    congestionPenaltyRate: 0.2,
    idleKgPerHour: 0.3
  };

  const resolvedStatic =
    staticDurationMin != null && Number(staticDurationMin) > 0
      ? Number(staticDurationMin)
      : Number(durationMin) || 0;
  const resolvedDuration = Number(durationMin) || resolvedStatic;
  const delayMin =
    trafficDelayMinutes != null
      ? Math.max(0, Number(trafficDelayMinutes))
      : Math.max(0, resolvedDuration - resolvedStatic);

  const ratio =
    congestionRatio != null && Number(congestionRatio) >= 1
      ? Number(congestionRatio)
      : resolvedStatic > 0
        ? Math.max(1, resolvedDuration / resolvedStatic)
        : 1;

  const trafficMultiplier =
    1 + sensitivity.congestionPenaltyRate * Math.max(0, ratio - 1);
  const idleEmission = (delayMin / 60) * sensitivity.idleKgPerHour;
  const totalEmission = baseEmission * trafficMultiplier + idleEmission;
  const trafficImpact = Math.max(0, totalEmission - baseEmission);

  return {
    baseEmission,
    trafficImpact,
    totalEmission,
    trafficMultiplier: Number(trafficMultiplier.toFixed(3)),
    trafficDelayMinutes: Math.round(delayMin),
    congestionRatio: Number(ratio.toFixed(2))
  };
}

function getRouteArray(routeOptions, key) {
  const entry = routeOptions?.[key];
  if (Array.isArray(entry)) return entry;
  if (entry && typeof entry === 'object') return [entry];
  return [];
}

export function calculateEmissionResults({
  transportModes,
  routeOptions,
  selectedRouteIndices = {},
  baselineVehicle = 'petrol-car'
}) {
  const carRoutes = getRouteArray(routeOptions, 'car');
  if (carRoutes.length === 0) return [];

  const carRoute =
    carRoutes[selectedRouteIndices.car ?? 0] || carRoutes[0];
  const twoWheelerRoutes = getRouteArray(routeOptions, 'twoWheeler');
  const twoWheelerRoute =
    twoWheelerRoutes[selectedRouteIndices.twoWheeler ?? 0] ||
    twoWheelerRoutes[0] ||
    carRoute;
  const transitRoutes = getRouteArray(routeOptions, 'transit');
  const transitRoute =
    transitRoutes[selectedRouteIndices.transit ?? 0] || transitRoutes[0];
  const bikeRoutes = getRouteArray(routeOptions, 'bike');
  const bikeRoute =
    bikeRoutes[selectedRouteIndices.bike ?? 0] || bikeRoutes[0];
  const footRoutes = getRouteArray(routeOptions, 'foot');
  const footRoute =
    footRoutes[selectedRouteIndices.foot ?? 0] || footRoutes[0];

  const baselineStats = calculateRouteEmission({
    distanceKm: carRoute.distance,
    durationMin: carRoute.duration,
    staticDurationMin: carRoute.staticDuration,
    trafficDelayMinutes: carRoute.trafficDelayMinutes,
    congestionRatio: carRoute.congestionRatio,
    mode:
      baselineVehicle === 'ev-car'
        ? 'ev-car'
        : baselineVehicle === 'petrol-two-wheeler'
          ? 'two-wheeler'
          : baselineVehicle === 'auto-rickshaw'
            ? 'auto-rickshaw'
            : 'car',
    factor: BASELINE_FACTORS[baselineVehicle] ?? 0.17
  });

  return transportModes
    .map((mode) => {
      let activeRoute = null;
      let approximateDistance = false;
      let approximateDuration = false;

      if (mode.mode === 'car' || mode.mode === 'ev-car') {
        activeRoute = carRoute;
      } else if (mode.mode === 'two-wheeler' || mode.mode === 'ev-scooter') {
        activeRoute = twoWheelerRoute;
        approximateDistance = twoWheelerRoutes.length === 0;
        approximateDuration = twoWheelerRoutes.length === 0;
      } else if (mode.mode === 'auto-rickshaw') {
        activeRoute = carRoute;
        approximateDistance = true;
        approximateDuration = true;
      } else if (mode.mode === 'bike') {
        if (!bikeRoute) return null;
        activeRoute = bikeRoute;
      } else if (mode.mode === 'walking') {
        if (!footRoute) return null;
        activeRoute = footRoute;
      } else if (mode.mode === 'bus' || mode.mode === 'train') {
        if (transitRoute) {
          activeRoute = transitRoute;
        } else {
          activeRoute = {
            ...carRoute,
            duration:
              carRoute.duration != null
                ? Math.round(carRoute.duration * 1.35)
                : null
          };
          approximateDistance = true;
          approximateDuration = true;
        }
      }

      if (!activeRoute) return null;

      const distance = Number(activeRoute.distance || 0);
      const duration =
        activeRoute.duration != null ? Number(activeRoute.duration) : null;

      const emissionStats = calculateRouteEmission({
        distanceKm: distance,
        durationMin: duration,
        staticDurationMin: activeRoute.staticDuration,
        trafficDelayMinutes: activeRoute.trafficDelayMinutes,
        congestionRatio: activeRoute.congestionRatio,
        mode: mode.mode,
        factor: mode.factor
      });

      const cost =
        mode.mode === 'auto-rickshaw'
          ? 30 + distance * 16
          : distance * (COST_FACTORS[mode.mode] ?? 0);

      const baselineCost =
        mode.mode === 'car'
          ? (carRoute.distance * 10) / 15
          : carRoute.distance *
            (BASELINE_FACTORS[baselineVehicle] === 0.05 ? 10 / 45 : 10 / 15);

      return {
        ...mode,
        factor: mode.factor ?? EMISSION_FACTORS[mode.mode] ?? 0,
        distance: distance.toFixed(2),
        duration,
        staticDuration: activeRoute.staticDuration ?? duration,
        trafficDelayMinutes: emissionStats.trafficDelayMinutes,
        congestionRatio: emissionStats.congestionRatio,
        trafficStatus: activeRoute.trafficStatus || 'light',
        routeSummary: activeRoute.summary || '',
        approximateDistance,
        approximateDuration,
        baseEmission: emissionStats.baseEmission.toFixed(2),
        trafficImpact: emissionStats.trafficImpact.toFixed(2),
        emission: emissionStats.totalEmission.toFixed(2),
        carbonSaved: (
          baselineStats.totalEmission - emissionStats.totalEmission
        ).toFixed(2),
        cost: cost.toFixed(0),
        costSaved: Math.max(0, baselineCost - cost).toFixed(0)
      };
    })
    .filter(Boolean);
}

export function rankEmissionResults(
  emissionResults,
  travelPreference = 'balanced'
) {
  if (typeof travelPreference === 'number') {
    const carbonPriority = Math.min(100, Math.max(0, travelPreference)) / 100;
    const durations = emissionResults
      .map((result) => result.duration)
      .filter(Number.isFinite);
    const emissions = emissionResults
      .map((result) => Number(result.emission))
      .filter(Number.isFinite);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const minEmission = Math.min(...emissions);
    const maxEmission = Math.max(...emissions);

    const durationScore = (result) => {
      if (!Number.isFinite(result.duration)) return durations.length > 0 ? 1 : 0;
      if (maxDuration === minDuration) return 0;
      return (result.duration - minDuration) / (maxDuration - minDuration);
    };
    const emissionScore = (result) => {
      const emission = Number(result.emission);
      if (maxEmission === minEmission) return 0;
      return (emission - minEmission) / (maxEmission - minEmission);
    };
    const score = (result) =>
      durationScore(result) * (1 - carbonPriority) +
      emissionScore(result) * carbonPriority;

    return [...emissionResults].sort((a, b) => {
      const scoreDifference = score(a) - score(b);
      if (scoreDifference !== 0) return scoreDifference;
      return (
        emissionScore(a) - emissionScore(b) ||
        durationScore(a) - durationScore(b)
      );
    });
  }

  return [...emissionResults].sort((a, b) => {
    if (travelPreference === 'lowest-carbon') {
      return Number(a.emission) - Number(b.emission);
    }
    if (travelPreference === 'fastest') {
      const aDur = a.duration ?? Number.POSITIVE_INFINITY;
      const bDur = b.duration ?? Number.POSITIVE_INFINITY;
      if (aDur !== bDur) {
        return aDur - bDur;
      }
      if (a.mode === 'car' && b.mode !== 'car') return -1;
      if (b.mode === 'car' && a.mode !== 'car') return 1;
      return Number(a.emission) - Number(b.emission);
    }
    return (
      Number(a.emission) +
      Number(a.distance) * 0.01 -
      (Number(b.emission) + Number(b.distance) * 0.01)
    );
  });
}
