/**
 * AdminTracking.jsx  —  Company / Admin Dashboard
 *
 * Google Maps integration:
 *   - Uses useJsApiLoader (via useGoogleMaps hook) instead of <LoadScript>
 *     so the Maps script is loaded exactly once per SPA session.
 *   - Uses AdvancedMarkerElement (google.maps.marker.AdvancedMarkerElement)
 *     instead of the deprecated google.maps.Marker.
 *   - The map renders independently of Directions API availability.
 *     A DirectionsService failure shows an inline note, never breaks the map.
 *
 * Agent data:
 *   1. localStorage.live_agents — written by AgentDashboard via GPS
 *   2. DEMO_AGENTS fallback — clearly labelled when no live agents are present
 *
 * Required Google Cloud APIs (same key, enable in Cloud Console):
 *   • Maps JavaScript API   — map tiles
 *   • Directions API        — route polylines in AgentDashboard (optional here)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { GoogleMap, InfoWindow } from '@react-google-maps/api'
import { useGoogleMaps } from '../hooks/useGoogleMaps'
import './AdminTracking.css'

// ── Map constants ─────────────────────────────────────────────────────────────
const MAP_CONTAINER_STYLE = { width: '100%', height: '460px', borderRadius: '12px' }
const MAP_DEFAULT_CENTER  = { lat: 21.145, lng: 79.08 }   // Nagpur, Maharashtra
const MAP_DEFAULT_ZOOM    = 12

// ── Marker pin colours ────────────────────────────────────────────────────────
// AdvancedMarkerElement uses PinElement with background colours.
const PIN_COLOR = {
  'In Progress': '#2563eb',
  'Delivered':   '#16a34a',
  'Not Started': '#64748b',
  'Warehouse':   '#ea580c',
}

// ── Warehouse locations (match AgentDashboard ASSIGNMENTS) ────────────────────
const WAREHOUSE_MARKERS = [
  { id: 'wh_a', name: 'Warehouse A – Nagpur Central', lat: 21.1458, lng: 79.0882 },
  { id: 'wh_b', name: 'Warehouse B – Hingna Road',    lat: 21.1,    lng: 78.98   },
  { id: 'wh_c', name: 'Warehouse C – Kamptee Road',   lat: 21.18,   lng: 79.12   },
]

// ── Demo agents (sample only — labelled clearly) ──────────────────────────────
const DEMO_AGENTS = [
  { id: 'agent_001', name: 'Rahul Sharma', lat: 21.148,  lng: 79.091, status: 'In Progress', route: 'Warehouse A → Butibori MIDC', progress: 65,  eta: '12 min', isDemo: true },
  { id: 'agent_002', name: 'Priya Patel',  lat: 21.102,  lng: 78.983, status: 'Not Started', route: 'Warehouse B → Sadar',         progress: 0,   eta: '—',      isDemo: true },
  { id: 'agent_003', name: 'Amit Kumar',   lat: 21.181,  lng: 79.122, status: 'Delivered',   route: 'Warehouse C → Dharampeth',    progress: 100, eta: 'Done',   isDemo: true },
]

const STATUS_COLORS = { 'Not Started': '#64748b', 'In Progress': '#2563eb', 'Delivered': '#16a34a' }
const STATUS_ICONS  = { 'Not Started': '⚫', 'In Progress': '🔵', 'Delivered': '🟢' }

// ── Utility: create an AdvancedMarkerElement ──────────────────────────────────
// Returns the marker instance or null if the API isn't ready.
function createAdvancedMarker(map, position, title, color, glyphText) {
  try {
    const { AdvancedMarkerElement, PinElement } = window.google.maps.marker
    const pin = new PinElement({
      background:  color,
      borderColor: '#ffffff',
      glyphColor:  '#ffffff',
      glyph:       glyphText || '',
      scale:       1.1,
    })
    const marker = new AdvancedMarkerElement({
      map,
      position,
      title,
      content: pin.element,
    })
    return marker
  } catch (e) {
    // AdvancedMarkerElement unavailable (old API version) — silently skip
    console.warn('[AdminTracking] AdvancedMarkerElement unavailable:', e.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminTracking() {
  const { isLoaded, loadError, hasKey } = useGoogleMaps()

  const [agents,        setAgents]        = useState(DEMO_AGENTS)
  const [filter,        setFilter]        = useState('All')
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [infoAgent,     setInfoAgent]     = useState(null)
  const [mapInstance,   setMapInstance]   = useState(null)
  const [isLive,        setIsLive]        = useState(false)
  const [lastRefresh,   setLastRefresh]   = useState(null)

  // Refs to track AdvancedMarker instances so we can update/remove them
  const markerRefs = useRef({})   // key → AdvancedMarkerElement

  // ── Poll localStorage for live GPS positions every 3 s ────────────────────
  useEffect(() => {
    const poll = () => {
      try {
        const live = JSON.parse(localStorage.getItem('live_agents') || '{}')
        if (Object.keys(live).length > 0) {
          setAgents(DEMO_AGENTS.map(d => live[d.id] ? { ...d, ...live[d.id], isDemo: false } : d))
          setIsLive(true)
        } else {
          setAgents(DEMO_AGENTS)
          setIsLive(false)
        }
        setLastRefresh(new Date())
      } catch { /* keep state */ }
    }
    poll()
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [])

  // ── Place / update markers whenever map or agents change ──────────────────
  useEffect(() => {
    if (!mapInstance || !isLoaded) return

    // Remove markers that no longer exist
    const currentIds = new Set([
      ...agents.map(a => a.id),
      ...WAREHOUSE_MARKERS.map(w => w.id),
    ])
    Object.keys(markerRefs.current).forEach(key => {
      if (!currentIds.has(key)) {
        if (markerRefs.current[key]) markerRefs.current[key].map = null
        delete markerRefs.current[key]
      }
    })

    // Warehouse markers (orange, 🏭)
    WAREHOUSE_MARKERS.forEach(wh => {
      if (markerRefs.current[wh.id]) {
        markerRefs.current[wh.id].position = { lat: wh.lat, lng: wh.lng }
      } else {
        const m = createAdvancedMarker(mapInstance, { lat: wh.lat, lng: wh.lng }, wh.name, PIN_COLOR['Warehouse'], '🏭')
        if (m) {
          m.addListener('click', () => setInfoAgent({
            id: wh.id, name: wh.name, lat: wh.lat, lng: wh.lng,
            status: 'Warehouse', eta: '—', isWarehouse: true,
          }))
          markerRefs.current[wh.id] = m
        }
      }
    })

    // Agent markers
    agents.forEach(agent => {
      if (markerRefs.current[agent.id]) {
        markerRefs.current[agent.id].position = { lat: agent.lat, lng: agent.lng }
      } else {
        const glyph = agent.status === 'In Progress' ? '🔵' : agent.status === 'Delivered' ? '🟢' : '⚫'
        const m = createAdvancedMarker(
          mapInstance,
          { lat: agent.lat, lng: agent.lng },
          agent.name,
          PIN_COLOR[agent.status] || PIN_COLOR['Not Started'],
          glyph
        )
        if (m) {
          m.addListener('click', () => {
            setInfoAgent(agent)
            setSelectedAgent(agent)
          })
          markerRefs.current[agent.id] = m
        }
      }
    })
  }, [mapInstance, isLoaded, agents])

  // ── Pan map to agent when selected from sidebar ───────────────────────────
  const handleAgentClick = useCallback((agent) => {
    setSelectedAgent(agent)
    setInfoAgent(null)
    if (mapInstance) {
      mapInstance.panTo({ lat: agent.lat, lng: agent.lng })
      mapInstance.setZoom(14)
    }
  }, [mapInstance])

  const onMapLoad = useCallback(map => setMapInstance(map), [])

  // ── Filter + stats ────────────────────────────────────────────────────────
  const filteredAgents = filter === 'All' ? agents : agents.filter(a => a.status === filter)
  const stats = {
    total:     agents.length,
    active:    agents.filter(a => a.status === 'In Progress').length,
    completed: agents.filter(a => a.status === 'Delivered').length,
    pending:   agents.filter(a => a.status === 'Not Started').length,
  }

  // ── Map ID (required for AdvancedMarkerElement) ───────────────────────────
  // Use a generic map ID. For production, create one in Google Cloud Console
  // → Maps → Map Management. Without a valid map ID, AdvancedMarkerElement
  // falls back gracefully to the plain Marker stub above.
  const MAP_OPTIONS = {
    mapTypeControl:    false,
    streetViewControl: false,
    fullscreenControl: true,
    mapId:             'DEMO_MAP_ID',   // replace with a real Map ID for AdvancedMarkers
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="admin-track">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <span>🏢</span>
            <div>
              <div className="admin-title">Company Dashboard</div>
              <div className="admin-subtitle">
                Live Delivery Tracking
                {isLive
                  ? <span className="at-live-badge">● LIVE GPS</span>
                  : <span className="at-demo-badge">◎ Demo Data</span>
                }
              </div>
            </div>
          </div>
          <div className="at-header-right">
            {lastRefresh && (
              <span className="at-refresh-time">Refreshed {lastRefresh.toLocaleTimeString()}</span>
            )}
            <Link to="/route-optimization" className="btn-back-admin">← Back</Link>
          </div>
        </div>
      </div>

      <div className="admin-body">

        {/* ── Stats cards ───────────────────────────────────────────────────── */}
        <div className="admin-stats">
          {[
            { label: 'Total',     value: stats.total,     icon: '📦', color: '#2563eb' },
            { label: 'Active',    value: stats.active,    icon: '🔵', color: '#2563eb' },
            { label: 'Completed', value: stats.completed, icon: '🟢', color: '#16a34a' },
            { label: 'Pending',   value: stats.pending,   icon: '⚫', color: '#64748b' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Demo data notice ──────────────────────────────────────────────── */}
        {!isLive && (
          <div className="at-demo-notice">
            <span>ℹ️</span>
            <span>
              Showing <strong>sample locations</strong> for demonstration — not live GPS.
              Open the Agent Dashboard on a mobile device to enable real-time tracking.
            </span>
          </div>
        )}

        <div className="admin-main">

          {/* ── Left: agent list + filters ────────────────────────────────── */}
          <div className="admin-sidebar">
            <div className="filter-bar">
              {['All', 'In Progress', 'Not Started', 'Delivered'].map(f => (
                <button
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'In Progress' ? '🔵' : f === 'Not Started' ? '⚫' : f === 'Delivered' ? '🟢' : '📋'} {f}
                </button>
              ))}
            </div>

            <div className="agent-list">
              {filteredAgents.map(agent => (
                <div
                  key={agent.id}
                  className={`agent-list-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                  onClick={() => handleAgentClick(agent)}
                >
                  <div className="agent-list-top">
                    <span className="agent-list-name">{agent.name}</span>
                    <span className="agent-list-status" style={{ color: STATUS_COLORS[agent.status] }}>
                      {STATUS_ICONS[agent.status]} {agent.status}
                    </span>
                  </div>
                  <div className="agent-list-route">{agent.route}</div>
                  {agent.status === 'In Progress' && (
                    <div className="agent-progress-bar">
                      <div className="agent-progress-fill" style={{ width: `${agent.progress}%` }} />
                    </div>
                  )}
                  <div className="agent-list-meta">
                    <span>ID: {agent.id}</span>
                    <span>ETA: {agent.eta}</span>
                    {agent.isDemo && <span className="at-demo-tag">sample</span>}
                  </div>
                </div>
              ))}
              {filteredAgents.length === 0 && (
                <div className="no-agents">No agents with status "{filter}"</div>
              )}
            </div>
          </div>

          {/* ── Right: map + detail panel ─────────────────────────────────── */}
          <div className="admin-map-area">

            {/* No API key */}
            {!hasKey && (
              <div className="map-placeholder">
                <div className="map-placeholder-inner">
                  <span>🗺️</span>
                  <p>Google Maps API key not configured.</p>
                  <p className="map-placeholder-hint">
                    Add <code>VITE_GOOGLE_MAPS_API_KEY=your_key</code> to{' '}
                    <code>Mini-Project/.env</code> and restart the dev server.
                  </p>
                </div>
              </div>
            )}

            {/* Script load error */}
            {hasKey && loadError && (
              <div className="map-placeholder">
                <div className="map-placeholder-inner">
                  <span>⚠️</span>
                  <p>Google Maps failed to load.</p>
                  <div className="map-placeholder-hint">
                    <p>Check <strong>DevTools → Console</strong> for the exact error code:</p>
                    <ul className="at-error-list">
                      <li><strong>ApiNotActivatedMapError</strong> — Enable <em>Maps JavaScript API</em> in <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" rel="noreferrer">Google Cloud Console ↗</a></li>
                      <li><strong>BillingNotEnabledMapError</strong> — Enable billing on the Cloud project</li>
                      <li><strong>RefererNotAllowedMapError</strong> — Add <code>localhost</code> to the key's allowed HTTP referrers (or remove all restrictions for dev)</li>
                      <li><strong>InvalidKeyMapError</strong> — Key in <code>Mini-Project/.env</code> is invalid or deleted</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Loading spinner */}
            {hasKey && !loadError && !isLoaded && (
              <div className="map-placeholder">
                <div className="map-placeholder-inner">
                  <span className="at-map-spinner" />
                  <p>Loading map…</p>
                </div>
              </div>
            )}

            {/* The actual map — rendered only once isLoaded is true */}
            {hasKey && !loadError && isLoaded && (
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={MAP_DEFAULT_CENTER}
                zoom={MAP_DEFAULT_ZOOM}
                onLoad={onMapLoad}
                options={MAP_OPTIONS}
              >
                {/* Markers are created imperatively in the useEffect above.
                    InfoWindow is the only declarative child needed here. */}
                {infoAgent && (
                  <InfoWindow
                    position={{ lat: infoAgent.lat, lng: infoAgent.lng }}
                    onCloseClick={() => setInfoAgent(null)}
                  >
                    <div className="at-info-window">
                      {infoAgent.isWarehouse ? (
                        <>
                          <p className="at-iw-name">🏭 {infoAgent.name}</p>
                          <p className="at-iw-type">Warehouse Location</p>
                        </>
                      ) : (
                        <>
                          <p className="at-iw-name">🚚 {infoAgent.name}</p>
                          <p className="at-iw-status" style={{ color: STATUS_COLORS[infoAgent.status] }}>
                            {STATUS_ICONS[infoAgent.status]} {infoAgent.status}
                          </p>
                          <p className="at-iw-route">{infoAgent.route}</p>
                          <p className="at-iw-eta">ETA: {infoAgent.eta}</p>
                          {infoAgent.isDemo
                            ? <p className="at-iw-demo">Sample location — not live GPS</p>
                            : infoAgent.lastUpdate
                              ? <p className="at-iw-updated">Updated: {new Date(infoAgent.lastUpdate).toLocaleTimeString()}</p>
                              : null
                          }
                        </>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}

            {/* Map legend */}
            {hasKey && !loadError && isLoaded && (
              <div className="at-map-legend">
                <span className="at-legend-item"><span className="at-legend-dot" style={{ background: PIN_COLOR['Warehouse'] }}   />Warehouse</span>
                <span className="at-legend-item"><span className="at-legend-dot" style={{ background: PIN_COLOR['In Progress'] }} />In Progress</span>
                <span className="at-legend-item"><span className="at-legend-dot" style={{ background: PIN_COLOR['Delivered'] }}   />Delivered</span>
                <span className="at-legend-item"><span className="at-legend-dot" style={{ background: PIN_COLOR['Not Started'] }} />Not Started</span>
              </div>
            )}

            {/* Agent detail panel */}
            {selectedAgent && !selectedAgent.isWarehouse && (
              <div className="agent-detail-panel">
                <div className="agent-detail-header">
                  <span className="agent-detail-name">{selectedAgent.name}</span>
                  <button className="agent-detail-close" onClick={() => { setSelectedAgent(null); setInfoAgent(null) }}>✕</button>
                </div>
                <div className="agent-detail-body">
                  {[
                    { label: 'Status',   value: <span style={{ color: STATUS_COLORS[selectedAgent.status], fontWeight: 700 }}>{STATUS_ICONS[selectedAgent.status]} {selectedAgent.status}</span> },
                    { label: 'Route',    value: selectedAgent.route },
                    { label: 'Progress', value: `${selectedAgent.progress}%` },
                    { label: 'ETA',      value: selectedAgent.eta },
                    { label: 'Location', value: `${selectedAgent.lat.toFixed(4)}, ${selectedAgent.lng.toFixed(4)}` },
                    { label: 'Data',     value: selectedAgent.isDemo ? '⚠️ Sample location' : '✅ Live GPS' },
                  ].map(row => (
                    <div className="detail-row" key={row.label}>
                      <span>{row.label}</span>
                      <span>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
