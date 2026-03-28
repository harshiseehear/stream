import { useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useRecords } from '../../hooks/useRecords'
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut'
import { bgPage, textSecondary } from '../../theme/colors'
import HeaderActions from './HeaderActions'

export default function HomeLayout() {
  const records = useRecords()
  const navigate = useNavigate()
  const location = useLocation()

  const toggleView = useCallback(() => {
    const isGraph = location.pathname.endsWith('/graph')
    navigate(isGraph ? '/home/table' : '/home/graph', { replace: true })
  }, [location.pathname, navigate])

  useKeyboardShortcut('g', toggleView)

  const isMac = navigator.platform.toUpperCase().includes('MAC')

  return (
    <div style={{
      backgroundColor: bgPage,
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <HeaderActions />

      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        zIndex: 10,
      }}>
        <span style={{
          color: textSecondary,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
        }}>
          {isMac ? '⌘G' : 'Ctrl+G'} to toggle view
        </span>
      </div>

      {records === null && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" style={{ animation: 'orbit-spin 1.2s linear infinite' }}>
            <circle cx="16" cy="16" r="12" fill="none" stroke={textSecondary} strokeWidth="1.5" opacity="0.45" />
            <circle cx="16" cy="4" r="2.5" fill={textSecondary} />
          </svg>
          <style>{`@keyframes orbit-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      <Outlet context={{ records }} />
    </div>
  )
}
