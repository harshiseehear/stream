import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { bgPage, borderPanel, textSecondary, textPlaceholder, dropdownHoverBg, dropdownText } from '../../theme/colors'

export default function FilterDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)
  const dropRef = useRef(null)

  const selected = options.find(o => (o.value ?? o) === value)
  const label = selected ? (selected.label ?? selected) : (placeholder || 'Select...')

  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter(o => (o.label ?? o).toString().toLowerCase().includes(q))
  }, [options, search])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open || !dropRef.current || !ref.current) return
    const triggerRect = ref.current.getBoundingClientRect()
    const el = dropRef.current
    let top = triggerRect.bottom + 4
    let left = triggerRect.left
    if (top + el.offsetHeight > window.innerHeight - 8) {
      top = Math.max(8, triggerRect.top - el.offsetHeight - 4)
    }
    if (left + el.offsetWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - el.offsetWidth - 8)
    }
    el.style.top = top + 'px'
    el.style.left = left + 'px'
  }, [open])

  const select = (val) => {
    onChange(val)
    setOpen(false)
  }

  const openDropdown = () => {
    setOpen(o => !o)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        onClick={openDropdown}
        style={{
          border: `1px solid ${borderPanel}`,
          borderRadius: 999,
          background: 'transparent',
          color: value ? textSecondary : textPlaceholder,
          padding: '2px 8px',
          fontSize: 11,
          fontFamily: 'system-ui, sans-serif',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 150,
          lineHeight: 1.3,
        }}
      >
        {label}
      </button>
      {open && (
        <div ref={dropRef} style={{
          position: 'fixed',
          background: bgPage,
          border: `1px solid ${borderPanel}`,
          borderRadius: 10,
          padding: 6,
          zIndex: 9999,
          maxHeight: 220,
          minWidth: 160,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder=""
            style={{
              border: `1px solid ${borderPanel}`,
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              fontFamily: 'system-ui, sans-serif',
              outline: 'none',
              marginBottom: 4,
              background: 'transparent',
              color: dropdownText,
            }}
          />
          <div style={{ overflowY: 'auto', maxHeight: 160 }}>
            {placeholder && !search && (
              <div
                onClick={() => select('')}
                style={{
                  padding: '4px 8px',
                  fontSize: 11,
                  fontFamily: 'system-ui, sans-serif',
                  color: textPlaceholder,
                  cursor: 'pointer',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {placeholder}
              </div>
            )}
            {filtered.map(opt => {
              const val = opt.value ?? opt
              const lbl = opt.label ?? opt
              return (
                <div
                  key={val}
                  onClick={() => select(val)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    fontFamily: 'system-ui, sans-serif',
                    color: dropdownText,
                    cursor: 'pointer',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    fontWeight: val === value ? 600 : 400,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {lbl}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '4px 8px', fontSize: 11, color: textPlaceholder, fontFamily: 'system-ui, sans-serif' }}>
                No matches
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
