import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";
import { haversineDistanceKm, LOCATION_FRESHNESS_MINUTES } from "../utils/geo";
import { toAbsoluteAvatarUrl } from "../utils/publicUrl";

// Defensive caps - neither is about correctness, both are about not
// letting a single request turn into an unbounded scan or an oversized
// response as the number of technicians grows.
const MAX_RADIUS_KM = 25;
const MAX_CANDIDATE_POOL = 500;
const MAX_RESULTS = 50;
const DEFAULT_RADIUS_KM = 2;

function parseLatOrLng(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

// Technicians visible to a customer on the home map: role = fundi, with a
// location ping recent enough to count as online and ready for bookings
// (see LOCATION_FRESHNESS_MINUTES - that recency check is the entire
// "online" signal for this feature, there's no separate isAvailable
// column). Distance is computed with the Haversine formula over an
// already-filtered, small candidate pool rather than a DB-side
// geospatial extension - see utils/geo.ts for why that's enough for now.
export async function getNearbyTechnicians(req: AuthedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  const latitude = parseLatOrLng(req.query.lat, -90, 90);
  const longitude = parseLatOrLng(req.query.lng, -180, 180);
  if (latitude === null || longitude === null) {
    return res.status(400).json({ message: "Valid lat and lng query parameters are required." });
  }

  const requestedRadiusKm = Number(req.query.radiusKm);
  const radiusKm =
    Number.isFinite(requestedRadiusKm) && requestedRadiusKm > 0
      ? Math.min(requestedRadiusKm, MAX_RADIUS_KM)
      : DEFAULT_RADIUS_KM;

  try {
    const freshSince = new Date(Date.now() - LOCATION_FRESHNESS_MINUTES * 60 * 1000);

    const candidates = await prisma.user.findMany({
      where: {
        role: "fundi",
        latitude: { not: null },
        longitude: { not: null },
        locationUpdatedAt: { gte: freshSince },
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        specialty: true,
        skills: true,
        rating: true,
        latitude: true,
        longitude: true,
      },
      take: MAX_CANDIDATE_POOL,
    });

    const technicians = candidates
      .map((t) => ({
        id: t.id,
        fullName: t.fullName,
        // specialty is presentation-only fallback text, not a stored
        // fake value - the database column stays genuinely null until a
        // technician sets their own specialty (that profile-editing flow
        // doesn't exist yet).
        specialty: t.specialty || "Technician",
        skills: t.skills,
        rating: t.rating ?? 0,
        avatarUrl: toAbsoluteAvatarUrl(t.avatarUrl),
        latitude: t.latitude as number,
        longitude: t.longitude as number,
        distanceKm: haversineDistanceKm(latitude, longitude, t.latitude as number, t.longitude as number),
        // Inclusion in this list already means role=fundi with a fresh
        // location ping - i.e. online right now - so this is always true
        // for anything that reaches here.
        isAvailable: true,
      }))
      .filter((t) => t.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, MAX_RESULTS);

    return res.status(200).json({ technicians });
  } catch (err) {
    console.error("Get nearby technicians error:", err);
    return res.status(500).json({ message: "Could not load nearby technicians." });
  }
}
