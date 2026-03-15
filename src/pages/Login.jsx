import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/cell/auth'

export default function Login() {
  const [brownColor, setBrownColor] = useState('#a0856e')
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

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight

      const r = Math.round(150 + x * 20)
      const g = Math.round(125 + y * 15)
      const b = Math.round(100 + (1 - x) * 20)

      setBrownColor(`rgb(${r}, ${g}, ${b})`)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div style={{
      backgroundColor: '#f5f5dc',
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
            color: brownColor,
            transition: 'color 0.1s ease',
          }}>stream</span>
          <span style={{
            color: '#333',
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
              borderBottom: '1px solid #333',
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
              borderBottom: '1px solid #333',
              backgroundColor: 'transparent',
              fontSize: '1rem',
              outline: 'none',
              fontFamily: 'system-ui, sans-serif',
              borderRadius: 0,
            }}
          />
          {error && (
            <span style={{ color: '#c44', fontSize: '0.85rem', fontFamily: 'system-ui, sans-serif' }}>
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
              color: '#333',
              fontSize: '1rem',
              fontFamily: 'system-ui, sans-serif',
              cursor: loading ? 'wait' : 'pointer',
              textAlign: 'left',
              textDecoration: 'none',
            }}
          >{loading ? '...' : 'enter'}</button>
        </div>
      </div>
    </div>
  )
}
