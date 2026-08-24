import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../supabaseAuth'
import './Navbar.css'

const baseNavLinks = [
  { path: '/', label: 'Home' },
  { path: '/features', label: 'Features' },
  { path: '/system-modules', label: 'System Modules' },
  { path: '/data', label: 'Datasets' },
  { path: '/model-tester', label: 'Model Tester' },
  { path: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const email = localStorage.getItem('user_email')
    setIsLoggedIn(!!token)
    setUserEmail(email || '')
  }, [location])

  const handleLogout = async () => {
    try {
      await logout()
      setIsLoggedIn(false)
      setUserEmail('')
      setMenuOpen(false)
      navigate('/')
    } catch (err) {
      console.error('Logout error:', err)
      setIsLoggedIn(false)
      setUserEmail('')
      setMenuOpen(false)
      navigate('/')
    }
  }

  const navLinks = [
    ...baseNavLinks,
    ...(isLoggedIn
      ? []
      : [{ path: '/login', label: 'Login' }]),
  ]

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">📦</span>
          <span>Warehouse AI</span>
        </Link>
        <button
          className="navbar-toggle"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
        </button>
        <nav className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn && (
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}