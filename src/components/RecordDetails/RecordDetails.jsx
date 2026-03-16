import { useState, useRef, useCallback } from 'react'
import StatusBadge from './StatusBadge'
import TimestampDisplay from './TimestampDisplay'
import FieldSection from './FieldSection'
import { recordDetailFallback } from '../../theme/colors'

export default function RecordDetails({ record, onUnpin }) {
  if (!record) return null

  const [collapsed, setCollapsed] = useState(false)
  const [pos, setPos] = useState({ x: 16, y: 368 })
  const [size, setSize] = useState({ w: 280, h: 380 })
  const dragRef = useRef(null)
  const resizeRef = useRef(null)

  const onHeaderMouseDown = useCallback((e) => {
    if (e.detail === 2) return // let dblclick handle it
    e.preventDefault()
    const startX = e.clientX - pos.x
    const startY = e.clientY - pos.y
    const onMove = (ev) => setPos({ x: ev.clientX - startX, y: ev.clientY - startY })
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [pos])

  const onResizeMouseDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.w
    const startH = size.h
    const onMove = (ev) => {
      setSize({
        w: Math.max(180, startW + ev.clientX - startX),
        h: Math.max(60, startH + ev.clientY - startY),
      })
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [size])

  const [cr, cg, cb] = record.templateColor || recordDetailFallback
  const bgColor = `rgb(${Math.min(cr + 100, 255)}, ${Math.min(cg + 100, 255)}, ${Math.min(cb + 90, 255)})`
  const textColor = `rgb(${Math.max(cr - 60, 20)}, ${Math.max(cg - 60, 20)}, ${Math.max(cb - 60, 20)})`
  const subtleColor = `rgba(${Math.max(cr - 40, 30)}, ${Math.max(cg - 40, 30)}, ${Math.max(cb - 40, 30)}, 0.5)`
  const borderColor = `rgba(${cr}, ${cg}, ${cb}, 0.25)`

  return (
    <div style={{
      position: 'absolute',
      left: pos.x,
      top: pos.y,
      background: bgColor,
      borderRadius: 3,
      width: size.w,
      ...(collapsed ? {} : { height: size.h }),
      overflow: 'hidden',
      fontSize: 11,
      lineHeight: 1.5,
      color: textColor,
      border: `1px solid ${borderColor}`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      opacity: 0.75,
    }}>
      {/* Sticky header bar — drag to move, dblclick to collapse */}
      <div
        onMouseDown={onHeaderMouseDown}
        onDoubleClick={() => setCollapsed(c => !c)}
        style={{
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        {record.templateLabel && (
          <span style={{ fontWeight: 700, fontSize: 12, color: textColor }}>{record.templateLabel}</span>
        )}
        <span style={{ fontSize: 10, color: subtleColor, fontWeight: 500 }}>{record.sid}</span>
        <StatusBadge label={record.statusLabel} color={record.statusColor} />
        {onUnpin && (
          <span
            style={{ marginLeft: 'auto', cursor: 'pointer', opacity: 0.5, fontSize: 10, lineHeight: 1, color: textColor }}
            onClick={onUnpin}
            title="Unpin"
          >✕</span>
        )}
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={{ padding: '8px 10px 10px', overflowY: 'auto', height: 'calc(100% - 30px)' }}>
          {record.fieldSections && record.fieldSections.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {record.fieldSections.map((sec, si) => (
                <FieldSection key={si} sectionLabel={sec.sectionLabel} fields={sec.fields} borderColor={borderColor} subtleColor={subtleColor} />
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.4, fontStyle: 'italic' }}>No fields</div>
          )}

          <TimestampDisplay createdByName={record.createdByName} recordCreated={record.recordCreated} lastUpdate={record.lastUpdate} color={subtleColor} />
        </div>
      )}

      {/* Resize handle */}
      {!collapsed && (
        <div
          onMouseDown={onResizeMouseDown}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 12,
            height: 12,
            cursor: 'nwse-resize',
          }}
        />
      )}
    </div>
  )
}
