import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import { login, signup, updateUserProfile } from '../supabaseAuth'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        // Login with Supabase
        const result = await login(form.email, form.password)
        
        if (result.user) {
          localStorage.setItem('email', form.email)
          setSuccess('Login successful! Redirecting...')
          
          // Redirect to dashboard after 1 second
          setTimeout(() => {
            navigate('/dashboard')
          }, 1000)
        }
      } else {
        // Register with Supabase
        const result = await signup(form.email, form.password, form.displayName)

        // Try to update profile
        if (form.displayName) {
          try {
            await updateUserProfile(form.displayName)
          } catch (profileErr) {
            console.warn('Profile update note:', profileErr)
          }
        }

        localStorage.setItem('email', form.email)
        
        // Show appropriate message based on Supabase settings
        setSuccess(`Registration successful! 
        
A confirmation email has been sent. Please verify your email to complete registration, then log in.`)
        
        // Reset form and switch to login after 3 seconds
        setTimeout(() => {
          setForm({ email: '', password: '', displayName: '' })
          setSuccess('')
          setMode('login')
        }, 3000)
      }
    } catch (err) {
      console.error('Auth error:', err)
      
      // Better error messages
      const errorMsg = err.message || 'Authentication failed'
      
      if (errorMsg.includes('already registered') || errorMsg.includes('User already exists')) {
        setError('This email is already registered. Please try logging in instead.')
      } else if (errorMsg.includes('Invalid login') || errorMsg.includes('Invalid credentials')) {
        setError('Invalid email or password. Please check and try again.')
      } else if (errorMsg.includes('weak password')) {
        setError('Password must be at least 6 characters.')
      } else if (errorMsg.includes('invalid_email')) {
        setError('Please enter a valid email address.')
      } else if (errorMsg.includes('over_email_send_rate_limit')) {
        setError('Too many requests. Please try again in a few minutes.')
      } else if (errorMsg.includes('Email not confirmed')) {
        setError('Please confirm your email first. Check your inbox for the confirmation link.')
      } else {
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-icon">📦</span>
        <h1 className="login-title">Warehouse AI</h1>
        <p className="login-sub">{mode === 'login' ? 'Sign in to your account' : 'Create an account'}</p>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <input
              className="login-input"
              type="text"
              placeholder="Full Name"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              required
            />
          )}
          <input
            className="login-input"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="off"
            required
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            required
          />
          
          {mode === 'login' && (
            <button 
              type="button"
              className="forgot-password-btn"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot Password?
            </button>
          )}
          
          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}
          
          <button className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="login-toggle">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button 
            type="button"
            className="toggle-btn" 
            onClick={() => { 
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
              setSuccess('')
            }}
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}
