import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { bgPage, borderPanel, dropdownHoverBg, dropdownText } from '../theme/colors'

export default function SettingsMenu({ onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const dropRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useLayoutEffect(() => {
    if (!open || !dropRef.current || !ref.current) return
    const triggerRect = ref.current.getBoundingClientRect()
    const el = dropRef.current
    const height = el.offsetHeight
    const width = el.offsetWidth
    let top = triggerRect.bottom + 6
    let left = triggerRect.right - width
    if (left < 8) left = 8
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8
    if (top + height > window.innerHeight - 8) top = Math.max(8, triggerRect.top - height - 6)
    el.style.top = top + 'px'
    el.style.left = left + 'px'
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
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
        title="Settings"
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.opacity = '0.7' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" />
        </svg>
      </button>

      {open && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            background: bgPage,
            border: `1px solid ${borderPanel}`,
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 9999,
            minWidth: 120,
            padding: 6,
          }}
        >
          <button
            onClick={() => { setOpen(false); onSignOut() }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '4px 8px',
              background: 'transparent',
              border: 'none',
              color: dropdownText,
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'system-ui, sans-serif',
              borderRadius: 4,
            }}
            onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
