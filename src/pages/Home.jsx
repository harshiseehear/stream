import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecords } from '../hooks/useRecords'
import { bgPage, textSecondary } from '../theme/colors'
import SearchBar from '../components/Search/SpotlightSearch'
import ThemeToggle from '../components/ThemeToggle'
import { useFilteredRecords } from '../hooks/useFilteredRecords'
import { usePhysics } from '../hooks/usePhysics'
import Graph from '../components/Graph/Graph'
import Sliders from '../components/Graph/Sliders'
import RecordDetails from '../components/RecordDetails/RecordDetails'
import FilterPanel from '../components/Filter/FilterPanel'
import DraggablePanel from '../components/DraggablePanel'

export default function Home() {
  const navigate = useNavigate()
  const records = useRecords()
  const [filterRules, setFilterRules] = useState([])
  const [conjunction, setConjunction] = useState('and')
  const [searchVisible, setSearchVisible] = useState(false)
  const closeSearch = useCallback(() => setSearchVisible(false), [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchVisible(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  const filteredRecords = useFilteredRecords(records, filterRules, conjunction)

  const {
    canvasRef,
    hoveredRecord, setHoveredRecord,
    pinnedRecords, setPinnedRecords,
    pinnedIndicesRef,
    hoveredPosRef,
    attraction, setAttraction,
    repulsion, setRepulsion,
    inherentAttraction, setInherentAttraction,
    focusedSids, setFocusedSids,
  } = usePhysics(filteredRecords)

  const toggleFocus = (sid) => {
    setFocusedSids(prev => {
      const next = new Set(prev)
      if (next.has(sid)) next.delete(sid)
      else next.add(sid)
      return next
    })
  }

  const zCounterRef = useRef(1)
  const [hoveredZIndex, setHoveredZIndex] = useState(0)

  const OG = { x: 16, y: 16 }
  const OVERLAP_THRESHOLD = 40
  const NUDGE_STEP = 24

  const nudgeFrom = (origin, existingPositions) => {
    let candidate = { ...origin }
    const overlaps = (pos) => existingPositions.some(p =>
      Math.abs(p.x - pos.x) < OVERLAP_THRESHOLD && Math.abs(p.y - pos.y) < OVERLAP_THRESHOLD
    )
    let attempts = 0
    while (overlaps(candidate) && attempts < 20) {
      candidate = { x: candidate.x + NUDGE_STEP, y: candidate.y + NUDGE_STEP }
      attempts++
    }
    return candidate
  }

  const handleSearchSelect = (record) => {
    setPinnedRecords(prev => {
      const positions = prev.map(r => r._pos || OG)
      const pos = nudgeFrom(OG, positions)
      return [...prev, {
        ...record,
        _pinId: `${record.sid}-${Date.now()}`,
        _pos: pos,
      }]
    })
  }

  // Find a position for the hovered sticky that doesn't overlap any pinned sticky
  const computeHoveredPos = () => {
    const positions = pinnedRecords.map(r => r._pos || OG)
    return nudgeFrom(OG, positions)
  }
  const hoveredPos = computeHoveredPos()
  hoveredPosRef.current = hoveredPos

  // Bring hovered sticky to front whenever a new record is hovered
  const prevHoveredRef = useRef(null)
  if (hoveredRecord && hoveredRecord !== prevHoveredRef.current) {
    const z = ++zCounterRef.current
    if (z !== hoveredZIndex) setHoveredZIndex(z)
  }
  prevHoveredRef.current = hoveredRecord

  const filterPanel = FilterPanel({ records, rules: filterRules, conjunction, onConjunctionChange: setConjunction, onChange: setFilterRules })

  return (
    <div style={{
      backgroundColor: bgPage,
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Graph ref={canvasRef} />

      <div style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 10,
      }}>
        <ThemeToggle />
        <button
          onClick={() => { sessionStorage.removeItem('ishToken'); navigate('/login') }}
          style={{
            background: 'none',
            border: 'none',
            color: textSecondary,
            fontFamily: 'system-ui, sans-serif',
            fontSize: 12,
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          Sign out
        </button>
      </div>

      <span style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        color: textSecondary,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        zIndex: 10,
      }}>
        {navigator.platform.toUpperCase().includes('MAC') ? '⌘K' : 'Ctrl+Shift+K'} to search
      </span>

      {records === null && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 24,
            height: 24,
            border: `2px solid ${textSecondary}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        color: textSecondary,
        userSelect: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <DraggablePanel title="Graph" defaultWidth={220} defaultHeight={'auto'} defaultX={window.innerWidth - 220 - 16} defaultY={80}>
            <Sliders
              attraction={attraction} setAttraction={setAttraction}
              repulsion={repulsion} setRepulsion={setRepulsion}
              inherentAttraction={inherentAttraction} setInherentAttraction={setInherentAttraction}
            />
          </DraggablePanel>
        </div>

        <div style={{ pointerEvents: 'auto' }}>
          <DraggablePanel title="Views" defaultWidth={220} defaultHeight={200} defaultX={window.innerWidth - 220 - 16} defaultY={200} action={filterPanel.addButton} footer={filterPanel.chatInput}>
            {filterPanel.body}
          </DraggablePanel>
        </div>

        {/* Pinned record stickies */}
        {pinnedRecords.map((rec) => (
          <div key={rec._pinId} style={{ pointerEvents: 'auto', zIndex: rec._zIndex || 0, position: 'relative' }}>
            <RecordDetails
              record={rec}
              pinned={true}
              initialPos={rec._pos}
              initialCollapsed={rec._collapsed}
              focused={focusedSids.has(rec.sid)}
              onToggleFocus={() => toggleFocus(rec.sid)}
              onBringToFront={() => {
                const z = ++zCounterRef.current
                setPinnedRecords(prev => prev.map(p => p._pinId === rec._pinId ? { ...p, _zIndex: z } : p))
              }}
              onUnpin={() => {
                setFocusedSids(prev => { const n = new Set(prev); n.delete(rec.sid); return n })
                setPinnedRecords(prev => prev.filter(p => p._pinId !== rec._pinId))
              }}
              onClose={() => {
                setFocusedSids(prev => { const n = new Set(prev); n.delete(rec.sid); return n })
                setPinnedRecords(prev => prev.filter(p => p._pinId !== rec._pinId))
              }}
              onDragEnd={(newPos) => {
                setPinnedRecords(prev => prev.map(p => p._pinId === rec._pinId ? { ...p, _pos: newPos } : p))
              }}
            />
          </div>
        ))}

        {/* Hovered record sticky */}
        <div style={{ pointerEvents: 'auto', zIndex: hoveredZIndex, position: 'relative' }}>
          <RecordDetails
            record={hoveredRecord}
            pinned={false}
            initialPos={hoveredPos}
            onBringToFront={() => setHoveredZIndex(++zCounterRef.current)}
            onPin={() => {
              if (hoveredRecord) {
                const pinned = { ...hoveredRecord, _pinId: `${hoveredRecord.sid}-${Date.now()}`, _pos: { ...hoveredPos } }
                setPinnedRecords(prev => [...prev, pinned])
                setHoveredRecord(null)
              }
            }}
            onCollapse={() => {
              if (hoveredRecord) {
                const pinned = { ...hoveredRecord, _pinId: `${hoveredRecord.sid}-${Date.now()}`, _pos: { ...hoveredPos }, _collapsed: true }
                setPinnedRecords(prev => [...prev, pinned])
                setHoveredRecord(null)
              }
            }}
            onClose={() => setHoveredRecord(null)}
          />
        </div>

      </div>

      <SearchBar
        records={records}
        onSelect={handleSearchSelect}
        visible={searchVisible}
        onClose={closeSearch}
      />
    </div>
  )
}
