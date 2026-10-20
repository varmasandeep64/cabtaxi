// Shared fare rules — used by the booking page (estimate) and the server (actual charge).
export const RIDE_TYPES = {
  'cabTaxi Go': { perKm: 15, minFare: 50 },
  'cabTaxi Premier': { perKm: 22, minFare: 90 },
};

export function calcFare(distanceKm, rideType) {
  const rules = RIDE_TYPES[rideType];
  if (!rules || !(distanceKm > 0)) return null;
  return Math.max(rules.minFare, Math.round(distanceKm * rules.perKm));
}

// Straight-line distance in km (fallback if the routing service is down).
export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function isValidCoords(c) {
  return (
    Array.isArray(c) &&
    c.length === 2 &&
    Number.isFinite(c[0]) &&
    Number.isFinite(c[1]) &&
    Math.abs(c[0]) <= 90 &&
    Math.abs(c[1]) <= 180
  );
}

// Service area: Mumbai Metropolitan Region (Mumbai, Thane, Kalyan, Ulhasnagar, Navi Mumbai, Vasai-Virar...)
export const SERVICE_AREA = { minLat: 18.85, maxLat: 19.65, minLon: 72.75, maxLon: 73.45 };
export const SERVICE_AREA_NAME = 'Mumbai region';
export const MAX_TRIP_KM = 80;

export function inServiceArea(c) {
  return (
    isValidCoords(c) &&
    c[0] >= SERVICE_AREA.minLat && c[0] <= SERVICE_AREA.maxLat &&
    c[1] >= SERVICE_AREA.minLon && c[1] <= SERVICE_AREA.maxLon
  );
}
