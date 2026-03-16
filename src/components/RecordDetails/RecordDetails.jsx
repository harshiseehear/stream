import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import StatusBadge from './StatusBadge'
import TimestampDisplay from './TimestampDisplay'
import FieldSection from './FieldSection'
import { recordDetailFallback } from '../../theme/colors'

export default function RecordDetails({ record, onPin, onUnpin, onClose, onCollapse, pinned, initialPos, initialCollapsed, onDragEnd, onBringToFront, focused, onToggleFocus }) {
  if (!record) return null

  const [collapsed, setCollapsed] = useState(!!initialCollapsed)
  const [pos, setPos] = useState(initialPos || { x: 16, y: 368 })
  const [size, setSize] = useState({ w: 320, h: 380 })
  const dragRef = useRef(null)
  const resizeRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  useLayoutEffect(() => {
    if (!pinned && initialPos) {
      setPos(initialPos)
    }
  }, [initialPos?.x, initialPos?.y, pinned])

  const onHeaderMouseDown = useCallback((e) => {
    if (e.detail === 2) return
    e.preventDefault()
    if (onBringToFront) onBringToFront()
    setDragging(true)
    const startX = e.clientX - pos.x
    const startY = e.clientY - pos.y
    let lastPos = { x: pos.x, y: pos.y }
    const onMove = (ev) => { lastPos = { x: ev.clientX - startX, y: ev.clientY - startY }; setPos(lastPos) }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); setDragging(false); if (onDragEnd) onDragEnd(lastPos) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [pos, onDragEnd, onBringToFront])

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
    <div
      onMouseDown={() => { if (onBringToFront) onBringToFront() }}
      style={{
      position: 'absolute',
      left: pos.x,
      top: pos.y,
      background: bgColor,
      borderRadius: collapsed ? 999 : 3,
      ...(collapsed ? {} : { width: size.w, height: size.h }),
      overflow: 'hidden',
      fontSize: 11,
      lineHeight: 1.5,
      color: textColor,
      border: `1px solid ${borderColor}`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      opacity: pinned ? 0.9 : 0.75,
      transition: dragging
        ? 'border-radius 0.15s ease'
        : 'left 0.25s ease, top 0.25s ease, border-radius 0.15s ease',
    }}>
      {/* Sticky header bar — drag to move, dblclick to collapse */}
      <div
        onMouseDown={onHeaderMouseDown}
        onDoubleClick={() => {
          if (!pinned && onCollapse) {
            onCollapse(pos)
          } else {
            setCollapsed(c => !c)
          }
        }}
        style={{
          padding: collapsed ? '4px 12px' : '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'grab',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {collapsed ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: textColor }}>{record.sid}</span>
        ) : (
          <>
            {record.templateLabel && (
              <span style={{ fontWeight: 700, fontSize: 12, color: textColor }}>{record.templateLabel}</span>
            )}
            <span style={{ fontSize: 10, color: subtleColor, fontWeight: 500 }}>{record.sid}</span>
            <StatusBadge label={record.statusLabel} color={record.statusColor} />
            {typeof record.linkCount === 'number' && (
              <span style={{ fontSize: 9, color: subtleColor, fontWeight: 500 }}>{record.linkCount} link{record.linkCount !== 1 ? 's' : ''}</span>
            )}
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              {onToggleFocus && (
                <span
                  onClick={(e) => { e.stopPropagation(); onToggleFocus() }}
                  title="Focus"
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: `2px solid ${textColor}`,
                    background: focused ? textColor : 'transparent',
                    cursor: 'pointer',
                    opacity: focused ? 1 : 0.4,
                    transition: 'background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease',
                    flexShrink: 0,
                  }}
                />
              )}
              {(onPin || onUnpin) && (
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill={textColor}
                  style={{ opacity: pinned ? 0.85 : 0.25, cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); pinned ? onUnpin?.() : onPin?.(pos) }}
                  title={pinned ? 'Unpin' : 'Pin'}
                >
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                </svg>
              )}
              <span
                style={{ cursor: 'pointer', opacity: 0.6, fontSize: 12, lineHeight: 1, color: textColor }}
                onClick={(e) => { e.stopPropagation(); onClose?.() }}
                title="Close"
              >✕</span>
            </span>
          </>
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

          <TimestampDisplay createdByName={record.createdByName} recordCreated={record.recordCreated} lastUpdate={record.lastUpdate} color={subtleColor} containerLabel={record.containerLabel} containerLevelLabel={record.containerLevelLabel} />
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
