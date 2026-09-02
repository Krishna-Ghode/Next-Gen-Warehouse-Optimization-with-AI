import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { login, signup } from '../supabaseAuth'
import './ExplainableAI.css'

const API = 'http://localhost:5000/api'
const getToken = () => localStorage.getItem('token')

// ── Chatbot module configs ────────────────────────────────────────────────
const CHAT_MODULES = [
  {
    id: 'cost',
    icon: '📉',
    title: 'Cost Reduction',
    desc: 'Cost saved, contributing factors, before vs after',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    systemContext: 'cost_reduction',
    suggestions: ['How much cost is saved?', 'What are the contributing factors?', 'Show before vs after comparison', 'What is the ROI?'],
    welcome: "Hi! I'm your Cost Reduction assistant 📉\nAsk me about cost savings, efficiency improvements, or before vs after comparisons.",
  },
  {
    id: 'guide',
    icon: '📖',
    title: 'Platform Guide',
    desc: 'How the system works, ML + LLM integration explained',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa',
    systemContext: 'platform_guide',
    suggestions: ['How does the ML model work?', 'What does the LLM do?', 'How are routes optimized?', 'Explain the full pipeline'],
    welcome: "Hi! I'm your Platform Guide assistant 📖\nAsk me anything about how this system works — ML models, LLM integration, route optimization, or the full pipeline.",
  },
]

// ── Order tracking data ───────────────────────────────────────────────────
// MOCK DATA — realistic logistics data for demo purposes.
// FUTURE INTEGRATION: Replace this with a fetch() call to
//   GET /api/orders/:id  which returns real order data from the backend DB.
// The Agent Dashboard already stores status via POST /api/agent/status —
// that endpoint can be extended to include ETA updates and location.
const ORDERS = {
  'ORD-2024-001': {
    item:          'Industrial Conveyor Belt',
    quantity:      2,
    agent:         'Rahul Sharma',
    agentPhone:    '+91 98765 43210',
    agentId:       'agent_001',
    warehouse:     'Warehouse A – Nagpur Central',
    warehouseAddr: 'Plot 12, Industrial Estate, Nagpur – 440001',
    customer:      'Vikram Industries',
    destination:   'Plot 45, MIDC, Butibori, Nagpur – 441122',
    eta:           '~35 min',
    status:        'In Progress',
    cost:          '₹4,250',
    route:         'Nagpur Central → Ring Road → Butibori MIDC',
    distance:      '18 km',
    priority:      'High',
    packedAt:      '09:15 AM',
    dispatchedAt:  '09:45 AM',
  },
  'ORD-2024-002': {
    item:          'Electronic Control Panel',
    quantity:      1,
    agent:         'Priya Patel',
    agentPhone:    '+91 87654 32109',
    agentId:       'agent_002',
    warehouse:     'Warehouse B – Hingna Road',
    warehouseAddr: 'Shed 7, Hingna Industrial Zone, Nagpur – 440028',
    customer:      'Sunrise Electronics',
    destination:   '12, Sadar, Nagpur – 440001',
    eta:           '~20 min',
    status:        'Not Started',
    cost:          '₹1,800',
    route:         'Hingna Road → Wardha Road → Sadar',
    distance:      '11 km',
    priority:      'Critical',
    packedAt:      '—',
    dispatchedAt:  '—',
  },
  'ORD-2024-003': {
    item:          'Grocery Bundle Pack',
    quantity:      50,
    agent:         'Amit Kumar',
    agentPhone:    '+91 76543 21098',
    agentId:       'agent_003',
    warehouse:     'Warehouse C – Kamptee Road',
    warehouseAddr: 'Unit 3, Kamptee Road Logistics Park, Nagpur – 440026',
    customer:      'Fresh Mart Store',
    destination:   '88, Dharampeth, Nagpur – 440010',
    eta:           'Delivered',
    status:        'Delivered',
    cost:          '₹920',
    route:         'Kamptee Road → Amravati Road → Dharampeth',
    distance:      '9 km',
    priority:      'Normal',
    packedAt:      '08:00 AM',
    dispatchedAt:  '08:30 AM',
  },
}

export default function ExplainableAI() {
  const [demoPath,     setDemoPath]     = useState(null)     // null | 'public' | 'company'
  const [companyAuth,  setCompanyAuth]  = useState(false)
  const [companyMode,  setCompanyMode]  = useState('login')
  const [companyEmail, setCompanyEmail] = useState('')
  const [loginForm,    setLoginForm]    = useState({ email: '', password: '' })
  const [companyRegisterForm, setCompanyRegisterForm] = useState({ companyName: '', adminName: '', email: '', password: '' })
  const [loginError,   setLoginError]   = useState('')
  const [companyError, setCompanyError] = useState('')
  const [companyMessage, setCompanyMessage] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Public tracker
  const [orderId,       setOrderId]       = useState('')
  const [trackResult,   setTrackResult]   = useState(null)
  const [trackError,    setTrackError]    = useState('')
  const [trackCost,     setTrackCost]     = useState(null)
  const [trackLoading,  setTrackLoading]  = useState(false)
  const [etaSeconds,    setEtaSeconds]    = useState(null)   // countdown in seconds
  const pollRef = useRef(null)   // polling interval ref

  // Company dashboard active module
  const [activeModule, setActiveModule] = useState(null)  // CHAT_MODULES[i]

  // Dataset stats
  const [dataStats, setDataStats] = useState(null)

  // Chatbot
  const [chatOpen,     setChatOpen]     = useState(false)
  const [chatInput,    setChatInput]    = useState('')
  const [chatLoading,  setChatLoading]  = useState(false)
  const [unread,       setUnread]       = useState(0)
  const [chatHistory,  setChatHistory]  = useState({})  // keyed by module.id
  const messagesEndRef = useRef(null)

  // Load dataset stats when company dashboard opens
  useEffect(() => {
    if (companyAuth && !dataStats) {
      fetch(`${API}/data/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then(r => r.json())
        .then(setDataStats)
        .catch(() => {})
    }
  }, [companyAuth, dataStats])

  // Current module messages
  const currentModuleId = activeModule?.id || 'demand'
  const messages = chatHistory[currentModuleId] || (activeModule ? [{ role: 'bot', text: activeModule.welcome }] : [])

  const setMessages = (updater) => {
    setChatHistory(h => ({
      ...h,
      [currentModuleId]: typeof updater === 'function' ? updater(h[currentModuleId] || [{ role: 'bot', text: activeModule?.welcome || '' }]) : updater,
    }))
  }

  useEffect(() => {
    if (chatOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatOpen])

  // ── Company login and registration ──────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    setCompanyError('')
    setCompanyMessage('')

    try {
      const result = await login(loginForm.email, loginForm.password)
      if (result?.user) {
        setCompanyAuth(true)
        setCompanyEmail(result.user.email || loginForm.email)
        setCompanyMessage('Login successful. Welcome to the company dashboard.')
      } else {
        setLoginError('Unable to sign in. Please verify your email and try again.')
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please check your credentials.'
      setLoginError(errorMsg.includes('Invalid login') || errorMsg.includes('Invalid credentials') ? 'Invalid email or password.' : errorMsg)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    setCompanyError('')
    setCompanyMessage('')

    try {
      await signup(
        companyRegisterForm.email,
        companyRegisterForm.password,
        companyRegisterForm.adminName || companyRegisterForm.companyName,
        companyRegisterForm.companyName
      )
      setCompanyMessage('Registration successful! A confirmation email has been sent. Please verify before logging in.')
      setCompanyRegisterForm({ companyName: '', adminName: '', email: '', password: '' })
      setTimeout(() => {
        setCompanyMode('login')
        setCompanyMessage('')
      }, 3000)
    } catch (err) {
      const errorMsg = err.message || 'Registration failed.'
      if (errorMsg.includes('already registered') || errorMsg.includes('User already exists')) {
        setCompanyError('This email is already registered. Please sign in instead.')
      } else {
        setCompanyError(errorMsg)
      }
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Public order tracking — fetches from backend, fallback to local data ──
  const fetchOrder = async (id) => {
    try {
      const res = await fetch(`${API}/agent/public/order/${id.trim().toUpperCase()}`)
      const data = await res.json()
      if (!res.ok) {
        // Backend returned an error — check local ORDERS as fallback
        const localOrder = ORDERS[id.trim().toUpperCase()]
        if (localOrder) {
          setTrackResult({ ...localOrder, orderId: id.trim().toUpperCase(), lastUpdated: new Date().toISOString(), ai: null, timeline: null, proof: null })
          setTrackError('')
        } else {
          setTrackError(data.error || 'No order found with this ID.')
          setTrackResult(null)
        }
        return
      }
      setTrackResult(data)
      setTrackError('')
      const match = data.eta?.match(/(\d+)/)
      if (match && data.status !== 'Delivered') {
        setEtaSeconds(parseInt(match[1]) * 60)
      } else {
        setEtaSeconds(null)
      }
    } catch {
      // Backend unreachable — fall back to local ORDERS data
      const localOrder = ORDERS[id.trim().toUpperCase()]
      if (localOrder) {
        setTrackResult({ ...localOrder, orderId: id.trim().toUpperCase(), lastUpdated: new Date().toISOString(), ai: null, timeline: null, proof: null })
        setTrackError('')
      } else {
        setTrackError('No order found with this ID.')
        setTrackResult(null)
      }
    }
  }

  const handleTrack = async () => {
    const id = orderId.trim().toUpperCase()
    setTrackError('')
    setTrackResult(null)
    setEtaSeconds(null)
    if (!id) return setTrackError('Please enter an order ID.')

    setTrackLoading(true)
    await fetchOrder(id)
    setTrackLoading(false)

    // Clear any existing poll
    if (pollRef.current) clearInterval(pollRef.current)
    // Poll every 5 seconds for live status updates
    pollRef.current = setInterval(() => fetchOrder(id), 5000)
  }

  // Clear polling when public path is left
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // ETA countdown — ticks every second
  useEffect(() => {
    if (etaSeconds === null || etaSeconds <= 0) return
    const tick = setInterval(() => setEtaSeconds(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(tick)
  }, [etaSeconds])

  const formatCountdown = (secs) => {
    if (secs === null) return null
    if (secs <= 0) return '✓ Arriving now'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m} min ${s.toString().padStart(2, '0')} sec`
  }

  // ── Open module + chat ────────────────────────────────────────────────
  const openModule = (mod) => {
    setActiveModule(mod)
    setChatOpen(true)
    setUnread(0)
    // Init history for this module if not yet
    if (!chatHistory[mod.id]) {
      setChatHistory(h => ({ ...h, [mod.id]: [{ role: 'bot', text: mod.welcome }] }))
    }
  }

  // ── Send message ──────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const q = (text || chatInput).trim()
    if (!q || !activeModule) return
    setChatInput('')
    const newMsgs = [...messages, { role: 'user', text: q }]
    setChatHistory(h => ({ ...h, [currentModuleId]: newMsgs }))
    setChatLoading(true)

    const liveAgents = Object.values(JSON.parse(localStorage.getItem('live_agents') || '{}'))
    const history = newMsgs.slice(-10).map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }))

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          message: q,
          history,
          liveAgents,
          moduleContext: activeModule.systemContext,
          // Inject live demand stats when the demand module is active
          demandContext: activeModule.systemContext === 'demand_forecasting' && dataStats ? {
            accuracy_pct:    dataStats.ml?.accuracy_pct,
            r2:              dataStats.ml?.tuned?.r2,
            mae:             dataStats.ml?.tuned?.mae,
            rmse:            dataStats.ml?.tuned?.rmse,
            dataset_rows:    dataStats.ml?.dataset_rows,
            model:           dataStats.ml?.model,
            avg_demand:      dataStats.picking?.avg_demand,
            avg_inventory:   dataStats.picking?.avg_inventory,
            avg_reorder:     dataStats.picking?.avg_reorder_point,
            avg_lead_time:   dataStats.picking?.avg_lead_time,
            total_orders:    dataStats.dataset_rows?.OrderList,
            picking_records: dataStats.dataset_rows?.WarehousePickingData,
          } : undefined,
          // Inject live route stats when the picking module is active
          pickingContext: activeModule.systemContext === 'warehouse_picking' && dataStats ? {
            total_routes:    dataStats.routes?.total_routes    ?? dataStats.dataset_rows?.PickingRoutes,
            picking_records: dataStats.dataset_rows?.WarehousePickingData,
            avg_dist_after:  dataStats.routes?.avg_distance_m,
            avg_time_after:  dataStats.routes?.avg_time_min,
            avg_items:       dataStats.routes?.avg_items,
            avg_stops:       dataStats.routes?.avg_stops,
            ml_accuracy:     dataStats.ml?.accuracy_pct,
            total_aisles:    20,
            zones:           ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D', 'Zone-E'],
            aisles_visited:  Math.round(dataStats.routes?.avg_stops ?? 4),
          } : undefined,
          // Inject combined context for platform guide (full pipeline)
          platformContext: activeModule.systemContext === 'platform_guide' && dataStats ? {
            ml_accuracy:     dataStats.ml?.accuracy_pct,
            r2:              dataStats.ml?.tuned?.r2,
            mae:             dataStats.ml?.tuned?.mae,
            dataset_rows:    dataStats.ml?.dataset_rows,
            total_orders:    dataStats.dataset_rows?.OrderList,
            total_routes:    dataStats.routes?.total_routes ?? dataStats.dataset_rows?.PickingRoutes,
            avg_dist:        dataStats.routes?.avg_distance_m,
            avg_time:        dataStats.routes?.avg_time_min,
            avg_demand:      dataStats.picking?.avg_demand,
          } : undefined,
        }),
      })
      const json = await res.json()
      const reply = res.ok ? json.answer : (json.error || 'Something went wrong.')
      setChatHistory(h => ({ ...h, [currentModuleId]: [...(h[currentModuleId] || []), { role: 'bot', text: reply }] }))
      if (!chatOpen) setUnread(u => u + 1)
    } catch {
      setChatHistory(h => ({ ...h, [currentModuleId]: [...(h[currentModuleId] || []), { role: 'bot', text: 'Could not reach the backend. Make sure the server is running on port 5000.' }] }))
    } finally {
      setChatLoading(false)
    }
  }

  const STATUS_STYLE = {
    'In Progress': { bg: '#dbeafe', color: '#1d4ed8', dot: '#2563eb' },
    'Delivered':   { bg: '#dcfce7', color: '#15803d', dot: '#16a34a' },
    'Not Started': { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  }

  return (
    <div className="xai-page">
      {/* ── Hero ── */}
      <section className="xai-hero">
        <div className="container">
          <div className="xai-hero-badge">💬 Explainable AI</div>
          <h1 className="xai-hero-title">Explainable AI using LLMs</h1>
          <p className="xai-hero-sub">ML predicts. Algorithms optimize. LLMs explain <em>why</em>.</p>
        </div>
      </section>

      {/* ══════════ VIEW DEMO ══════════ */}
      <section className="xai-demo">
        <div className="container xai-demo-inner">

            {/* ── Path selector ── */}
            {!demoPath && (
              <div className="demo-path-selector">
                <div className="demo-path-title">Choose your access path</div>
                <div className="demo-path-cards">

                  {/* Path A — Public */}
                  <div className="demo-path-card demo-path-card--public">
                    <div className="demo-path-icon">🌐</div>
                    <div className="demo-path-badge">No Login Required</div>
                    <h2>Public Access</h2>
                    <p>Track your delivery, get cost estimates, route overview, and ETA — no account needed.</p>
                    <ul className="demo-path-features">
                      <li>📍 Enter order ID to track live delivery</li>
                      <li>💰 Delivery cost estimate</li>
                      <li>⏱️ ETA calculation</li>
                      <li>🗺️ Route overview</li>
                    </ul>
                    <button className="btn-path btn-path--public" onClick={() => setDemoPath('public')}>
                      Continue as Public User →
                    </button>
                  </div>

                  {/* Path B — Company */}
                  <div className="demo-path-card demo-path-card--company">
                    <div className="demo-path-icon">🏢</div>
                    <div className="demo-path-badge demo-path-badge--company">Login Required</div>
                    <h2>Company Dashboard</h2>
                    <p>Full access to AI-powered analytics, chatbot modules, KPIs, alerts, and platform insights.</p>
                    <ul className="demo-path-features">
                      <li>📉 Cost reduction analysis</li>
                      <li>📖 Platform guide & ML explainer</li>
                      <li>🚚 Live delivery agent tracking</li>
                      <li>📊 Real-time KPIs & performance metrics</li>
                    </ul>
                    <button className="btn-path btn-path--company" onClick={() => setDemoPath('company')}>
                      Company Login →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ PATH A — PUBLIC ══════════ */}
            {demoPath === 'public' && (
              <div className="public-panel">
                <div className="panel-nav">
                  <button className="btn-back-path" onClick={() => { setDemoPath(null); setTrackResult(null); setTrackError('') }}>← Back</button>
                  <span className="panel-nav-title">🌐 Public Delivery Tracker</span>
                </div>

                {/* Cost & ETA overview */}
                <div className="public-overview-grid">
                  <div className="public-kpi"><span className="public-kpi-icon">📦</span><span className="public-kpi-val">{(dataStats?.dataset_rows?.OrderList || 50000).toLocaleString()}</span><span className="public-kpi-lbl">Total Orders</span></div>
                  <div className="public-kpi"><span className="public-kpi-icon">🚚</span><span className="public-kpi-val">{dataStats?.carrier?.total_shipments ? Math.round(dataStats.carrier.total_shipments / 1000) + 'K' : '1,385K'}</span><span className="public-kpi-lbl">Shipments Tracked</span></div>
                  <div className="public-kpi"><span className="public-kpi-icon">💰</span><span className="public-kpi-val">₹{dataStats?.carrier?.avg_cost_per_shipment ? Math.round(dataStats.carrier.avg_cost_per_shipment * 83) : '21,635'}</span><span className="public-kpi-lbl">Avg Shipment Cost</span></div>
                  <div className="public-kpi"><span className="public-kpi-icon">⏱️</span><span className="public-kpi-val">{dataStats?.routes?.avg_time_min ?? 12.4} min</span><span className="public-kpi-lbl">Avg Pick Time</span></div>
                </div>

                {/* Order tracker */}
                <div className="public-tracker-card">
                  <h3>📍 Track Your Order</h3>
                  <p className="public-tracker-hint">Enter your order ID to see live delivery status, agent info, and ETA.</p>
                  <div className="public-tracker-row">
                    <input
                      className="public-tracker-input"
                      placeholder="e.g. ORD-2024-001"
                      value={orderId}
                      onChange={e => setOrderId(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleTrack()}
                    />
                    <button className="btn-track" onClick={handleTrack} disabled={trackLoading}>
                      {trackLoading ? '…' : 'Track →'}
                    </button>
                  </div>
                  <div className="public-tracker-demo-ids">
                    Try: {Object.keys(ORDERS).map((id) => (
                      <button key={id} className="demo-id-chip" onClick={() => {
                        setOrderId(id)
                        setTrackResult(null)
                        setTrackError('')
                        // Auto-track when chip is clicked
                        setTrackLoading(true)
                        fetchOrder(id).finally(() => setTrackLoading(false))
                        if (pollRef.current) clearInterval(pollRef.current)
                        pollRef.current = setInterval(() => fetchOrder(id), 5000)
                      }}>{id}</button>
                    ))}
                  </div>
                  {trackError && <div className="xai-error">⚠️ {trackError}</div>}

                  {/* ── Detailed tracking card ── */}
                  {trackResult && (() => {
                    const st = trackResult.status
                    const stStyle = STATUS_STYLE[st] || STATUS_STYLE['Not Started']

                    // Delivery timeline stages
                    // FUTURE: stage can be driven by real backend events
                    const STAGES = ['Order Received', 'Packed', 'Out For Delivery', 'Delivered']
                    const stageIdx = st === 'Not Started' ? 0
                                   : st === 'In Progress' ? 2
                                   : 3

                    return (
                      <div className="track-result track-result--enhanced">

                        {/* Header row */}
                        <div className="track-result-header">
                          <span className="track-result-id">{orderId.toUpperCase()}</span>
                          <span className="track-status-pill"
                            style={{ background: stStyle.bg, color: stStyle.color }}>
                            <span className="track-status-dot" style={{ background: stStyle.dot }} />
                            {st}
                          </span>
                        </div>

                        {/* Progress timeline */}
                        <div className="track-timeline">
                          {STAGES.map((stage, i) => (
                            <div key={stage} className={`track-stage ${i <= stageIdx ? 'track-stage--done' : ''} ${i === stageIdx ? 'track-stage--active' : ''}`}>
                              <div className="track-stage-dot">
                                {i < stageIdx ? '✓' : i === stageIdx ? '●' : '○'}
                              </div>
                              <div className="track-stage-label">{stage}</div>
                              {i < STAGES.length - 1 && (
                                <div className={`track-stage-line ${i < stageIdx ? 'track-stage-line--done' : ''}`} />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Two-column detail grid */}
                        <div className="track-detail-grid">
                          <div className="track-detail-col">
                            <div className="track-section-title">📦 Order Details</div>
                            <div className="track-field"><span>Order ID</span><strong>{orderId.toUpperCase()}</strong></div>
                            <div className="track-field"><span>Item</span><strong>{trackResult.item}</strong></div>
                            <div className="track-field"><span>Quantity</span><strong>{trackResult.quantity}</strong></div>
                            <div className="track-field"><span>Priority</span>
                              <strong style={{ color: trackResult.priority === 'Critical' ? '#dc2626' : trackResult.priority === 'High' ? '#d97706' : '#16a34a' }}>
                                {trackResult.priority}
                              </strong>
                            </div>
                            <div className="track-field"><span>Est. Cost</span><strong>{trackResult.cost}</strong></div>
                            <div className="track-field"><span>ETA</span>
                              <strong>{st === 'Delivered' ? '✅ Delivered' : trackResult.eta}</strong>
                            </div>
                          </div>

                          <div className="track-detail-col">
                            <div className="track-section-title">🚚 Delivery Agent</div>
                            <div className="track-field"><span>Agent Name</span><strong>{trackResult.agent}</strong></div>
                            <div className="track-field"><span>Contact</span>
                              <strong><a href={`tel:${trackResult.agentPhone}`} style={{ color: '#2563eb' }}>{trackResult.agentPhone}</a></strong>
                            </div>
                            <div className="track-section-title" style={{ marginTop: '12px' }}>📍 Route</div>
                            <div className="track-field"><span>From</span><strong>{trackResult.warehouse}</strong></div>
                            <div className="track-field"><span>To</span><strong>{trackResult.destination}</strong></div>
                            <div className="track-field"><span>Route</span><strong>{trackResult.route}</strong></div>
                            <div className="track-field"><span>Distance</span><strong>{trackResult.distance}</strong></div>
                          </div>
                        </div>

                        {/* Timestamps */}
                        <div className="track-timestamps">
                          <div className="track-ts"><span>📦 Packed at</span><strong>{trackResult.packedAt}</strong></div>
                          <div className="track-ts"><span>🚀 Dispatched at</span><strong>{trackResult.dispatchedAt}</strong></div>
                        </div>

                        {/* Future integration note — visible only in dev */}
                        {/* FUTURE: Add "Live Map" button here that opens AgentDashboard map
                            or embeds a Google Maps iframe with the agent's real-time location
                            fetched from GET /api/agent/status/:agentId */}

                      </div>
                    )
                  })()}
                </div>

                {/* Route overview */}
                <div className="public-route-card">
                  <h3>🗺️ Route Overview</h3>
                  <p>All deliveries use AI-optimized routes computed by Dijkstra's algorithm, minimizing travel distance and time.</p>
                  <div className="public-route-list">
                    {Object.entries(ORDERS).map(([id, o]) => {
                      const live = JSON.parse(localStorage.getItem('live_agents') || '{}')
                      const agentKey = id === 'ORD-2024-001' ? 'agent_001' : id === 'ORD-2024-002' ? 'agent_002' : 'agent_003'
                      const status = live[agentKey]?.status || o.status
                      const st = STATUS_STYLE[status]
                      return (
                        <div key={id} className="public-route-row">
                          <span className="public-route-id">{id}</span>
                          <span className="public-route-path">{o.warehouse.split('–')[0].trim()} → {o.customer.split(',')[0]}</span>
                          <span className="public-route-status" style={{ background: st?.bg, color: st?.color }}>{status}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ PATH B — COMPANY ══════════ */}
            {demoPath === 'company' && !companyAuth && (
              <div className="company-login-wrap">
                <div className="company-login-card">
                  <div className="company-login-icon">🏢</div>
                  <h2>{companyMode === 'login' ? 'Company Login' : 'Company Registration'}</h2>
                  <p>{companyMode === 'login' ? 'Secure access to the AI analytics dashboard' : 'Register your company and admin account'}</p>

                  <form onSubmit={companyMode === 'login' ? handleLogin : handleRegister} className="company-login-form">
                    {companyMode === 'register' && (
                      <>
                        <div className="form-group">
                          <label>Company Name</label>
                          <input type="text" className="xai-ask-input" placeholder="Acme Warehouse Ltd"
                            value={companyRegisterForm.companyName}
                            onChange={e => setCompanyRegisterForm(f => ({ ...f, companyName: e.target.value }))}
                            required />
                        </div>
                        <div className="form-group">
                          <label>Admin Name</label>
                          <input type="text" className="xai-ask-input" placeholder="Priya Sharma"
                            value={companyRegisterForm.adminName}
                            onChange={e => setCompanyRegisterForm(f => ({ ...f, adminName: e.target.value }))}
                            required />
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" className="xai-ask-input" placeholder="Enter your email"
                        autoComplete="off"
                        value={companyMode === 'login' ? loginForm.email : companyRegisterForm.email}
                        onChange={e => companyMode === 'login'
                          ? setLoginForm(f => ({ ...f, email: e.target.value }))
                          : setCompanyRegisterForm(f => ({ ...f, email: e.target.value }))}
                        required />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input type="password" className="xai-ask-input" placeholder="Enter your password"
                        autoComplete="new-password"
                        value={companyMode === 'login' ? loginForm.password : companyRegisterForm.password}
                        onChange={e => companyMode === 'login'
                          ? setLoginForm(f => ({ ...f, password: e.target.value }))
                          : setCompanyRegisterForm(f => ({ ...f, password: e.target.value }))}
                        required />
                    </div>

                    {companyMode === 'login' && loginError && <div className="xai-error">⚠️ {loginError}</div>}
                    {companyMode === 'register' && companyError && <div className="xai-error">⚠️ {companyError}</div>}
                    {companyMessage && <div className="company-login-hint">{companyMessage}</div>}

                    <button type="submit" className="btn-xai-primary" disabled={loginLoading} style={{ width: '100%' }}>
                      {loginLoading ? (companyMode === 'login' ? 'Signing in…' : 'Registering…') : (companyMode === 'login' ? 'Sign In →' : 'Register Company →')}
                    </button>
                  </form>

                  <div className="company-login-switch">
                    {companyMode === 'login'
                      ? <p>New company? <button type="button" className="toggle-btn" onClick={() => { setCompanyMode('register'); setCompanyError(''); setCompanyMessage(''); }}>Register</button></p>
                      : <p>Already have an account? <button type="button" className="toggle-btn" onClick={() => { setCompanyMode('login'); setCompanyError(''); setCompanyMessage(''); }}>Sign In</button></p>
                    }
                  </div>

                  <div className="company-login-hint">Demo credentials remain available for quick preview.</div>
                  <button className="btn-back-path" style={{ marginTop: '12px' }} onClick={() => { setDemoPath(null); setLoginError(''); setCompanyError(''); setCompanyMessage(''); setCompanyMode('login') }}>← Back</button>
                </div>
              </div>
            )}

            {demoPath === 'company' && companyAuth && (
              <div className="company-dashboard">
                <div className="panel-nav">
                  <button className="btn-back-path" onClick={() => { setCompanyAuth(false); setDemoPath(null); setActiveModule(null); setChatOpen(false) }}>← Logout</button>
                  <span className="panel-nav-title">🏢 Company Dashboard</span>
                  <span className="company-auth-badge">✅ {companyEmail || 'admin@warehouse.com'}</span>
                </div>

                {/* KPI tiles */}
                <div className="company-kpis">
                  {[
                    { icon: '📦', val: dataStats?.dataset_rows?.OrderList ? dataStats.dataset_rows.OrderList.toLocaleString() : '50,000', lbl: 'Total Orders',    color: '#2563eb' },
                    { icon: '🗺️', val: dataStats?.dataset_rows?.WarehousePickingData ? dataStats.dataset_rows.WarehousePickingData.toLocaleString() : '36,550', lbl: 'Picking Records', color: '#7c3aed' },
                    { icon: '🛤️', val: dataStats?.dataset_rows?.PickingRoutes ? dataStats.dataset_rows.PickingRoutes.toLocaleString() : '5,000', lbl: 'Routes Logged', color: '#16a34a' },
                    { icon: '📊', val: dataStats?.dataset_rows?.InventoryTransactions ? dataStats.dataset_rows.InventoryTransactions.toLocaleString() : '20,000', lbl: 'Inv. Transactions', color: '#ea580c' },
                    { icon: '🎯', val: dataStats?.ml?.accuracy_pct ? `${dataStats.ml.accuracy_pct}%` : '94.37%', lbl: 'ML Accuracy',    color: '#0369a1' },
                    { icon: '🚚', val: dataStats?.carrier?.avg_on_time_pct ? `${dataStats.carrier.avg_on_time_pct}%` : '84.8%', lbl: 'On-Time Delivery', color: '#15803d' },
                  ].map(k => (
                    <div key={k.lbl} className="company-kpi-tile">
                      <span className="company-kpi-icon">{k.icon}</span>
                      <span className="company-kpi-val" style={{ color: k.color }}>{k.val}</span>
                      <span className="company-kpi-lbl">{k.lbl}</span>
                    </div>
                  ))}
                </div>

                {/* Alerts */}
                <div className="company-alerts">
                  <div className="company-alert company-alert--warn">⚠️ ORD-2024-002 (Electronic Control Panel) is Critical priority — not yet started</div>
                  <div className="company-alert company-alert--info">📊 Demand forecast confidence dropped to 78% for Machinery category — review data quality</div>
                  <div className="company-alert company-alert--success">✅ ORD-2024-003 delivered successfully by Amit Kumar</div>
                </div>

                {/* Recent activity */}
                <div className="company-activity">
                  <div className="company-section-title">🕐 Recent Activity</div>
                  <div className="company-activity-list">
                    {[
                      { time: '2 min ago',  icon: '✅', text: `Amit Kumar delivered Grocery Bundle Pack to Fresh Mart Store` },
                      { time: '15 min ago', icon: '🚚', text: 'Rahul Sharma started delivery of Industrial Conveyor Belt' },
                      { time: '32 min ago', icon: '📊', text: `ML model predicted demand: ${dataStats?.picking?.avg_demand ?? 75} units avg (${dataStats?.ml?.accuracy_pct ?? 94.37}% accuracy)` },
                      { time: '1 hr ago',   icon: '🗺️', text: `Route optimized: avg ${dataStats?.routes?.avg_distance_m ?? 7.7}m, ${dataStats?.routes?.avg_time_min ?? 12.4} min avg pick time` },
                      { time: '2 hr ago',   icon: '📦', text: `${(dataStats?.dataset_rows?.OrderList || 50000).toLocaleString()} orders processed across ${(dataStats?.dataset_rows?.PickingRoutes || 5000).toLocaleString()} routes` },
                    ].map((a, i) => (
                      <div key={i} className="company-activity-row">
                        <span className="activity-icon">{a.icon}</span>
                        <span className="activity-text">{a.text}</span>
                        <span className="activity-time">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4 Chatbot module cards */}
                <div className="company-section-title" style={{ marginTop: '24px' }}>🤖 AI Assistant Modules</div>
                <div className="chatbot-modules-grid">
                  {CHAT_MODULES.map(mod => (
                    <div key={mod.id} className={`chatbot-module-card ${activeModule?.id === mod.id ? 'active' : ''}`}
                      style={{ borderColor: activeModule?.id === mod.id ? mod.color : undefined }}
                      onClick={() => openModule(mod)}>
                      <div className="chatbot-module-icon" style={{ background: mod.bg, color: mod.color }}>{mod.icon}</div>
                      <div className="chatbot-module-body">
                        <div className="chatbot-module-title" style={{ color: mod.color }}>{mod.title}</div>
                        <div className="chatbot-module-desc">{mod.desc}</div>
                      </div>
                      <div className="chatbot-module-arrow" style={{ color: mod.color }}>
                        {activeModule?.id === mod.id ? '💬 Active' : '→'}
                      </div>
                    </div>
                  ))}
                </div>

                {activeModule && (
                  <div className="chatbot-active-hint">
                    <span style={{ color: activeModule.color }}>{activeModule.icon} {activeModule.title}</span> assistant is active — chatbot is open below 👇
                  </div>
                )}
              </div>
            )}

          </div>
        </section>

      <div className="xai-back-row container">
        <Link to="/features" className="xai-back-link">← Back to Features</Link>
      </div>

      {/* ══════════ FLOATING CHATBOT (company only) ══════════ */}
      {demoPath === 'company' && companyAuth && activeModule && (
        <>
          <button className="chat-bubble" style={{ background: `linear-gradient(135deg, ${activeModule.color}, ${activeModule.color}cc)` }}
            onClick={() => chatOpen ? setChatOpen(false) : (setChatOpen(true), setUnread(0))} aria-label="Open AI Chat">
            {chatOpen ? '✕' : activeModule.icon}
            {!chatOpen && unread > 0 && <span className="chat-bubble-badge">{unread}</span>}
          </button>

          {chatOpen && (
            <div className="chat-window">
              <div className="chat-header" style={{ background: `linear-gradient(135deg, ${activeModule.color}ee, ${activeModule.color})` }}>
                <div className="chat-header-info">
                  <span className="chat-header-avatar">{activeModule.icon}</span>
                  <div>
                    <div className="chat-header-name">{activeModule.title} Assistant</div>
                    <div className="chat-header-status">
                      <span className="chat-status-dot" />
                      {chatLoading ? 'Thinking…' : 'Online'}
                    </div>
                  </div>
                </div>
                <div className="chat-header-actions">
                  <button className="chat-clear-btn" onClick={() => setChatHistory(h => ({ ...h, [currentModuleId]: [{ role: 'bot', text: activeModule.welcome }] }))}>🗑</button>
                  <button className="chat-close-btn" onClick={() => setChatOpen(false)}>✕</button>
                </div>
              </div>

              <div className="chat-context-pill" style={{ background: activeModule.bg, color: activeModule.color, borderColor: activeModule.border }}>
                {activeModule.icon} Context: {activeModule.title} · {activeModule.desc}
              </div>

              <div className="chat-messages">
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
                    {msg.role === 'bot' && <span className="chat-msg-avatar">{activeModule.icon}</span>}
                    <div className="chat-msg-bubble" style={msg.role === 'user' ? { background: `linear-gradient(135deg, ${activeModule.color}, ${activeModule.color}cc)` } : { background: activeModule.bg, borderColor: activeModule.border }}>
                      {msg.text.split('\n').map((line, j, arr) => <span key={j}>{line}{j < arr.length - 1 && <br />}</span>)}
                    </div>
                    {msg.role === 'user' && <span className="chat-msg-avatar chat-msg-avatar--user">👤</span>}
                  </div>
                ))}
                {chatLoading && (
                  <div className="chat-msg chat-msg--bot">
                    <span className="chat-msg-avatar">{activeModule.icon}</span>
                    <div className="chat-msg-bubble chat-typing" style={{ background: activeModule.bg }}>
                      <span style={{ background: activeModule.color }} /><span style={{ background: activeModule.color }} /><span style={{ background: activeModule.color }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-suggestions">
                {activeModule.suggestions.map((q, i) => (
                  <button key={i} className="chat-suggestion-chip"
                    style={{ borderColor: activeModule.border, color: activeModule.color, background: activeModule.bg }}
                    onClick={() => sendMessage(q)}>{q}</button>
                ))}
              </div>

              <div className="chat-input-row">
                <input className="chat-input" placeholder={`Ask about ${activeModule.title.toLowerCase()}…`}
                  value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !chatLoading && sendMessage()}
                  disabled={chatLoading} style={{ borderColor: activeModule.border }} />
                <button className="chat-send-btn" style={{ background: `linear-gradient(135deg, ${activeModule.color}, ${activeModule.color}cc)` }}
                  onClick={() => sendMessage()} disabled={chatLoading || !chatInput.trim()}>➤</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

