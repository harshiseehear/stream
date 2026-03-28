import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/cell/auth'
import { bgPage, textPrimary, textSecondary, colorError, borderPanel } from '../theme/colors'
import ThemeToggle from '../components/ThemeToggle'

const Bubbles = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h
    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const bubbles = Array.from({ length: 5 }).map(() => {
      const r = Math.random() * 40 + 40 // 40 to 80 radius
      return {
        x: Math.random() * (w - r * 2) + r,
        y: Math.random() * (h - r * 2) + r,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        r,
      }
    })

    let animId
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      
      const color = getComputedStyle(document.documentElement).getPropertyValue('--border-panel').trim() || '#ccc'

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i]
        b.x += b.vx
        b.y += b.vy

        if (b.x - b.r < 0) { b.x = b.r; b.vx *= -1 }
        if (b.x + b.r > w) { b.x = w - b.r; b.vx *= -1 }
        if (b.y - b.r < 0) { b.y = b.r; b.vy *= -1 }
        if (b.y + b.r > h) { b.y = h - b.r; b.vy *= -1 }

        for (let j = i + 1; j < bubbles.length; j++) {
          const b2 = bubbles[j]
          const dx = b2.x - b.x
          const dy = b2.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = b.r + b2.r

          if (dist < minDist) {
            const angle = Math.atan2(dy, dx)
            const sin = Math.sin(angle)
            const cos = Math.cos(angle)

            const v1n = b.vx * cos + b.vy * sin
            const v1t = -b.vx * sin + b.vy * cos
            const v2n = b2.vx * cos + b2.vy * sin
            const v2t = -b2.vx * sin + b2.vy * cos

            const m1 = b.r
            const m2 = b2.r

            const v1n_after = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2)
            const v2n_after = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2)

            b.vx = v1n_after * cos - v1t * sin
            b.vy = v1n_after * sin + v1t * cos
            b2.vx = v2n_after * cos - v2t * sin
            b2.vy = v2n_after * sin + v2t * cos

            const overlap = minDist - dist
            const sepX = (overlap / 2) * cos + 0.1 * cos
            const sepY = (overlap / 2) * sin + 0.1 * sin

            b.x -= sepX
            b.y -= sepY
            b2.x += sepX
            b2.y += sepY
          }
        }

        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.globalAlpha = 0.15
        ctx.fill()
        ctx.strokeStyle = color
        ctx.globalAlpha = 0.3
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
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
        pointerEvents: 'none'
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
      overflow: 'hidden',
      backgroundColor: bgPage,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Bubbles />
      {/* Panel box */}
      <div style={{
        position: 'relative',
        zIndex: 1,
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
        zIndex: 1,
      }}>
        <ThemeToggle />
      </div>
    </div>
  )
}
