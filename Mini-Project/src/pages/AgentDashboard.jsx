import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleMaps } from '../hooks/useGoogleMaps'
import './AgentDashboard.css'

// Demo delivery assignments per agent
const ASSIGNMENTS = {
  agent_001: {
    orderId: 'ORD-2024-001',
    item: 'Industrial Conveyor Belt',
    quantity: 2,
    priority: 'High',
    warehouse: { name: 'Warehouse A – Nagpur Central', lat: 21.1458, lng: 79.0882 },
    customer: { name: 'Vikram Industries', phone: '+91 99887 76655', address: 'Plot 45, MIDC, Butibori, Nagpur', lat: 21.0, lng: 79.05 },
  },
  agent_002: {
    orderId: 'ORD-2024-002',
    item: 'Electronic Control Panel',
    quantity: 1,
    priority: 'Critical',
    warehouse: { name: 'Warehouse B – Hingna Road', lat: 21.1, lng: 78.98 },
    customer: { name: 'Sunrise Electronics', phone: '+91 88776 65544', address: '12, Sadar, Nagpur', lat: 21.15, lng: 79.09 },
  },
  agent_003: {
    orderId: 'ORD-2024-003',
    item: 'Grocery Bundle Pack',
    quantity: 50,
    priority: 'Normal',
    warehouse: { name: 'Warehouse C – Kamptee Road', lat: 21.18, lng: 79.12 },
    customer: { name: 'Fresh Mart Store', phone: '+91 77665 54433', address: '88, Dharampeth, Nagpur', lat: 21.13, lng: 79.07 },
  },
}

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Delivered']
const STATUS_COLORS = { 'Not Started': '#64748b', 'In Progress': '#2563eb', 'Delivered': '#16a34a' }
// API key is handled by useGoogleMaps hook — not needed directly here

export default function AgentDashboard() {
  const navigate = useNavigate()
  // Shared Maps loader — loads the script exactly once across the whole SPA.
  // Never inject a raw <script> tag here; that causes "already presented" errors.
  const { isLoaded: mapLoaded, loadError: mapLoadError } = useGoogleMaps()

  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const agentMarkerRef = useRef(null)
  const watchIdRef = useRef(null)

  const [agent, setAgent] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [status, setStatus] = useState('Not Started')
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeDenied, setRouteDenied] = useState(false)   // Directions API not enabled
  const [agentLocation, setAgentLocation] = useState(null)
  const [mapError, setMapError] = useState(false)
  const [showMap, setShowMap] = useState(false)

  // Load agent from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('delivery_agent')
    if (!stored) { navigate('/route-optimization/agent/login'); return }
    const a = JSON.parse(stored)
    setAgent(a)
    setAssignment(ASSIGNMENTS[a.id] || ASSIGNMENTS['agent_001'])

    // Restore saved status
    const savedStatus = localStorage.getItem(`status_${a.id}`)
    if (savedStatus) setStatus(savedStatus)
  }, [navigate])

  // Broadcast agent location to localStorage (simulates real-time sync for admin panel)
  const broadcastLocation = useCallback((lat, lng, agentId, agentName, currentStatus) => {
    const agents = JSON.parse(localStorage.getItem('live_agents') || '{}')
    agents[agentId] = { ...agents[agentId], id: agentId, name: agentName, lat, lng, status: currentStatus, lastUpdate: Date.now() }
    localStorage.setItem('live_agents', JSON.stringify(agents))
  }, [])

  // Sync shared loader error → local mapError flag
  useEffect(() => {
    if (mapLoadError) setMapError(true)
  }, [mapLoadError])

  // Initialize map once the shared hook signals isLoaded.
  // The raw <script> injection has been removed — useGoogleMaps handles it once.
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !assignment || !showMap) return
    if (mapInstanceRef.current) return   // already initialised for this assignment

    const google = window.google
    const map = new google.maps.Map(mapRef.current, {
      center: assignment.warehouse,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })
    mapInstanceRef.current = map

    // Warehouse marker
    new google.maps.Marker({   // eslint-disable-line no-new
      position: assignment.warehouse,
      map,
      title: assignment.warehouse.name,
      icon: { url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' },
    })

    // Customer marker
    new google.maps.Marker({   // eslint-disable-line no-new
      position: assignment.customer,
      map,
      title: assignment.customer.address,
      icon: { url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' },
    })

    // ── Directions — NON-BLOCKING ────────────────────────────────────────────
    // The map and markers above are already visible before this call completes.
    // REQUEST_DENIED means "Directions API" is not enabled in Google Cloud
    // Console. That only removes the polyline — the map itself stays working.
    const directionsService  = new google.maps.DirectionsService()
    const directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true })
    directionsRenderer.setMap(map)
    directionsRendererRef.current = directionsRenderer

    directionsService.route(
      {
        origin:      assignment.warehouse,
        destination: assignment.customer,
        travelMode:  google.maps.TravelMode.DRIVING,
      },
      (result, routeStatus) => {
        if (routeStatus === 'OK') {
          directionsRenderer.setDirections(result)
          const leg = result.routes[0].legs[0]
          setRouteInfo({ distance: leg.distance.text, duration: leg.duration.text })
        } else {
          // Log a single, actionable warning — not an error that spams the console.
          if (routeStatus === 'REQUEST_DENIED') {
            console.warn(
              '[AgentDashboard] Directions API returned REQUEST_DENIED.\n' +
              'Enable "Directions API" in Google Cloud Console:\n' +
              'https://console.cloud.google.com/apis/library/directions-backend.googleapis.com'
            )
            setRouteDenied(true)
          }
        }
      }
    )
  }, [mapLoaded, assignment, showMap])

  // Real-time location tracking
  useEffect(() => {
    if (!agent || !assignment) return
    if (!navigator.geolocation) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setAgentLocation({ lat, lng })
        broadcastLocation(lat, lng, agent.id, agent.name, status)

        if (mapInstanceRef.current && window.google) {
          if (agentMarkerRef.current) {
            agentMarkerRef.current.setPosition({ lat, lng })
          } else {
            agentMarkerRef.current = new window.google.maps.Marker({
              position: { lat, lng },
              map: mapInstanceRef.current,
              title: 'Your Location',
              icon: { url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' },
            })
          }
        }
      },
      () => {
        // Fallback: simulate location near warehouse
        if (assignment) {
          const lat = assignment.warehouse.lat + (Math.random() - 0.5) * 0.02
          const lng = assignment.warehouse.lng + (Math.random() - 0.5) * 0.02
          setAgentLocation({ lat, lng })
          broadcastLocation(lat, lng, agent.id, agent.name, status)
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    )

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [agent, assignment, broadcastLocation, status])

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    if (agent) {
      localStorage.setItem(`status_${agent.id}`, newStatus)
      if (agentLocation) {
        broadcastLocation(agentLocation.lat, agentLocation.lng, agent.id, agent.name, newStatus)
      }
    }
  }

  const handleStartDelivery = () => {
    setShowMap(true)
    handleStatusChange('In Progress')
    // Open Google Maps for navigation
    if (assignment) {
      const { warehouse, customer } = assignment
      const url = `https://www.google.com/maps/dir/?api=1&origin=${warehouse.lat},${warehouse.lng}&destination=${customer.lat},${customer.lng}&travelmode=driving`
      window.open(url, '_blank')
    }
  }

  const handleLogout = () => {
    if (agent) {
      const agents = JSON.parse(localStorage.getItem('live_agents') || '{}')
      delete agents[agent.id]
      localStorage.setItem('live_agents', JSON.stringify(agents))
      localStorage.removeItem('delivery_agent')
    }
    navigate('/route-optimization/agent/login')
  }

  if (!agent || !assignment) return null

  return (
    <div className="agent-dash">
      {/* Header */}
      <div className="agent-dash-header">
        <div className="agent-dash-header-inner">
          <div className="agent-info">
            <span className="agent-avatar">🚚</span>
            <div>
              <div className="agent-name">{agent.name}</div>
              <div className="agent-phone">{agent.phone}</div>
            </div>
          </div>
          <div className="agent-header-right">
            <span className="status-badge" style={{ background: STATUS_COLORS[status] + '22', color: STATUS_COLORS[status], border: `1px solid ${STATUS_COLORS[status]}44` }}>
              {status}
            </span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="agent-dash-body">
        {/* Order Details */}
        <div className="agent-section">
          <h2 className="section-title">📦 Order Details</h2>
          <div className="info-grid">
            <div className="info-card">
              <span className="info-label">Order ID</span>
              <span className="info-value">{assignment.orderId}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Item</span>
              <span className="info-value">{assignment.item}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Quantity</span>
              <span className="info-value">{assignment.quantity}</span>
            </div>
            <div className="info-card priority">
              <span className="info-label">Priority</span>
              <span className={`priority-badge priority-${assignment.priority.toLowerCase()}`}>{assignment.priority}</span>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="agent-section">
          <h2 className="section-title">📍 Locations</h2>
          <div className="location-cards">
            <div className="location-card location-card--warehouse">
              <div className="location-icon">🏭</div>
              <div>
                <div className="location-label">Pickup Warehouse</div>
                <div className="location-name">{assignment.warehouse.name}</div>
              </div>
            </div>
            <div className="location-arrow">→</div>
            <div className="location-card location-card--customer">
              <div className="location-icon">📬</div>
              <div>
                <div className="location-label">Delivery Address</div>
                <div className="location-name">{assignment.customer.address}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="agent-section">
          <h2 className="section-title">👤 Customer Details</h2>
          <div className="info-grid">
            <div className="info-card">
              <span className="info-label">Name</span>
              <span className="info-value">{assignment.customer.name}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Phone</span>
              <span className="info-value">
                <a href={`tel:${assignment.customer.phone}`} className="phone-link">{assignment.customer.phone}</a>
              </span>
            </div>
            <div className="info-card info-card--full">
              <span className="info-label">Address</span>
              <span className="info-value">{assignment.customer.address}</span>
            </div>
          </div>
        </div>

        {/* Route Info */}
        {routeInfo && (
          <div className="agent-section">
            <h2 className="section-title">🗺️ Route Info</h2>
            <div className="route-stats">
              <div className="route-stat">
                <span className="route-stat-icon">📏</span>
                <span className="route-stat-label">Distance</span>
                <span className="route-stat-value">{routeInfo.distance}</span>
              </div>
              <div className="route-stat">
                <span className="route-stat-icon">⏱️</span>
                <span className="route-stat-label">Est. Time</span>
                <span className="route-stat-value">{routeInfo.duration}</span>
              </div>
              {agentLocation && (
                <div className="route-stat">
                  <span className="route-stat-icon">📡</span>
                  <span className="route-stat-label">GPS</span>
                  <span className="route-stat-value">Active</span>
                </div>
              )}
            </div>
          </div>
        )}
        {routeDenied && !routeInfo && (
          <div className="agent-section">
            <div className="map-error" style={{ fontSize: '.85rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '.65rem 1rem' }}>
              ⚠️ Route polyline unavailable — <strong>Directions API</strong> is not enabled on this key.
              {' '}<a href="https://console.cloud.google.com/apis/library/directions-backend.googleapis.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Enable it in Google Cloud Console ↗</a>
              {' '}The map and markers work normally.
            </div>
          </div>
        )}

        {/* Start Delivery Button */}
        {status === 'Not Started' && (
          <div className="agent-section">
            <button className="btn-start-delivery" onClick={handleStartDelivery}>
              🚀 Start Delivery
            </button>
          </div>
        )}

        {/* Status Update */}
        <div className="agent-section">
          <h2 className="section-title">🔄 Update Status</h2>
          <div className="status-buttons">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                className={`status-btn ${status === s ? 'active' : ''}`}
                style={status === s ? { background: STATUS_COLORS[s], color: '#fff', borderColor: STATUS_COLORS[s] } : {}}
                onClick={() => handleStatusChange(s)}
              >
                {s === 'Not Started' ? '⚫' : s === 'In Progress' ? '🔵' : '🟢'} {s}
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        {showMap && (
          <div className="agent-section">
            <h2 className="section-title">🗺️ Live Map</h2>
            {mapError ? (
              <div className="map-error">
                <p>Google Maps API key not configured. <a href={`https://www.google.com/maps/dir/?api=1&origin=${assignment.warehouse.lat},${assignment.warehouse.lng}&destination=${assignment.customer.lat},${assignment.customer.lng}&travelmode=driving`} target="_blank" rel="noreferrer">Open in Google Maps ↗</a></p>
              </div>
            ) : (
              <div ref={mapRef} className="agent-map" />
            )}
          </div>
        )}

        {!showMap && status === 'In Progress' && (
          <div className="agent-section">
            <button className="btn-show-map" onClick={() => setShowMap(true)}>
              🗺️ Show Map
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
