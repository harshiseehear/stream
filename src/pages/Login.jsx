import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/cell/auth'
import { bgPage, brandAccent, textPrimary, textSecondary, colorError, borderPanel } from '../theme/colors'
import ThemeToggle from '../components/ThemeToggle'

function DotGridBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width, height
    let dots = []
    const spacing = 30
    let mouse = { x: -1000, y: -1000 }
    
    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
      
      dots = []
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 })
        }
      }
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const handleMouseLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    resize()

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      
      const dotColor = getComputedStyle(document.documentElement).getPropertyValue('--border-panel').trim() || '#8b7355'
      ctx.fillStyle = dotColor

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        
        const dx = mouse.x - dot.x
        const dy = mouse.y - dot.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        const maxDist = 80
        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist
          const angle = Math.atan2(dy, dx)
          dot.vx -= Math.cos(angle) * force * 1.5
          dot.vy -= Math.sin(angle) * force * 1.5
        }

        dot.vx += (dot.ox - dot.x) * 0.05
        dot.vy += (dot.oy - dot.y) * 0.05
        
        dot.vx *= 0.8
        dot.vy *= 0.8
        
        dot.x += dot.vx
        dot.y += dot.vy

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

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
      position: 'relative',
      backgroundColor: bgPage,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <DotGridBackground />
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
