/**
 * useGoogleMaps.js
 *
 * Singleton hook that loads the Google Maps JavaScript API exactly once
 * across the entire React SPA session, no matter how many components
 * call it or how many times the user navigates between pages.
 *
 * Uses @react-google-maps/api's `useJsApiLoader` instead of `LoadScript`.
 *
 * WHY THIS FIXES "google api is already presented":
 *   - LoadScript (component) mounts/unmounts with the component tree, which
 *     can inject the Maps <script> tag more than once in a SPA.
 *   - useJsApiLoader keeps the loader state in a module-level singleton and
 *     never re-injects the script tag on subsequent calls.
 *
 * REQUIRED GOOGLE CLOUD APIS (all under the same key):
 *   • Maps JavaScript API  — renders the map tiles
 *   • Directions API       — needed for DirectionsService route calculation
 *                            (AgentDashboard only; map works without it)
 *
 * Libraries included:
 *   • 'marker' — required for AdvancedMarkerElement (replaces deprecated Marker)
 */

import { useJsApiLoader } from '@react-google-maps/api'

// Defined OUTSIDE any component/hook so the reference is stable across renders.
// Changing this array would cause @react-google-maps/api to warn and reload.
const LIBRARIES = ['marker']

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export function useGoogleMaps() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: MAPS_API_KEY,
    libraries:        LIBRARIES,
    // Use the latest stable Maps JS version explicitly to avoid
    // the "custom elements already defined" error from version mismatches.
    version:          'weekly',
    id:               'google-map-script', // stable ID prevents duplicate tags
  })

  return { isLoaded, loadError, hasKey: Boolean(MAPS_API_KEY) }
}
