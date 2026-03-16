import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useTheme } from '../theme/ThemeContext'
import { bgPage, borderPanel, dropdownHoverBg, dropdownText } from '../theme/colors'

export default function ThemeToggle() {
  const { theme, setTheme, themeNames } = useTheme()
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
    let top = triggerRect.top - height - 6
    let left = triggerRect.right - width
    if (top < 8) top = triggerRect.bottom + 6
    if (left < 8) left = 8
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8
    if (top + height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - height - 8)
    el.style.top = top + 'px'
    el.style.left = left + 'px'
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: 0,
          fontSize: 14,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
        title="Change theme"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
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
          {themeNames.map((name) => (
            <button
              key={name}
              onClick={() => { setTheme(name); setOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '4px 8px',
                background: name === theme ? dropdownHoverBg : 'transparent',
                border: 'none',
                color: dropdownText,
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: 'system-ui, sans-serif',
                textTransform: 'capitalize',
                borderRadius: 4,
                fontWeight: name === theme ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (name !== theme) e.currentTarget.style.background = dropdownHoverBg }}
              onMouseLeave={(e) => { if (name !== theme) e.currentTarget.style.background = 'transparent' }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
