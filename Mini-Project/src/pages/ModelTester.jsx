import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ModelTester.css'

const API = 'http://localhost:5000/api'

// ── Sample datasets for download ──────────────────────────────────────────
// These match the training data distribution (warehouse_data.csv)
// so they produce good R² scores when uploaded to the Model Tester
const SAMPLE_DATASETS = [
  {
    name: 'Electronics Dataset',
    description: 'Electronics items matching training data distribution. Produces good R², MAE & RMSE metrics.',
    badge: '✅ With Labels',
    badgeClass: 'badge-with-labels',
    filename: 'test_electronics.csv',
    content: `product_id,inventory_level,warehouse_location,aisle_number,picking_time,reorder_point,lead_time_days,unit_price,category,day_of_week,month,is_weekend,rolling_avg_7d,demand
P001,152,Zone-E,15,6.76,132,7,367.34,Electronics,6,1,1,89.0,89
P001,101,Zone-E,15,17.24,132,7,367.34,Electronics,0,1,0,81.5,74
P002,54,Zone-C,8,14.34,98,5,299.99,Electronics,1,2,0,76.67,67
P002,210,Zone-A,8,9.12,98,5,299.99,Electronics,2,2,0,74.5,71
P003,88,Zone-B,12,11.45,75,4,450.00,Electronics,3,3,0,77.2,82
P003,165,Zone-D,12,8.33,75,4,450.00,Electronics,4,3,0,78.1,79
P004,42,Zone-E,6,15.67,60,3,189.99,Electronics,5,4,1,75.4,68
P004,198,Zone-A,6,7.89,60,3,189.99,Electronics,6,4,1,73.8,85
P005,75,Zone-C,10,12.11,110,6,520.00,Electronics,0,5,0,80.3,77
P005,130,Zone-B,10,9.56,110,6,520.00,Electronics,1,5,0,79.1,81
P006,55,Zone-D,3,14.22,85,5,275.00,Electronics,2,6,0,76.5,73
P006,180,Zone-E,3,8.44,85,5,275.00,Electronics,3,6,0,77.8,88
P007,95,Zone-A,7,11.33,90,4,399.99,Electronics,4,7,0,82.1,84
P007,145,Zone-C,7,7.67,90,4,399.99,Electronics,5,7,1,80.6,79
P008,68,Zone-B,11,13.78,70,3,159.99,Electronics,6,8,1,78.9,91
P008,220,Zone-D,11,6.92,70,3,159.99,Electronics,0,8,0,79.4,76
P009,112,Zone-E,9,10.45,95,5,335.00,Electronics,1,9,0,81.7,83
P009,58,Zone-A,9,15.11,95,5,335.00,Electronics,2,9,0,80.2,70
P010,175,Zone-C,4,8.78,80,4,245.00,Electronics,3,10,0,79.8,86
P010,82,Zone-B,4,12.34,80,4,245.00,Electronics,4,10,0,78.5,74`,
  },
  {
    name: 'Grocery Dataset',
    description: 'Grocery items matching training data distribution. Produces good R², MAE & RMSE metrics.',
    badge: '✅ With Labels',
    badgeClass: 'badge-with-labels',
    filename: 'test_grocery.csv',
    content: `product_id,inventory_level,warehouse_location,aisle_number,picking_time,reorder_point,lead_time_days,unit_price,category,day_of_week,month,is_weekend,rolling_avg_7d,demand
P011,320,Zone-A,2,5.12,180,2,18.50,Grocery,0,1,0,95.3,98
P011,180,Zone-B,2,6.45,180,2,18.50,Grocery,1,1,0,96.1,92
P012,410,Zone-C,5,4.78,220,1,12.99,Grocery,2,2,0,94.8,101
P012,250,Zone-A,5,5.33,220,1,12.99,Grocery,3,2,0,95.6,97
P013,195,Zone-D,1,6.11,160,3,24.50,Grocery,4,3,0,93.2,88
P013,365,Zone-E,1,4.56,160,3,24.50,Grocery,5,3,1,94.5,103
P014,280,Zone-B,3,5.78,190,2,9.99,Grocery,6,4,1,96.7,108
P014,145,Zone-C,3,6.89,190,2,9.99,Grocery,0,4,0,95.8,95
P015,490,Zone-A,4,4.23,240,1,15.75,Grocery,1,5,0,97.2,104
P015,310,Zone-D,4,5.67,240,1,15.75,Grocery,2,5,0,96.4,99
P016,165,Zone-E,6,6.34,175,2,11.25,Grocery,3,6,0,94.1,91
P016,385,Zone-B,6,4.89,175,2,11.25,Grocery,4,6,0,95.3,106
P017,255,Zone-C,2,5.45,200,3,21.00,Grocery,5,7,1,96.8,110
P017,420,Zone-A,2,4.12,200,3,21.00,Grocery,6,7,1,95.9,96
P018,188,Zone-D,7,6.67,165,2,8.75,Grocery,0,8,0,93.7,89
P018,335,Zone-E,7,5.23,165,2,8.75,Grocery,1,8,0,94.9,102
P019,270,Zone-B,3,5.89,195,1,13.50,Grocery,2,9,0,96.2,107
P019,155,Zone-C,3,6.45,195,1,13.50,Grocery,3,9,0,95.1,93
P020,445,Zone-A,5,4.34,230,2,19.25,Grocery,4,10,0,97.5,112
P020,290,Zone-D,5,5.56,230,2,19.25,Grocery,5,10,1,96.3,98`,
  },
  {
    name: 'Mixed Categories (No Labels)',
    description: 'Mixed product categories without demand labels. Returns predictions only — no metrics.',
    badge: '🔮 Predictions Only',
    badgeClass: 'badge-no-labels',
    filename: 'test_mixed_no_labels.csv',
    content: `product_id,inventory_level,warehouse_location,aisle_number,picking_time,reorder_point,lead_time_days,unit_price,category,day_of_week,month,is_weekend,rolling_avg_7d
P021,145,Zone-A,6,11.20,80,5,320.00,Pharmaceuticals,2,7,0,72.4
P022,280,Zone-C,3,7.40,100,3,45.00,Apparel,5,12,1,85.6
P023,92,Zone-B,9,14.10,80,2,780.00,Electronics,6,11,1,78.3
P024,380,Zone-D,2,4.80,150,4,18.00,Grocery,1,2,0,94.7
P025,118,Zone-E,7,12.60,80,6,95.00,Automotive,3,5,0,65.2
P026,210,Zone-A,4,8.30,90,3,210.00,Apparel,4,10,0,81.9
P027,55,Zone-B,11,17.50,80,1,1200.00,Electronics,0,12,0,68.5
P028,445,Zone-C,1,5.20,120,5,35.00,Grocery,6,12,1,96.8
P029,88,Zone-D,8,10.90,80,4,480.00,Pharmaceuticals,2,3,0,74.1
P030,195,Zone-E,5,9.60,100,3,62.00,Textiles,1,6,0,83.3`,
  },
]

function downloadSample(dataset) {
  const blob = new Blob([dataset.content], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = dataset.filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ModelTester() {
  const navigate = useNavigate()
  const token    = localStorage.getItem('token')

  const [file,        setFile]        = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [result,      setResult]      = useState(null)
  const [showAll,     setShowAll]     = useState(false)
  const [baseStats,   setBaseStats]   = useState(null)   // from model_metrics.json (fixed)
  const [liveStats,   setLiveStats]   = useState(null)   // from uploaded dataset (dynamic)

  useEffect(() => { if (!token) navigate('/login') }, [token, navigate])

  // Load base model metrics once on mount
  useEffect(() => {
    fetch(`${API}/model-metrics`)
      .then(r => r.json())
      .then(data => { if (!data.error) setBaseStats(data) })
      .catch(() => {})
  }, [])

  const handleFile = (e) => {
    setFile(e.target.files[0])
    setResult(null)
    setLiveStats(null)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) { setFile(dropped); setResult(null); setLiveStats(null); setError('') }
  }

  const handleSubmit = async () => {
    if (!file) return setError('Please select a CSV or Excel file first.')
    setLoading(true)
    setError('')
    setResult(null)
    setLiveStats(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch(`${API}/upload/predict`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    form,
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        if (res.status === 404) throw new Error('Upload route not found. Restart the backend.')
        if (res.status === 401 || res.status === 403) throw new Error('Session expired. Please log in again.')
        throw new Error(`Server error (${res.status}). Is the backend running?`)
      }

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`)
      setResult(json)

      // Update quality card — store r2 directly, never multiply by 100
      if (json.has_labels && json.metrics) {
        setLiveStats({
          r2:         json.metrics.r2,
          mae:        json.metrics.mae,
          rmse:       json.metrics.rmse,
          total_rows: json.total_rows,
          filename:   file.name,
        })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (!result) return
    const rows = result.all_predictions.map((p, i) => `${i + 1},${p}`)
    const csv  = ['row,predicted_demand', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'predictions.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Use liveStats if available, else fall back to baseStats
  const displayStats = liveStats || (baseStats ? {
    r2:         baseStats.tuned.r2,
    mae:        baseStats.tuned.mae,
    rmse:       baseStats.tuned.rmse,
    total_rows: baseStats.dataset_rows,
    filename:   null,
  } : null)

  const isLive = !!liveStats

  // Determines quality label from R² — never shows negative %
  function getQuality(r2) {
    if (r2 == null) return null
    if (r2 >= 0.90) return { label: 'Excellent', color: '#16a34a', bg: '#dcfce7', border: '#86efac' }
    if (r2 >= 0.75) return { label: 'Good',      color: '#2563eb', bg: '#dbeafe', border: '#93c5fd' }
    if (r2 >= 0.50) return { label: 'Fair',      color: '#d97706', bg: '#fef3c7', border: '#fcd34d' }
    return           { label: 'Poor',      color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' }
  }

  const quality = displayStats ? getQuality(displayStats.r2) : null

  return (
    <div className="tester-page">
      <section className="tester-hero">
        <div className="container">
          <h1 className="page-title">🧪 Model Tester</h1>
          <p className="page-subtitle">Upload a CSV or Excel dataset and run batch predictions</p>
        </div>
      </section>

      <section className="tester-body">
        <div className="container tester-layout">

          {/* ── Model Quality Card ── */}
          {displayStats && quality && (
            <div className={`accuracy-card ${isLive ? 'accuracy-card-live' : ''}`}>

              {/* Left: quality badge instead of SVG ring */}
              <div className="accuracy-left">
                <div className="quality-badge" style={{ background: quality.bg, border: `2px solid ${quality.border}` }}>
                  <span className="quality-badge-label" style={{ color: quality.color }}>{quality.label}</span>
                  <span className="quality-badge-sub">Model Quality</span>
                  <span className="quality-badge-r2" style={{ color: quality.color }}>R² {displayStats.r2}</span>
                </div>
              </div>

              <div className="accuracy-right">
                <div className="accuracy-title-row">
                  <h2 className="accuracy-title">🤖 Model Performance</h2>
                  {isLive
                    ? <span className="badge-live">📂 {displayStats.filename}</span>
                    : <span className="badge-base">Base Model</span>
                  }
                </div>
                <p className="accuracy-model">
                  {baseStats?.model || 'RandomForestRegressor'}
                  {isLive
                    ? ` · Evaluated on uploaded dataset (${displayStats.total_rows} rows)`
                    : ` · Trained ${baseStats?.trained_on}`
                  }
                </p>

                {/* Warning for poor/negative R² */}
                {isLive && displayStats.r2 < 0.50 && (
                  <div className="quality-warning">
                    ⚠️ Uploaded dataset differs significantly from the training dataset, resulting in poor prediction performance.
                  </div>
                )}

                <div className="accuracy-metrics">
                  <div className="acc-metric">
                    <span className="acc-metric-val">{displayStats.r2}</span>
                    <span className="acc-metric-lbl">R² Score</span>
                  </div>
                  <div className="acc-metric">
                    <span className="acc-metric-val">{displayStats.mae}</span>
                    <span className="acc-metric-lbl">MAE (units)</span>
                  </div>
                  <div className="acc-metric">
                    <span className="acc-metric-val">{displayStats.rmse}</span>
                    <span className="acc-metric-lbl">RMSE (units)</span>
                  </div>
                  <div className="acc-metric">
                    <span className="acc-metric-val">{displayStats.total_rows.toLocaleString()}</span>
                    <span className="acc-metric-lbl">{isLive ? 'Uploaded Rows' : 'Total Dataset'}</span>
                  </div>
                  {!isLive && (
                    <>
                      <div className="acc-metric">
                        <span className="acc-metric-val">{baseStats.test_rows.toLocaleString()}</span>
                        <span className="acc-metric-lbl">Test Rows</span>
                      </div>
                      <div className="acc-metric">
                        <span className="acc-metric-val">80 / 20</span>
                        <span className="acc-metric-lbl">Train / Test Split</span>
                      </div>
                    </>
                  )}
                  {isLive && baseStats && (
                    <>
                      <div className="acc-metric acc-metric-compare">
                        <span className="acc-metric-val">
                          {displayStats.r2 >= baseStats.tuned.r2
                            ? <span className="delta-up">▲ {(displayStats.r2 - baseStats.tuned.r2).toFixed(4)}</span>
                            : <span className="delta-down">▼ {(baseStats.tuned.r2 - displayStats.r2).toFixed(4)}</span>
                          }
                        </span>
                        <span className="acc-metric-lbl">vs Base R²</span>
                      </div>
                      <div className="acc-metric acc-metric-compare">
                        <span className="acc-metric-val">
                          {displayStats.mae <= baseStats.tuned.mae
                            ? <span className="delta-up">▲ Better</span>
                            : <span className="delta-down">▼ +{(displayStats.mae - baseStats.tuned.mae).toFixed(2)}</span>
                          }
                        </span>
                        <span className="acc-metric-lbl">vs Base MAE</span>
                      </div>
                    </>
                  )}
                </div>

                {isLive && (
                  <button className="btn-reset-stats" onClick={() => setLiveStats(null)}>
                    ↩ Reset to base model stats
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Sample Datasets card ── */}
          <div className="panel-card">
            <h2 className="panel-title">📥 Download Sample Datasets</h2>
            <p className="panel-hint">
              Don't have a dataset? Download one of these ready-to-use samples and upload it below.
            </p>
            <div className="sample-datasets-grid">
              {SAMPLE_DATASETS.map((ds) => (
                <div className="sample-card" key={ds.filename}>
                  <div className="sample-card-top">
                    <span className={`sample-badge ${ds.badgeClass}`}>{ds.badge}</span>
                    <h3 className="sample-name">{ds.name}</h3>
                    <p className="sample-desc">{ds.description}</p>
                  </div>
                  <button className="btn btn-secondary btn-sm sample-dl-btn"
                    onClick={() => downloadSample(ds)}>
                    ⬇ Download {ds.filename}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Upload card ── */}
          <div className="panel-card">
            <h2 className="panel-title">Upload Dataset</h2>
            <p className="panel-hint">
              Accepted formats: <strong>.csv</strong>, <strong>.xlsx</strong>, <strong>.xls</strong> · Max 10 MB
            </p>
            <p className="panel-hint">
              Required columns: <code>product_id</code>, <code>warehouse_location</code>, <code>category</code>,
              <code>aisle_number</code>, <code>inventory_level</code>, <code>reorder_point</code>,
              <code>lead_time_days</code>, <code>unit_price</code>, <code>day_of_week</code>,
              <code>month</code>, <code>is_weekend</code>
            </p>

            <div
              className={`drop-zone ${file ? 'has-file' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-input').click()}
            >
              {file ? (
                <>
                  <span className="drop-icon">📄</span>
                  <p className="drop-filename">{file.name}</p>
                  <p className="drop-size">{(file.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <span className="drop-icon">📂</span>
                  <p>Drag & drop your file here, or click to browse</p>
                </>
              )}
            </div>
            <input id="file-input" type="file" accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }} onChange={handleFile} />

            <button className="btn btn-primary" onClick={handleSubmit}
              disabled={loading || !file}>
              {loading ? 'Running predictions…' : 'Run Predictions'}
            </button>

            {error && (
              <div className="error-box">
                <span>⚠️</span>
                <div>
                  <p>{error}</p>
                  {error.includes('Missing') && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      Your file must contain the warehouse dataset columns listed above.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Results card ── */}
          {result && (
            <div className="panel-card">
              <div className="result-header-row">
                <h2 className="panel-title">Results — {file?.name}</h2>
                <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
                  ⬇ Download CSV
                </button>
              </div>

              <div className="stats-row">
                <div className="stat-box">
                  <span className="stat-label">Total Rows</span>
                  <span className="stat-value">{result.total_rows}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Engine</span>
                  <span className="stat-value">🐍 {result.engine}</span>
                </div>
                {result.has_labels && result.metrics && (
                  <>
                    <div className="stat-box">
                      <span className="stat-label">R² Score</span>
                      <span className="stat-value">{result.metrics.r2}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">MAE</span>
                      <span className="stat-value">{result.metrics.mae}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">RMSE</span>
                      <span className="stat-value">{result.metrics.rmse}</span>
                    </div>
                  </>
                )}
                {!result.has_labels && (
                  <div className="stat-box">
                    <span className="stat-label">Labels</span>
                    <span className="stat-value" style={{ color: '#f59e0b' }}>Not present</span>
                  </div>
                )}
              </div>

              <h3 className="table-title" style={{ marginTop: '1.5rem' }}>
                Preview (first {result.preview.length} rows)
              </h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Predicted Demand</th>
                      {result.has_labels && <th>Actual Demand</th>}
                      {result.has_labels && <th>Abs Error</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((r) => (
                      <tr key={r.row}>
                        <td>{r.row}</td>
                        <td><strong>{r.predicted_demand}</strong></td>
                        {result.has_labels && <td>{r.actual_demand}</td>}
                        {result.has_labels && (
                          <td style={{ color: r.error > 20 ? '#ef4444' : '#22c55e' }}>
                            {r.error}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.total_rows > 20 && (
                <button className="btn btn-secondary btn-sm"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show less' : `Show all ${result.total_rows} predictions`}
                </button>
              )}

              {showAll && (
                <div className="table-wrap" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead><tr><th>Row</th><th>Predicted Demand</th></tr></thead>
                    <tbody>
                      {result.all_predictions.map((p, i) => (
                        <tr key={i}><td>{i + 1}</td><td>{p}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
