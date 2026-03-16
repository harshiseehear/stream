import { useState, useCallback } from 'react'
import { borderPanel, textSecondary, bgPage } from '../theme/colors'

const HANDLE_SIZE = 14

const corners = [
  { key: 'br', cursor: 'nwse-resize', bottom: 0, right: 0 },
  { key: 'bl', cursor: 'nesw-resize', bottom: 0, left: 0 },
  { key: 'tr', cursor: 'nesw-resize', top: 0, right: 0 },
  { key: 'tl', cursor: 'nwse-resize', top: 0, left: 0 },
]

export default function DraggablePanel({ title, children, defaultWidth = 260, defaultHeight = 'auto', defaultX = 0, defaultY = 0, action }) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY })
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight })

  const onHeaderMouseDown = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX - pos.x
    const startY = e.clientY - pos.y
    const onMove = (ev) => setPos({ x: ev.clientX - startX, y: ev.clientY - startY })
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [pos])

  const onCornerMouseDown = useCallback((corner, e) => {
    e.preventDefault()
    e.stopPropagation()
    const startMX = e.clientX
    const startMY = e.clientY
    const startW = size.w
    const startH = typeof size.h === 'number' ? size.h : e.target.closest('[data-panel]').offsetHeight
    const startX = pos.x
    const startY = pos.y

    const onMove = (ev) => {
      const dx = ev.clientX - startMX
      const dy = ev.clientY - startMY

      let newW = startW, newH = startH, newX = startX, newY = startY

      if (corner === 'br') {
        newW = Math.max(140, startW + dx)
        newH = Math.max(40, startH + dy)
      } else if (corner === 'bl') {
        newW = Math.max(140, startW - dx)
        newH = Math.max(40, startH + dy)
        newX = startX + startW - newW
      } else if (corner === 'tr') {
        newW = Math.max(140, startW + dx)
        newH = Math.max(40, startH - dy)
        newY = startY + startH - newH
      } else if (corner === 'tl') {
        newW = Math.max(140, startW - dx)
        newH = Math.max(40, startH - dy)
        newX = startX + startW - newW
        newY = startY + startH - newH
      }

      setSize({ w: newW, h: newH })
      setPos({ x: newX, y: newY })
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [size, pos])

  return (
    <div
      data-panel
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        border: `1px solid ${borderPanel}`,
        borderRadius: 20,
        background: 'transparent',
        width: size.w,
        height: typeof size.h === 'number' ? size.h : size.h,
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title on the border */}
      <div
        onMouseDown={onHeaderMouseDown}
        style={{
          position: 'absolute',
          top: -7,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'grab',
          userSelect: 'none',
          zIndex: 1,
        }}
      >
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: textSecondary,
          background: bgPage,
          padding: '0 6px',
          lineHeight: 1,
        }}>{title}</span>
      </div>

      {/* Action on top-right border */}
      {action && (
        <div style={{
          position: 'absolute',
          top: -10.5,
          right: 16,
          background: bgPage,
          padding: '0 6px',
          zIndex: 1,
          lineHeight: 1,
        }}>
          {action}
        </div>
      )}

      {/* Drag zone — full top area */}
      <div
        onMouseDown={onHeaderMouseDown}
        style={{
          height: 14,
          cursor: 'grab',
          flexShrink: 0,
        }}
      />

      {/* Body */}
      <div style={{
        padding: '0 10px 10px',
        overflowY: 'auto',
        flex: 1,
        minHeight: 0,
      }}>
        {children}
      </div>

      {/* Resize handles — all four corners */}
      {corners.map(c => (
        <div
          key={c.key}
          onMouseDown={(e) => onCornerMouseDown(c.key, e)}
          style={{
            position: 'absolute',
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            cursor: c.cursor,
            top: c.top,
            bottom: c.bottom,
            left: c.left,
            right: c.right,
          }}
        />
      ))}
    </div>
  )
}
