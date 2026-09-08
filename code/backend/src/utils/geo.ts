// Great-circle distance between two lat/lng points, used to find and
// sort technicians near a customer's live location. No PostGIS or other
// DB-side geospatial extension needed: the candidate pool is filtered
// down to "role = fundi with a recent location ping" in SQL first (see
// controllers/technician.controller.ts), and this function only runs
// over that small, already-filtered set in application code - simple and
// portable across any plain Postgres host.
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const EARTH_RADIUS_KM = 6371;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

// A technician only appears on a customer's map while their last
// location ping is within this window - this recency check IS the
// "online / ready to receive bookings" signal for this feature (see
// User.locationUpdatedAt in schema.prisma). Deliberately shorter than the
// general ONLINE_THRESHOLD_MINUTES used for the profile "online dot" on
// mobile (utils/onlineStatus.ts): live map presence should reflect
// near-real-time availability, not just "used the app recently".
export const LOCATION_FRESHNESS_MINUTES = 3;
