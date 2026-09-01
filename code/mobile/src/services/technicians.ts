// Nearby-technician discovery for the customer home map.
//
// NOTE: the backend does not yet expose GET /api/technicians/nearby (no
// fundi accounts have completed profile verification yet - see
// busnessview.md / DevTechPlan.md). This module is wired up ahead of that
// so CustomerHomeScreen "just works" once that endpoint ships, without
// further changes here. Until then, any failure (404, network error, etc.)
// resolves to an empty list rather than throwing, which the screen renders
// as an empty state.

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export type Technician = {
  id: string;
  fullName: string;
  specialty: string;
  skills: string[];
  rating: number;
  distanceKm: number;
  isAvailable: boolean;
  avatarUrl?: string | null;
  latitude: number;
  longitude: number;
};

type NearbyTechniciansParams = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  token: string;
};

export async function fetchNearbyTechnicians({
  latitude,
  longitude,
  radiusKm = 2,
  token,
}: NearbyTechniciansParams): Promise<Technician[]> {
  try {
    const query = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
      radiusKm: String(radiusKm),
    });
    const res = await fetch(`${API_URL}/api/technicians/nearby?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // Includes the expected 404 while this endpoint doesn't exist yet.
      return [];
    }

    const data = await res.json();
    return Array.isArray(data.technicians) ? data.technicians : [];
  } catch (err) {
    console.log("fetchNearbyTechnicians: falling back to empty list", err);
    return [];
  }
}
