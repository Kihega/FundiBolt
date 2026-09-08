import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { Technician } from "../services/technicians";
import TechnicianCard from "./TechnicianCard";
import { RECENTER_BUTTON_SIZE } from "./RecenterCompassButton";

type Coordinates = { latitude: number; longitude: number };

type Props = {
  technicians: Technician[];
  /** The customer's current position - drives the map's initial center. */
  userLocation: Coordinates;
  radiusKm: number;
  onSelectTechnician: (id: string | null) => void;
  selectedTechnicianId: string | null;
  onBookTechnician: (technician: Technician) => void;
  onDiscardTechnician: (technicianId: string) => void;
};

// The compass/refresh button (see CustomerHomeScreen + RecenterCompassButton)
// pokes RECENTER_BUTTON_SIZE / 2 up into the map from the nav-bar boundary.
// Cards need to clear that plus a bit of breathing room so the two don't
// visually collide near the bottom of the map.
const CARDS_BOTTOM_OFFSET = RECENTER_BUTTON_SIZE / 2 + 16;

// Rough radius-in-km -> Leaflet zoom-level mapping. Not meant to be
// precise - just a sane starting zoom so a 2km search radius doesn't open
// zoomed out to the whole city or zoomed in past street level.
function radiusKmToZoom(radiusKm: number): number {
  if (radiusKm <= 1) return 15;
  if (radiusKm <= 3) return 14;
  if (radiusKm <= 6) return 13;
  if (radiusKm <= 12) return 12;
  return 11;
}

function escapeForHtmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Builds the static HTML page once per mount (see the useState lazy
// initializer below) - the map itself is only ever created here, at
// startup. Every subsequent update (the customer's live position moving,
// the technician list changing, selection changing) flows in afterward
// through postMessage instead of reloading this HTML, so the WebView
// never flickers/reloads on a routine GPS update.
function buildLeafletHtml(initialLat: number, initialLng: number, initialZoom: number, cartoApiKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #E9E7F5; }
    .fb-user-wrap { position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
    .fb-user-pulse {
      position: absolute; width: 28px; height: 28px; border-radius: 14px;
      background: #22C55E; opacity: 0.5;
      animation: fbPulse 1.4s ease-out infinite;
    }
    @keyframes fbPulse {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    .fb-user-dot { width: 18px; height: 18px; border-radius: 9px; background: #22C55E; border: 3px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.35); }
    .fb-tech-pin {
      width: 44px; height: 44px; border-radius: 22px; border: 2px solid #22C55E; background: #FFFFFF;
      overflow: hidden; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.28);
    }
    .fb-tech-pin.unavailable { border-color: #9AA0A6; opacity: 0.85; }
    .fb-tech-pin.selected { box-shadow: 0 0 0 3px rgba(34,197,94,0.35), 0 1px 4px rgba(0,0,0,0.28); }
    .fb-tech-pin img { width: 100%; height: 100%; object-fit: cover; }
    .fb-tech-initials { font-family: -apple-system, sans-serif; font-weight: 700; font-size: 14px; color: #6D28D9; }
    .leaflet-control-attribution { font-size: 9px; }
    .leaflet-control-zoom { border: none !important; margin: 12px !important; }
    .leaflet-control-zoom a {
      width: 34px !important; height: 34px !important; line-height: 34px !important;
      font-size: 18px !important; color: #3B2F63 !important;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2) !important;
    }
    /* Basemap has its own bright, saturated palette by design (see the
       tileLayer call below) - avoid the CSS filters some Leaflet demos
       use to force a dark map, since exactly that kind of visual
       tinkering is what caused the visibility complaints this map went
       through before landing here. */
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      var map = L.map("map", { zoomControl: false, attributionControl: true }).setView([${initialLat}, ${initialLng}], ${initialZoom});
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // CARTO's Voyager basemap: brighter, more colorful, and far more
      // legible than plain default OpenStreetMap tiles (proper road
      // hierarchy shading, clearer labels, visible parks/water) - closer
      // to the look of Bolt/Uber's own maps. Requires a free API key
      // (5,000,000 tile requests/month) as of late 2025 - see
      // EXPO_PUBLIC_CARTO_API_KEY in .env.example for how to get and set
      // one. If it's ever unset, this degrades gracefully to CARTO's "API
      // key required" watermark rather than crashing the map.
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoApiKey}", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
      }).addTo(map);

      var userMarker = null;
      var userCircle = null;
      var techMarkers = {};

      function post(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function setUserLocation(lat, lng) {
        var latlng = [lat, lng];
        // Real-world-scaled halo (radius in meters) - genuinely
        // grows/shrinks with zoom, not a fixed pixel size.
        if (!userCircle) {
          userCircle = L.circle(latlng, {
            radius: 150,
            color: "#22C55E",
            weight: 1,
            fillColor: "#22C55E",
            fillOpacity: 0.18
          }).addTo(map);
        } else {
          userCircle.setLatLng(latlng);
        }
        if (!userMarker) {
          var icon = L.divIcon({
            className: "",
            html: '<div class="fb-user-wrap"><div class="fb-user-pulse"></div><div class="fb-user-dot"></div></div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          userMarker = L.marker(latlng, { icon: icon, zIndexOffset: 1000, interactive: false }).addTo(map);
        } else {
          userMarker.setLatLng(latlng);
        }
      }

      function initials(name) {
        var parts = (name || "").trim().split(/\\s+/).filter(Boolean);
        if (parts.length === 0) return "?";
        var first = parts[0][0];
        var last = parts.length > 1 ? parts[parts.length - 1][0] : "";
        return (first + last).toUpperCase();
      }

      function technicianPinHtml(t) {
        var inner = t.avatarUrl
          ? '<img src="' + t.avatarUrl + '" />'
          : '<span class="fb-tech-initials">' + initials(t.fullName) + "</span>";
        var cls = "fb-tech-pin" + (t.isAvailable ? "" : " unavailable") + (t.isSelected ? " selected" : "");
        return '<div class="' + cls + '">' + inner + "</div>";
      }

      function setTechnicians(list) {
        var seen = {};
        (list || []).forEach(function (t) {
          seen[t.id] = true;
          var latlng = [t.latitude, t.longitude];
          var icon = L.divIcon({ className: "", html: technicianPinHtml(t), iconSize: [44, 44], iconAnchor: [22, 22] });
          if (techMarkers[t.id]) {
            techMarkers[t.id].setLatLng(latlng);
            techMarkers[t.id].setIcon(icon);
          } else {
            var marker = L.marker(latlng, { icon: icon }).addTo(map);
            marker.on("click", function () {
              post({ type: "selectTechnician", id: t.id });
            });
            techMarkers[t.id] = marker;
          }
        });
        Object.keys(techMarkers).forEach(function (id) {
          if (!seen[id]) {
            map.removeLayer(techMarkers[id]);
            delete techMarkers[id];
          }
        });
      }

      function handleMessage(event) {
        try {
          var data = JSON.parse(event.data);
          if (data.type === "setUserLocation") {
            setUserLocation(data.latitude, data.longitude);
          } else if (data.type === "setTechnicians") {
            setTechnicians(data.technicians);
          } else if (data.type === "recenter") {
            map.setView([data.latitude, data.longitude], map.getZoom());
          }
        } catch (e) {
          // Ignore malformed messages rather than crashing the page.
        }
      }

      // Android and iOS deliver React Native WebView's postMessage events
      // on different global targets - listening on both is the standard,
      // well-known defensive pattern for this bridge.
      document.addEventListener("message", handleMessage);
      window.addEventListener("message", handleMessage);

      setUserLocation(${initialLat}, ${initialLng});
      post({ type: "ready" });
    })();
  </script>
</body>
</html>`;
}

/**
 * Map powered by Leaflet + free raster tiles, rendered inside a WebView.
 *
 * This is not the first choice tried - react-native-maps was tried three
 * separate times in this project (default style, a custom dark style,
 * and finally a byte-for-byte "known good" version with only color
 * tweaks) and consistently rendered as a blank/black view every time in
 * this project's actual Expo Go setup, regardless of styling. That rules
 * out a styling bug and points to react-native-maps itself not working
 * in this environment - which lines up with Expo's own documentation:
 * react-native-maps needs custom native code and is listed as requiring
 * a development build, not plain Expo Go. If you ever see an old code
 * comment elsewhere claiming otherwise ("works out of the box in Expo
 * Go"), that claim is what's wrong, not this file.
 *
 * Leaflet + raster tiles need no native module at all - it's just a web
 * page - so it works in plain Expo Go with no API key, no billing, and no
 * native build. Trade-off: gesture smoothness and marker rendering are
 * noticeably less polished than a real native map, especially with many
 * markers. That's an acceptable, deliberate trade for this
 * early-development stage - see the doc comments in
 * hooks/useTechnicianLocationBroadcast.ts and the tile provider note
 * below for what to revisit before a real store release.
 *
 * Tile provider: CARTO's free "Voyager" basemap (bright, clearly labeled
 * roads/parks/water) rather than plain default OpenStreetMap tiles,
 * which was the "poor map vision" complaint that led here - default OSM
 * styling is comparatively flat and low-contrast. No API key needed for
 * either.
 *
 * The external contract is unchanged from the native-maps version: same
 * props (technicians, userLocation, radiusKm, ...), so
 * CustomerHomeScreen.tsx needs no changes either way this component's
 * internals are implemented.
 *
 * Bridge protocol (see buildLeafletHtml): the page starts empty, reports
 * {type:"ready"} once its map is constructed, and from then on this
 * component pushes {type:"setUserLocation"} / {type:"setTechnicians"} in
 * as those props change, while the page pushes {type:"selectTechnician"}
 * back out when a technician marker is tapped.
 */
export default function MapSection({
  technicians,
  userLocation,
  radiusKm,
  onSelectTechnician,
  selectedTechnicianId,
  onBookTechnician,
  onDiscardTechnician,
}: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [isReady, setReady] = useState(false);

  // Lazy initializer - the HTML string (and therefore the map itself) is
  // built exactly once, from whatever userLocation/radiusKm were at first
  // mount. Later changes to either never regenerate this or reload the
  // WebView; they flow through postMessage instead (see the two effects
  // below).
  const [html] = useState(() =>
    buildLeafletHtml(
      userLocation.latitude,
      userLocation.longitude,
      radiusKmToZoom(radiusKm),
      process.env.EXPO_PUBLIC_CARTO_API_KEY || ""
    )
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "ready") {
          setReady(true);
        } else if (data.type === "selectTechnician") {
          onSelectTechnician(data.id === selectedTechnicianId ? null : data.id);
        }
      } catch {
        // Ignore malformed messages from the page rather than crashing.
      }
    },
    [onSelectTechnician, selectedTechnicianId]
  );

  useEffect(() => {
    if (!isReady) return;
    webViewRef.current?.postMessage(
      JSON.stringify({ type: "setUserLocation", latitude: userLocation.latitude, longitude: userLocation.longitude })
    );
  }, [isReady, userLocation.latitude, userLocation.longitude]);

  const technicianPayload = useMemo(
    () =>
      technicians.map((t) => ({
        id: t.id,
        latitude: t.latitude,
        longitude: t.longitude,
        fullName: t.fullName,
        avatarUrl: t.avatarUrl ? escapeForHtmlAttribute(t.avatarUrl) : null,
        isAvailable: t.isAvailable,
        isSelected: t.id === selectedTechnicianId,
      })),
    [technicians, selectedTechnicianId]
  );

  useEffect(() => {
    if (!isReady) return;
    webViewRef.current?.postMessage(JSON.stringify({ type: "setTechnicians", technicians: technicianPayload }));
  }, [isReady, technicianPayload]);

  return (
    <View style={styles.map}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        originWhitelist={["*"]}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
      />

      {/* Nearest-technician cards float directly on the map, above the
          bottom nav bar. Per the wireframe: Case 1 - shown only when
          technicians are found nearby. Case 2 - when there are none, this
          is omitted entirely and the search bar up top is how the
          customer looks for a technician instead. */}
      {technicians.length > 0 && (
        <View style={styles.cardsOverlay} pointerEvents="box-none">
          <View
            style={[
              styles.radiusPill,
              { backgroundColor: colors.backgroundElevated, borderColor: colors.border, borderRadius: radius.full },
            ]}
          >
            <Ionicons name="radio-outline" size={12} color={colors.success} />
            <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginLeft: 4 }}>
              Within {radiusKm} km
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs }}
          >
            {technicians.map((technician) => (
              <TechnicianCard
                key={technician.id}
                technician={technician}
                onBook={onBookTechnician}
                onDiscarded={onDiscardTechnician}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, width: "100%", overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "transparent" },
  cardsOverlay: { position: "absolute", left: 0, right: 0, bottom: CARDS_BOTTOM_OFFSET, zIndex: 3 },
  radiusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginLeft: 24,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
});
