import { Link } from 'react-router-dom'
import './Home.css'

const highlights = [
  {
    icon: '📈',
    title: 'Demand Forecasting',
    description: 'ML-powered predictions for accurate inventory planning.',
  },
  {
    icon: '🗺️',
    title: 'Warehouse Path Optimization',
    description: 'Optimal routes for order picking and reduced travel time.',
  },
  {
    icon: '🤖',
    title: 'LLM Decision Support',
    description: 'Explainable AI for human-readable reasoning.',
  },
  {
    icon: '💰',
    title: 'Cost Reduction',
    description: 'Lower operational costs through smarter workflows.',
  },
]

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title animate-fade-in-up">
            Next-Gen Warehouse Optimization with AI
          </h1>
          <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            AI-driven Demand Forecasting & Intelligent Order Picking
          </p>
          <div className="hero-buttons animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/system-modules" className="btn btn-primary">
              Explore System
            </Link>
            <Link to="/features" className="btn btn-secondary">
              View Features
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-scene">
            {/* Pulsing glow rings */}
            <div className="scene-ring scene-ring--1" />
            <div className="scene-ring scene-ring--2" />
            <div className="scene-ring scene-ring--3" />

            {/* Main warehouse SVG illustration */}
            <svg className="scene-svg" viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Warehouse AI illustration">
              {/* ── Floor shadow ── */}
              <ellipse cx="160" cy="248" rx="110" ry="18" fill="rgba(30,138,74,0.10)" />

              {/* ── Warehouse body ── */}
              {/* Left face */}
              <polygon points="60,90 160,50 160,200 60,230" fill="#d4f0d4" stroke="#1e8a4a" strokeWidth="1.5"/>
              {/* Right face */}
              <polygon points="160,50 260,90 260,230 160,200" fill="#b8e6b8" stroke="#1e8a4a" strokeWidth="1.5"/>
              {/* Roof */}
              <polygon points="60,90 160,50 260,90 160,130" fill="#e8f8e8" stroke="#1e8a4a" strokeWidth="1.5"/>

              {/* ── Roof ridge highlight ── */}
              <line x1="160" y1="50" x2="160" y2="130" stroke="#8db832" strokeWidth="2" strokeDasharray="4 3" opacity="0.7"/>

              {/* ── Left wall details — shelving ── */}
              <rect x="75"  y="130" width="24" height="40" rx="3" fill="#1e8a4a" opacity="0.18"/>
              <rect x="105" y="135" width="24" height="35" rx="3" fill="#1e8a4a" opacity="0.18"/>
              <rect x="75"  y="142" width="24" height="2"  rx="1" fill="#1e8a4a" opacity="0.5"/>
              <rect x="75"  y="155" width="24" height="2"  rx="1" fill="#1e8a4a" opacity="0.5"/>
              <rect x="105" y="147" width="24" height="2"  rx="1" fill="#1e8a4a" opacity="0.5"/>
              <rect x="105" y="160" width="24" height="2"  rx="1" fill="#1e8a4a" opacity="0.5"/>

              {/* ── Right wall — door ── */}
              <rect x="185" y="155" width="36" height="50" rx="3" fill="#166138" opacity="0.25"/>
              <rect x="187" y="157" width="32" height="46" rx="2" fill="#166138" opacity="0.15"/>
              <circle cx="216" cy="183" r="2.5" fill="#8db832"/>

              {/* ── Boxes on floor ── */}
              {/* Box 1 */}
              <rect x="80"  y="205" width="22" height="18" rx="3" fill="#f5c842" stroke="#c8a020" strokeWidth="1"/>
              <line x1="80"  y1="214" x2="102" y2="214" stroke="#c8a020" strokeWidth="1" opacity="0.6"/>
              <line x1="91"  y1="205" x2="91"  y2="223" stroke="#c8a020" strokeWidth="1" opacity="0.6"/>
              {/* Box 2 */}
              <rect x="108" y="210" width="18" height="14" rx="2" fill="#8db832" stroke="#5a8010" strokeWidth="1"/>
              <line x1="108" y1="217" x2="126" y2="217" stroke="#5a8010" strokeWidth="1" opacity="0.6"/>
              {/* Box 3 — stacked */}
              <rect x="80"  y="191" width="22" height="16" rx="3" fill="#fde68a" stroke="#c8a020" strokeWidth="1"/>

              {/* ── Forklift ── */}
              <rect x="195" y="195" width="30" height="22" rx="4" fill="#1e8a4a"/>
              <rect x="197" y="198" width="13" height="10" rx="2" fill="#e8f8e8" opacity="0.8"/>
              <circle cx="200" cy="219" r="4" fill="#166138"/>
              <circle cx="220" cy="219" r="4" fill="#166138"/>
              <circle cx="200" cy="219" r="2" fill="#8db832"/>
              <circle cx="220" cy="219" r="2" fill="#8db832"/>
              {/* Fork arms */}
              <rect x="225" y="205" width="3"  height="16" rx="1" fill="#c8d850"/>
              <rect x="230" y="205" width="3"  height="16" rx="1" fill="#c8d850"/>
              <rect x="225" y="203" width="12" height="3"  rx="1" fill="#8db832"/>

              {/* ── Conveyor belt ── */}
              <rect x="130" y="220" width="55" height="8" rx="4" fill="#1e8a4a" opacity="0.20"/>
              <rect x="133" y="222" width="8"  height="4" rx="2" fill="#8db832" opacity="0.5"/>
              <rect x="144" y="222" width="8"  height="4" rx="2" fill="#8db832" opacity="0.5"/>
              <rect x="155" y="222" width="8"  height="4" rx="2" fill="#8db832" opacity="0.5"/>
              <rect x="166" y="222" width="8"  height="4" rx="2" fill="#8db832" opacity="0.5"/>

              {/* ── Floating data cards (animated via CSS) ── */}
              {/* Card 1 — demand */}
              <g className="float-card float-card--1">
                <rect x="8" y="60" width="72" height="36" rx="8" fill="white" opacity="0.92" filter="url(#shadow)"/>
                <rect x="8" y="60" width="72" height="4"  rx="4" fill="#1e8a4a"/>
                <text x="16" y="76" fontSize="7" fill="#166138" fontWeight="700">📈 Demand</text>
                <text x="16" y="87" fontSize="8" fill="#1e8a4a" fontWeight="800">+23%</text>
                <rect x="50" y="78" width="22" height="12" rx="3" fill="#d4f0d4"/>
                <rect x="52" y="81" width="5"  height="6"  rx="1" fill="#1e8a4a"/>
                <rect x="59" y="78" width="5"  height="9"  rx="1" fill="#8db832"/>
                <rect x="66" y="75" width="5"  height="12" rx="1" fill="#c8d850"/>
              </g>

              {/* Card 2 — route */}
              <g className="float-card float-card--2">
                <rect x="238" y="44" width="74" height="36" rx="8" fill="white" opacity="0.92" filter="url(#shadow)"/>
                <rect x="238" y="44" width="74" height="4"  rx="4" fill="#8db832"/>
                <text x="246" y="60" fontSize="7" fill="#5a8010" fontWeight="700">🗺️ Route</text>
                <text x="246" y="71" fontSize="7" fill="#166138">Saved 34%</text>
                {/* mini route line */}
                <circle cx="286" cy="56" r="3" fill="#1e8a4a"/>
                <circle cx="300" cy="65" r="2.5" fill="#8db832"/>
                <circle cx="294" cy="72" r="2" fill="#c8d850"/>
                <polyline points="286,56 300,65 294,72" stroke="#1e8a4a" strokeWidth="1.5" fill="none" strokeDasharray="2 1.5"/>
              </g>

              {/* Card 3 — cost */}
              <g className="float-card float-card--3">
                <rect x="220" y="155" width="70" height="34" rx="8" fill="white" opacity="0.92" filter="url(#shadow)"/>
                <rect x="220" y="155" width="70" height="4"  rx="4" fill="#f5c842"/>
                <text x="228" y="170" fontSize="7" fill="#a07010" fontWeight="700">💰 Cost</text>
                <text x="228" y="181" fontSize="8" fill="#166138" fontWeight="800">−₹128</text>
              </g>

              {/* ── SVG filter for card drop shadows ── */}
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(30,100,50,0.15)"/>
                </filter>
              </defs>

              {/* ── Dotted route path (picker walking) ── */}
              <path d="M100,215 Q130,200 155,218 Q180,235 210,210" stroke="#8db832" strokeWidth="1.5" strokeDasharray="4 3" fill="none" opacity="0.6"/>
              <circle cx="100" cy="215" r="3" fill="#1e8a4a"/>
              <circle cx="210" cy="210" r="3" fill="#8db832"/>

              {/* ── Orbiting AI particles ── */}
              <circle className="orbit-dot orbit-dot--1" cx="160" cy="140" r="3.5" fill="#1e8a4a"/>
              <circle className="orbit-dot orbit-dot--2" cx="160" cy="140" r="2.5" fill="#8db832"/>
              <circle className="orbit-dot orbit-dot--3" cx="160" cy="140" r="2"   fill="#f5c842"/>
            </svg>

            {/* ── Floating stat pills (HTML, easier to animate) ── */}
            <div className="stat-pill stat-pill--accuracy">
              <span className="stat-pill-dot" />
              ML Accuracy <strong>94.4%</strong>
            </div>
            <div className="stat-pill stat-pill--routes">
              <span className="stat-pill-dot stat-pill-dot--green" />
              Routes <strong>5,000+</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <h2 className="section-title">About the Project</h2>
          <p className="about-text">
            This project focuses on improving supply chain efficiency by integrating Machine Learning for demand forecasting and AI-based optimization for warehouse order picking. The system also uses Large Language Models (LLMs) for intelligent reasoning and explainable decision support.
          </p>
        </div>
      </section>

      <section className="highlights-section">
        <div className="container">
          <h2 className="section-title">Key Highlights</h2>
          <div className="highlights-grid">
            {highlights.map((item, i) => (
              <div
                key={item.title}
                className="highlight-card"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="highlight-icon">{item.icon}</span>
                <h3 className="highlight-title">{item.title}</h3>
                <p className="highlight-desc">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
