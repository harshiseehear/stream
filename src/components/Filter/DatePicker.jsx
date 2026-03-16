import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { bgPage, borderPanel, textSecondary, textPlaceholder, dropdownHoverBg, dropdownText } from '../../theme/colors'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateTime(d) {
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(d)}T${h}:${min}`
}

export default function DatePicker({ value, onChange, includeTime = false, placeholder = 'Date' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const dropRef = useRef(null)

  const parsed = parseDate(value)
  const [viewYear, setViewYear] = useState(() => parsed?.getFullYear() ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => parsed?.getMonth() ?? new Date().getMonth())
  const [hours, setHours] = useState(() => parsed ? String(parsed.getHours()).padStart(2, '0') : '00')
  const [minutes, setMinutes] = useState(() => parsed ? String(parsed.getMinutes()).padStart(2, '0') : '00')

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open && parsed) {
      setViewYear(parsed.getFullYear())
      setViewMonth(parsed.getMonth())
      setHours(String(parsed.getHours()).padStart(2, '0'))
      setMinutes(String(parsed.getMinutes()).padStart(2, '0'))
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

  const days = useMemo(() => daysInMonth(viewYear, viewMonth), [viewYear, viewMonth])
  const firstDay = useMemo(() => new Date(viewYear, viewMonth, 1).getDay(), [viewYear, viewMonth])

  const selectedDay = parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth
    ? parsed.getDate() : null

  const label = parsed
    ? (includeTime ? `${MONTHS[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()} ${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}` : `${MONTHS[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}`)
    : placeholder

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const selectDay = (day) => {
    const d = new Date(viewYear, viewMonth, day, parseInt(hours) || 0, parseInt(minutes) || 0)
    onChange(includeTime ? formatDateTime(d) : formatDate(d))
    if (!includeTime) setOpen(false)
  }

  const onTimeChange = (h, m) => {
    setHours(h)
    setMinutes(m)
    if (parsed) {
      const d = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), parseInt(h) || 0, parseInt(m) || 0)
      onChange(formatDateTime(d))
    }
  }

  const navBtn = {
    background: 'none',
    border: 'none',
    color: textSecondary,
    cursor: 'pointer',
    fontSize: 13,
    padding: '2px 6px',
    borderRadius: 4,
    fontFamily: 'system-ui, sans-serif',
  }

  const cellBase = {
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontFamily: 'system-ui, sans-serif',
    borderRadius: 6,
    cursor: 'pointer',
    color: dropdownText,
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
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
          maxWidth: 180,
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
          padding: 8,
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          width: 220,
        }}>
          {/* Header: nav + month/year */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <button onClick={prevMonth} style={navBtn}>‹</button>
            <span style={{ fontSize: 11, fontFamily: 'system-ui, sans-serif', color: textSecondary, fontWeight: 600 }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} style={navBtn}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
            {DAYS.map(d => (
              <div key={d} style={{ ...cellBase, cursor: 'default', fontSize: 9, color: textPlaceholder, fontWeight: 600 }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`blank-${i}`} style={cellBase} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const day = i + 1
              const isSelected = day === selectedDay
              const isToday = (() => {
                const now = new Date()
                return viewYear === now.getFullYear() && viewMonth === now.getMonth() && day === now.getDate()
              })()
              return (
                <div
                  key={day}
                  onClick={() => selectDay(day)}
                  style={{
                    ...cellBase,
                    background: isSelected ? `rgba(139, 115, 85, 0.2)` : 'transparent',
                    fontWeight: isSelected ? 700 : isToday ? 600 : 400,
                    border: isToday && !isSelected ? `1px solid ${borderPanel}` : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = dropdownHoverBg }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  {day}
                </div>
              )
            })}
          </div>

          {/* Time section */}
          {includeTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'center' }}>
              <input
                type="text"
                maxLength={2}
                value={hours}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                  onTimeChange(v, minutes)
                }}
                onBlur={() => {
                  const h = Math.min(23, Math.max(0, parseInt(hours) || 0))
                  onTimeChange(String(h).padStart(2, '0'), minutes)
                }}
                style={{
                  width: 28,
                  border: `1px solid ${borderPanel}`,
                  borderRadius: 6,
                  background: 'transparent',
                  color: textSecondary,
                  fontSize: 11,
                  fontFamily: 'system-ui, sans-serif',
                  textAlign: 'center',
                  padding: '2px 0',
                  outline: 'none',
                }}
              />
              <span style={{ color: textSecondary, fontSize: 11 }}>:</span>
              <input
                type="text"
                maxLength={2}
                value={minutes}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                  onTimeChange(hours, v)
                }}
                onBlur={() => {
                  const m = Math.min(59, Math.max(0, parseInt(minutes) || 0))
                  onTimeChange(hours, String(m).padStart(2, '0'))
                }}
                style={{
                  width: 28,
                  border: `1px solid ${borderPanel}`,
                  borderRadius: 6,
                  background: 'transparent',
                  color: textSecondary,
                  fontSize: 11,
                  fontFamily: 'system-ui, sans-serif',
                  textAlign: 'center',
                  padding: '2px 0',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Clear */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              onClick={() => { onChange(''); setOpen(false) }}
              style={{
                background: 'none',
                border: 'none',
                color: textPlaceholder,
                fontSize: 10,
                fontFamily: 'system-ui, sans-serif',
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
