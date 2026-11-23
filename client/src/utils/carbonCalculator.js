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
  bus: 0.05,
  train: 0.04,
  car: 10 / 15,
  'two-wheeler': 10 / 45,
  'auto-rickshaw': 12,
  'ev-car': 1.8,
  'ev-scooter': 0.3,
  bike: 0,
  walking: 0
};

export function computeCarbonEquivalents(kgSaved) {
  const saved = Math.max(0, Number(kgSaved) || 0);
  return {
    trees: (saved / 21).toFixed(1),
    phoneCharges: Math.round(saved / 0.008),
    petrolLiters: (saved / 2.31).toFixed(1)
  };
}

// Decodes Mappls/Google encoded polyline5 string into [{ lat, lng }, ...]
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

export function calculateEmissionResults({
  transportModes,
  routeOptions,
  baselineVehicle = 'petrol-car'
}) {
  if (!routeOptions?.car) return [];

  const carDuration =
    routeOptions.car.duration != null ? Number(routeOptions.car.duration) : null;

  return transportModes
    .map((mode) => {
      let distance;
      let duration = null;
      let approximateDistance = false;
      let approximateDuration = false;

      if (mode.name === 'Car' || mode.mode === 'car') {
        distance = routeOptions.car.distance;
        duration = carDuration;
      } else if (mode.name === 'Bicycle' || mode.mode === 'bike') {
        if (!routeOptions.bike) return null;
        distance = routeOptions.bike.distance;
        duration =
          routeOptions.bike.duration != null
            ? Number(routeOptions.bike.duration)
            : null;
      } else if (mode.name === 'Walking' || mode.mode === 'walking') {
        if (!routeOptions.foot) return null;
        distance = routeOptions.foot.distance;
        duration =
          routeOptions.foot.duration != null
            ? Number(routeOptions.foot.duration)
            : null;
      } else if (mode.mode === 'bus' || mode.mode === 'train') {
        // Public transport uses car distance and scaled car duration as an approximation
        distance = routeOptions.car.distance;
        approximateDistance = true;
        duration = carDuration != null ? Math.round(carDuration * 1.4) : null;
        approximateDuration = duration != null;
      } else {
        // Other road modes use car route as an approximation
        distance = routeOptions.car.distance;
        approximateDistance = true;
        duration = carDuration;
        approximateDuration = duration != null;
      }

      const factor = mode.factor ?? EMISSION_FACTORS[mode.mode] ?? 0;
      const emission = distance * factor;
      const baselineEmission =
        routeOptions.car.distance * (BASELINE_FACTORS[baselineVehicle] ?? 0.17);

      const cost =
        mode.mode === 'auto-rickshaw'
          ? 30 + distance * 16
          : distance * (COST_FACTORS[mode.mode] ?? 0);

      const baselineCost =
        mode.mode === 'car'
          ? (distance * 10) / 15
          : distance * (BASELINE_FACTORS[baselineVehicle] === 0.05 ? 10 / 45 : 10 / 15);

      return {
        ...mode,
        factor,
        distance: distance.toFixed(2),
        duration,
        approximateDistance,
        approximateDuration,
        emission: emission.toFixed(2),
        carbonSaved: (baselineEmission - emission).toFixed(2),
        cost: cost.toFixed(0),
        costSaved: Math.max(0, baselineCost - cost).toFixed(0)
      };
    })
    .filter(Boolean);
}

export function rankEmissionResults(emissionResults, travelPreference = 'balanced') {
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
