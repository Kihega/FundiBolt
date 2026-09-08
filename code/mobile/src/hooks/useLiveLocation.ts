import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

export type Coordinates = { latitude: number; longitude: number };

export type LiveLocationState = {
  /** The customer's current position - live-updating while permission is granted, otherwise the fallback passed in. */
  coords: Coordinates;
  /** True once we have a real device fix (as opposed to still showing the fallback). */
  hasRealFix: boolean;
  /** Set when permission was denied or the device couldn't produce a fix - a friendly message key is enough, the caller decides how to show it. */
  errorKey: "denied" | "unavailable" | null;
};

// How far the customer needs to actually move before we bother
// re-rendering/re-fetching - avoids refreshing the nearby-technicians
// list (and jittering the map) on every few-meter GPS wobble.
const DISTANCE_INTERVAL_METERS = 25;
// How often we ask for a fresh reading at minimum, regardless of movement -
// covers the case of standing still but wanting periodically-refreshed
// technician availability (a technician nearby may come online/offline).
const TIME_INTERVAL_MS = 8000;

/**
 * Watches the device's live GPS position for as long as the component
 * using this hook is mounted, starting from `fallback` until a real fix
 * arrives (or permission is denied/unavailable, in which case it stays on
 * `fallback` for the rest of the session).
 *
 * This is customer-side only: the position is used locally to center the
 * map and query nearby technicians - it is never sent to or stored on the
 * server (see services/technicians.ts). Contrast with
 * useTechnicianLocationBroadcast, which is the technician-side
 * counterpart that *does* publish location, for the opposite reason (so
 * customers can find them).
 */
export function useLiveLocation(fallback: Coordinates): LiveLocationState {
  const [state, setState] = useState<LiveLocationState>({ coords: fallback, hasRealFix: false, errorKey: null });
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (!permission.granted) {
        setState((prev) => ({ ...prev, errorKey: "denied" }));
        return;
      }

      try {
        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: TIME_INTERVAL_MS,
            distanceInterval: DISTANCE_INTERVAL_METERS,
          },
          (position) => {
            if (cancelled) return;
            setState({
              coords: { latitude: position.coords.latitude, longitude: position.coords.longitude },
              hasRealFix: true,
              errorKey: null,
            });
          }
        );
      } catch (err) {
        if (!cancelled) {
          console.log("useLiveLocation: falling back to default location", err);
          setState((prev) => ({ ...prev, errorKey: "unavailable" }));
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
    // fallback is only a starting point, not a reactive dependency -
    // re-running this effect if the caller's fallback object identity
    // changes would tear down and restart the GPS watch for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
