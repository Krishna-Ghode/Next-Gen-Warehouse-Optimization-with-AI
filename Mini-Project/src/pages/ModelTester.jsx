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
    content: `product_id,inventory_level,warehouse_location,aisle_number,picking_time,reorder_point,lead_time_days,unit_price,category,day_of_week,month,is_weekend,demand
P002,719,Zone-A,2,14.87,114,5,45.45,Electronics,6,1,1,94
P002,0,Zone-A,2,6.93,114,5,45.45,Electronics,2,2,0,85
P002,0,Zone-A,2,3.4,114,5,45.45,Electronics,2,3,0,86
P002,0,Zone-A,2,6.06,114,5,45.45,Electronics,5,4,1,100
P004,320,Zone-C,6,16.8,73,6,132.13,Electronics,6,1,1,109
P004,0,Zone-C,6,4.68,73,6,132.13,Electronics,2,2,0,97
P004,0,Zone-C,6,9.59,73,6,132.13,Electronics,2,3,0,101
P004,0,Zone-C,6,9.84,73,6,132.13,Electronics,5,4,1,120
P005,552,Zone-E,12,14.5,123,7,15.88,Electronics,6,1,1,102
P005,0,Zone-E,12,10.21,123,7,15.88,Electronics,0,5,0,85
P006,558,Zone-B,7,7.52,128,4,34.51,Electronics,6,1,1,77
P006,0,Zone-B,7,9.3,128,4,34.51,Electronics,3,6,0,93
P010,536,Zone-B,1,3.96,133,7,230.56,Electronics,6,1,1,57
P010,0,Zone-B,1,14.94,133,7,230.56,Electronics,1,8,0,82
P013,820,Zone-E,11,7.52,107,9,422.0,Electronics,6,1,1,25
P013,0,Zone-E,11,14.24,107,9,422.0,Electronics,4,9,0,61
P017,239,Zone-D,6,12.93,50,1,306.69,Electronics,6,1,1,65
P017,0,Zone-D,6,15.06,50,1,306.69,Electronics,6,10,1,89
P022,232,Zone-B,11,6.41,61,6,48.29,Electronics,6,1,1,102
P025,480,Zone-B,6,9.58,124,6,76.95,Electronics,6,1,1,59`,
  },
  {
    name: 'Grocery Dataset',
    description: 'Grocery items matching training data distribution. Produces good R², MAE & RMSE metrics.',
    badge: '✅ With Labels',
    badgeClass: 'badge-with-labels',
    filename: 'test_grocery.csv',
    content: `product_id,inventory_level,warehouse_location,aisle_number,picking_time,reorder_point,lead_time_days,unit_price,category,day_of_week,month,is_weekend,demand
P011,633,Zone-D,9,16.92,146,1,296.33,Grocery,6,1,1,110
P011,0,Zone-D,9,14.37,146,1,296.33,Grocery,2,2,0,98
P011,0,Zone-D,9,7.08,146,1,296.33,Grocery,2,3,0,110
P011,0,Zone-D,9,8.81,146,1,296.33,Grocery,5,4,1,119
P011,0,Zone-D,9,7.4,146,1,296.33,Grocery,0,5,0,98
P012,825,Zone-E,5,16.3,137,3,167.01,Grocery,6,1,1,118
P012,0,Zone-E,5,10.81,137,3,167.01,Grocery,2,2,0,99
P012,0,Zone-E,5,6.85,137,3,167.01,Grocery,2,3,0,102
P012,0,Zone-E,5,16.46,137,3,167.01,Grocery,5,4,1,131
P012,0,Zone-E,5,5.79,137,3,167.01,Grocery,0,5,0,111
P019,0,Zone-A,17,9.3,70,9,68.52,Grocery,3,6,0,54
P019,0,Zone-A,17,3.62,70,9,68.52,Grocery,5,7,1,65
P019,0,Zone-A,17,14.94,70,9,68.52,Grocery,1,8,0,49
P019,0,Zone-A,17,14.24,70,9,68.52,Grocery,4,9,0,50
P019,0,Zone-A,17,15.06,70,9,68.52,Grocery,6,10,1,64
P023,0,Zone-C,14,10.07,85,4,475.82,Grocery,2,11,0,62
P023,0,Zone-C,14,9.65,85,4,475.82,Grocery,4,12,0,70
P024,728,Zone-D,3,12.11,108,7,341.55,Grocery,6,1,1,82
P024,0,Zone-D,3,8.82,108,7,341.55,Grocery,2,2,0,74
P024,0,Zone-D,3,7.46,108,7,341.55,Grocery,5,3,1,88`,
  },
  {
    name: 'Mixed Categories (No Labels)',
    description: 'Mixed product categories without demand labels. Returns predictions only — no metrics.',
    badge: '🔮 Predictions Only',
    badgeClass: 'badge-no-labels',
    filename: 'test_mixed_no_labels.csv',
    content: `product_id,inventory_level,warehouse_location,aisle_number,picking_time,reorder_point,lead_time_days,unit_price,category,day_of_week,month,is_weekend
P001,152,Zone-E,15,6.76,132,7,367.34,Tools,6,1,1
P003,218,Zone-A,2,6.1,115,1,421.8,Apparel,6,1,1
P007,923,Zone-C,6,11.52,143,9,387.95,Apparel,6,1,1
P008,595,Zone-C,10,14.89,64,5,280.7,Furniture,6,1,1
P009,548,Zone-B,19,11.26,100,6,93.71,Apparel,6,1,1
P014,923,Zone-D,9,13.65,92,5,337.67,Apparel,0,4,0
P015,274,Zone-E,13,10.27,78,2,143.56,Furniture,2,5,0
P016,541,Zone-B,4,4.69,89,8,5.46,Furniture,3,6,0
P018,401,Zone-D,16,14.98,96,8,138.61,Apparel,5,7,1
P021,591,Zone-B,5,8.82,131,1,109.57,Tools,1,8,0`,
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
