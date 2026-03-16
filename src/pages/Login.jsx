import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/cell/auth'
import { bgPage, brandAccent, textPrimary, colorError, textSecondary } from '../theme/colors'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      backgroundColor: bgPage,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '24px' }}>
        {/* Brand Text */}
        <h1 style={{
          fontSize: '3rem',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
          lineHeight: 1,
        }}>
          <span style={{
            color: brandAccent,
          }}>stream</span>
          <span style={{
            color: textPrimary,
          }}>cell</span>
        </h1>

        {/* Login Inputs */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '320px',
        }}>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              padding: '8px 0',
              border: 'none',
              borderBottom: `1px solid ${textPrimary}`,
              backgroundColor: 'transparent',
              fontSize: '1rem',
              outline: 'none',
              fontFamily: 'system-ui, sans-serif',
              borderRadius: 0,
            }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              padding: '8px 0',
              border: 'none',
              borderBottom: `1px solid ${textPrimary}`,
              backgroundColor: 'transparent',
              fontSize: '1rem',
              outline: 'none',
              fontFamily: 'system-ui, sans-serif',
              borderRadius: 0,
            }}
          />
          {error && (
            <span style={{ color: colorError, fontSize: '0.85rem', fontFamily: 'system-ui, sans-serif' }}>
              {error}
            </span>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
            onMouseLeave={e => e.target.style.textDecoration = 'none'}
            style={{
              padding: '8px 0',
              border: 'none',
              backgroundColor: 'transparent',
              color: textPrimary,
              fontSize: '1rem',
              fontFamily: 'system-ui, sans-serif',
              cursor: loading ? 'wait' : 'pointer',
              textAlign: 'left',
              textDecoration: 'none',
            }}
          >{loading ? '...' : 'enter'}</button>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <ThemeToggle />
      </div>
    </div>
  )
}
