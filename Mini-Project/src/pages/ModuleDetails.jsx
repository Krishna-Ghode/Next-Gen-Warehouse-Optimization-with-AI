import './ModuleDetails.css'
import { Link } from 'react-router-dom'

const MODULE_DATA = [
  {
    icon: '📂',
    title: 'Data Collection Module',
    color: '#2563eb',
    tech: 'CSV Datasets · 12 files',
    what: 'Collects warehouse operational data from 12 CSV files covering orders, inventory transactions, picking routes, carrier performance, and product information.',
    how: 'Data is served via GET /api/data/:dataset endpoint. The backend reads CSV files directly and returns paginated JSON to the frontend DataExplorer page.',
    numbers: ['50,000+ order records', '36,550 picking records', '5,000 picking routes', '12 dataset files total'],
  },
  {
    icon: '🔧',
    title: 'Data Preprocessing Module',
    color: '#7c3aed',
    tech: 'pandas · numpy · scikit-learn Pipeline',
    what: 'Cleans raw warehouse data, handles missing values, and engineers features that improve model accuracy.',
    how: 'Python script (preprocess.py) runs before training. Missing numeric values filled with median per product group. Engineered features: rolling_avg_7d, rolling_avg_30d, demand_lag_1, demand_lag_7, day_of_week, month, quarter, is_weekend, stockout_risk.',
    numbers: ['7 drop columns (leakage prevention)', '12 input features', 'StandardScaler on numeric', 'OneHotEncoder on categorical'],
  },
  {
    icon: '📈',
    title: 'ML Forecasting Module',
    color: '#0369a1',
    tech: 'RandomForestRegressor · scikit-learn · joblib',
    what: 'Predicts product demand using a trained Random Forest model. Explains why demand is high or low using feature importance.',
    how: 'Node.js backend calls predict_pipeline.py via python-shell. The sklearn Pipeline bundles preprocessing + model into pipeline_model.pkl. GridSearchCV tunes n_estimators and max_depth.',
    numbers: ['94.37% accuracy (R²)', 'MAE = 4.91 units', 'RMSE = 6.21 units', '100 decision trees', '80/20 train/test split'],
  },
  {
    icon: '🗺️',
    title: 'Path Optimization Engine',
    color: '#16a34a',
    tech: "Dijkstra's Algorithm · JavaScript + Python",
    what: "Finds the shortest picking path through warehouse aisles. Models the warehouse floor as a weighted graph and applies Dijkstra's algorithm to minimize travel distance.",
    how: 'Node.js calls optimize_route.py via python-shell. Falls back to a pure JS Dijkstra implementation if Python is unavailable. Input: list of aisles + start aisle. Output: optimized sequence + total distance + ETA.',
    numbers: ['27–38% distance reduction', '~5 min saved per cycle', '₹128 saved per cycle', 'O((V+E) log V) complexity'],
  },
  {
    icon: '🤖',
    title: 'LLM Reasoning Module',
    color: '#ea580c',
    tech: 'Gemini · OpenAI GPT-3.5 · Rule Engine',
    what: 'Explains AI decisions in plain language. Answers questions about demand forecasts, routes, cost savings, and system architecture using live dashboard data.',
    how: 'Hybrid engine: tries Gemini → OpenAI → rule-based fallback. A 25-intent scorer classifies questions. Live context (predicted demand, costs, metrics) injected into every prompt. Works 100% offline via rule engine.',
    numbers: ['25 intent categories', '4 chatbot modules', 'Always works (no API key needed)', 'Context injected per request'],
  },
]

export default function ModuleDetails() {
  return (
    <div className="details-page">
      <section className="details-hero">
        <div className="container">
          <h1>Module Details</h1>
          <p>Technical specifications of each AI component in the Warehouse Optimization system.</p>
          <Link to="/system-modules" className="btn btn-secondary">← Back to System Modules</Link>
        </div>
      </section>

      <section className="details-content">
        <div className="container">
          <div className="details-modules">
            {MODULE_DATA.map((mod) => (
              <div key={mod.title} className="detail-module-card" style={{ borderLeftColor: mod.color }}>
                <div className="detail-module-header">
                  <span className="detail-module-icon">{mod.icon}</span>
                  <div>
                    <h2 className="detail-module-title">{mod.title}</h2>
                    <span className="detail-module-tech" style={{ color: mod.color }}>{mod.tech}</span>
                  </div>
                </div>

                <div className="detail-module-body">
                  <div className="detail-section">
                    <strong>What it does</strong>
                    <p>{mod.what}</p>
                  </div>
                  <div className="detail-section">
                    <strong>How it works</strong>
                    <p>{mod.how}</p>
                  </div>
                  <div className="detail-numbers">
                    {mod.numbers.map((n, i) => (
                      <span key={i} className="detail-number-chip" style={{ borderColor: mod.color, color: mod.color }}>
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
