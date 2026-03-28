import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/cell/auth'
import { bgPage, brandAccent, textPrimary, textSecondary, colorError, borderPanel } from '../theme/colors'
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
      navigate('/home/graph')
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
      {/* Panel box */}
      <div style={{
        position: 'relative',
        border: `1px solid ${borderPanel}`,
        borderRadius: 20,
        background: 'transparent',
        width: 280,
        height: 280,
        padding: '32px 20px 20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Title on top border */}
        <div style={{
          position: 'absolute',
          top: -7,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          zIndex: 1,
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: textSecondary,
            background: bgPage,
            padding: '0 6px',
            lineHeight: 1,
            fontFamily: 'system-ui, sans-serif',
          }}>Streamcell</span>
        </div>

        {/* Inputs */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          height: '100%',
          marginTop: -20,
        }}>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              padding: '8px 0',
              border: 'none',
              borderBottom: `1px solid ${borderPanel}`,
              backgroundColor: 'transparent',
              color: textPrimary,
              fontSize: '1rem',
              outline: 'none',
              fontFamily: 'system-ui, sans-serif',
              borderRadius: 0,
              width: '60%',
              textAlign: 'center',
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
              borderBottom: `1px solid ${borderPanel}`,
              backgroundColor: 'transparent',
              color: textPrimary,
              fontSize: '1rem',
              outline: 'none',
              fontFamily: 'system-ui, sans-serif',
              borderRadius: 0,
              width: '60%',
              textAlign: 'center',
            }}
          />
          {error && (
            <span style={{ color: colorError, fontSize: '0.85rem', fontFamily: 'system-ui, sans-serif' }}>
              {error}
            </span>
          )}
        </div>

        {/* Sandbox label on bottom-left border */}
        <div style={{
          position: 'absolute',
          bottom: -8,
          left: 16,
          background: bgPage,
          padding: '0 6px',
          zIndex: 1,
          lineHeight: 1,
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: textSecondary,
            fontFamily: 'system-ui, sans-serif',
          }}>sandbox</span>
        </div>

        {/* Login button on bottom-right border */}
        <div style={{
          position: 'absolute',
          bottom: -8,
          right: 16,
          background: bgPage,
          padding: '0 6px',
          zIndex: 1,
          lineHeight: 1,
        }}>
          <button
            onClick={handleLogin}
            disabled={loading}
            onMouseEnter={e => e.target.style.textDecoration = 'underline'}
            onMouseLeave={e => e.target.style.textDecoration = 'none'}
            style={{
              padding: 0,
              border: 'none',
              backgroundColor: 'transparent',
              color: textSecondary,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              cursor: loading ? 'wait' : 'pointer',
              textDecoration: 'none',
            }}
          >{loading ? '...' : 'login'}</button>
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
