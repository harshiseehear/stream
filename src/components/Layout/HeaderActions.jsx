import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'
import SettingsMenu from '../SettingsMenu'

export default function HeaderActions() {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      right: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      zIndex: 10,
    }}>
      {/* AI Assistant */}
      <button
        title="AI Assistant"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '3px 5px',
          borderRadius: 6,
          fontSize: 14,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          opacity: 0.7,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
      {/* Details */}
      <button
        title="Details"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '3px 5px',
          borderRadius: 6,
          fontSize: 14,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          opacity: 0.7,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>
      <ThemeToggle />
      <SettingsMenu onSignOut={() => { sessionStorage.removeItem('ishToken'); navigate('/login') }} />
    </div>
  )
}
