import { useEffect, useRef } from "react";
import * as Location from "expo-location";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

// Matches useLiveLocation's own interval on the customer side - frequent
// enough that a technician's pin feels "live" on a customer's map,
// without pinging the server on every meter of GPS noise.
const DISTANCE_INTERVAL_METERS = 25;
const TIME_INTERVAL_MS = 8000;

/**
 * Technician-side counterpart to useLiveLocation: while `enabled`, watches
 * the device's position and PATCHes it to the backend
 * (see PATCH /api/users/me/location), which is what makes this technician
 * show up on a customer's nearby-technicians map (see
 * services/technicians.ts, MapSection.tsx) for as long as pings keep
 * arriving - see LOCATION_FRESHNESS_MINUTES on the backend for exactly
 * how "as long as".
 *
 * There is no technician-facing home screen yet to call this from (see
 * DevTechPlan.md) - this hook is wired up ahead of that screen existing,
 * the same way services/technicians.ts was wired up ahead of the backend
 * endpoint it calls, so nothing else needs to change here once that
 * screen lands: it just needs to call `useTechnicianLocationBroadcast(token, isOnlineToggle)`.
 *
 * Deliberately fire-and-forget per ping (no retry/backoff, no loading or
 * error UI) - a single missed ping just means this technician briefly
 * doesn't show up until the next successful one, which is an acceptable
 * degradation for a presence signal.
 */
export function useTechnicianLocationBroadcast(token: string, enabled: boolean) {
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function start() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (cancelled || !permission.granted) return;

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: TIME_INTERVAL_MS,
          distanceInterval: DISTANCE_INTERVAL_METERS,
        },
        (position) => {
          if (cancelled) return;
          fetch(`${API_URL}/api/users/me/location`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          }).catch((err) => console.log("useTechnicianLocationBroadcast: ping failed", err));
        }
      );
    }

    start();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [enabled, token]);
}
