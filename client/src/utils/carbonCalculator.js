export const BASELINE_FACTORS = {
  'petrol-car': 0.17,
  'diesel-car': 0.16,
  'petrol-two-wheeler': 0.05,
  'ev-car': 0.05,
  'auto-rickshaw': 0.09
};

export const COST_FACTORS = {
  bus: 0.05,
  train: 0.04,
  metro: 0.035,
  car: 10 / 15,
  'two-wheeler': 10 / 45,
  'auto-rickshaw': 12,
  'ev-car': 1.8,
  'ev-scooter': 0.3,
  bike: 0,
  walking: 0,
  multimodal: 0.06
};

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

  return transportModes
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
        distance: distance.toFixed(2),
        approximateDistance,
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
      return a.mode === 'car' ? -1 : 1;
    }
    return (
      Number(a.emission) +
      Number(a.distance) * 0.01 -
      (Number(b.emission) + Number(b.distance) * 0.01)
    );
  });
}
