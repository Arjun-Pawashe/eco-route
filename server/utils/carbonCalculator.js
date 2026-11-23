const EMISSION_FACTORS = {
    bus: 0.08,
    train: 0.04,
    metro: 0.035,
    car: 0.17,
    'petrol-car': 0.17,
    'diesel-car': 0.16,
    bike: 0,
    walking: 0,
    'two-wheeler': 0.05,
    'petrol-two-wheeler': 0.05,
    'auto-rickshaw': 0.09,
    'ev-car': 0.05,
    'ev-scooter': 0.02,
    multimodal: 0.04
};

const calculateCarbon = (mode, distanceKm, vehicleType) => {
    const factor = vehicleType && EMISSION_FACTORS[vehicleType] !== undefined
        ? EMISSION_FACTORS[vehicleType]
        : (EMISSION_FACTORS[mode] ?? 0);
    return Number((Number(distanceKm) * factor).toFixed(3));
};

module.exports = { calculateCarbon, EMISSION_FACTORS };