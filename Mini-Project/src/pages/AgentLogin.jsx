import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './AgentLogin.css'
import { agentLogin } from '../supabaseAuth'

export default function AgentLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Clear any stale agent session on login page load
  useEffect(() => {
    localStorage.removeItem('delivery_agent')
    localStorage.removeItem('agent_token')
    localStorage.removeItem('agent_id')
    localStorage.removeItem('agent_email')
    localStorage.removeItem('agent_name')
    localStorage.removeItem('agent_role')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Attempt agent login with credentials
      // Backend will verify role and return error if user is not a delivery_agent
      const result = await agentLogin(form.email, form.password)

      if (result.agent && result.token) {
        // Verify agent role in response
        if (result.agent.role !== 'delivery_agent') {
          setError(`Invalid role: ${result.agent.role}. Only delivery agents are allowed.`)
          setLoading(false)
          return
        }

        // Redirect to delivery agent dashboard
        navigate('/route-optimization/agent/dashboard')
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please try again.'
      
      // Provide helpful error messages
      if (errorMsg.includes('Invalid email or password')) {
        setError('Invalid email or password. Please check your credentials.')
      } else if (errorMsg.includes('not authorized')) {
        setError('Your account is not authorized for delivery operations. Contact support.')
      } else if (errorMsg.includes('not found')) {
        setError('Account not found. Please contact your administrator.')
      } else if (errorMsg.includes('Cannot connect') || errorMsg.includes('Cannot reach')) {
        setError('Cannot connect to server. Make sure the backend is running on port 5000.')
      } else {
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="agent-login-page">
      <div className="agent-login-card">
        <div className="agent-login-header">
          <span className="agent-login-icon">🚚</span>
          <h1>Delivery Agent Login</h1>
          <p>Sign in to access your delivery dashboard</p>
        </div>

        <form className="agent-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="off"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="agent-login-error">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary agent-login-btn"
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Sign In'}
          </button>

          <div className="demo-credentials">
            <p><strong>Demo Credentials:</strong></p>
            <ul>
              <li>amit@warehouse.com</li>
              <li>rahul@warehouse.com</li>
              <li>neha@warehouse.com</li>
              <li>Password: agent123</li>
            </ul>
          </div>
        </form>

        <Link to="/route-optimization" className="agent-login-back">
          ← Back to Route Optimization
        </Link>
      </div>
    </div>
  )
}
