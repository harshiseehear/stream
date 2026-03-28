import { useState, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useFilteredRecords } from '../../hooks/useFilteredRecords'
import { usePhysics } from '../../hooks/usePhysics'
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut'
import { textSecondary } from '../../theme/colors'
import Graph from './Graph'
import Sliders from './Sliders'
import GraphFilterPanel from './GraphFilterPanel'
import DraggablePanel from '../DraggablePanel'
import RecordDetails from '../RecordDetails/RecordDetails'
import SearchBar from '../Search/SpotlightSearch'

export default function GraphView() {
  const { records } = useOutletContext()

  const [filterRules, setFilterRules] = useState([])
  const [conjunctions, setConjunctions] = useState([])
  const [graphViewsVisible] = useState(true)
  const [searchVisible, setSearchVisible] = useState(false)
  const closeSearch = useCallback(() => setSearchVisible(false), [])

  const toggleSearch = useCallback(() => setSearchVisible(v => !v), [])
  useKeyboardShortcut('k', toggleSearch)

  const filteredRecords = useFilteredRecords(records, filterRules, conjunctions)

  const {
    canvasRef,
    hoveredRecord, setHoveredRecord,
    pinnedRecords, setPinnedRecords,
    hoveredPosRef,
    attraction, setAttraction,
    repulsion, setRepulsion,
    inherentAttraction, setInherentAttraction,
    templateAttraction, setTemplateAttraction,
    linkAttraction, setLinkAttraction,
    focusedSids, setFocusedSids,
    selectedSid, setSelectedSid,
    linkCountBySidRef,
  } = usePhysics(filteredRecords)

  const toggleFocus = (sid) => {
    setFocusedSids(prev => {
      const next = new Set(prev)
      if (next.has(sid)) next.delete(sid)
      else next.add(sid)
      return next
    })
  }

  // Sticky z-index management
  const zCounterRef = useRef(1)
  const [hoveredZIndex, setHoveredZIndex] = useState(0)

  // Sticky positioning
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
        linkCount: linkCountBySidRef.current[record.sid] ?? 0,
      }]
    })
  }

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

  const isMac = navigator.platform.toUpperCase().includes('MAC')

  return (
    <>
      <Graph ref={canvasRef} />

      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        zIndex: 10,
      }}>
        <span style={{
          color: textSecondary,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
        }}>
          {isMac ? '⌘K' : 'Ctrl+K'} to search
        </span>
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        color: textSecondary,
        userSelect: 'none',
      }}>
        {/* Sliders panel */}
        <div style={{ pointerEvents: 'auto' }}>
          <DraggablePanel title="Graph" defaultWidth={220} defaultHeight={'auto'} defaultX={window.innerWidth - 220 - 16} defaultY={80}>
            <Sliders
              attraction={attraction} setAttraction={setAttraction}
              repulsion={repulsion} setRepulsion={setRepulsion}
              inherentAttraction={inherentAttraction} setInherentAttraction={setInherentAttraction}
              templateAttraction={templateAttraction} setTemplateAttraction={setTemplateAttraction}
              linkAttraction={linkAttraction} setLinkAttraction={setLinkAttraction}
            />
          </DraggablePanel>
        </div>

        {/* Filter panel */}
        {graphViewsVisible && (
          <GraphFilterPanel
            records={records}
            filterRules={filterRules}
            onFilterChange={setFilterRules}
            conjunctions={conjunctions}
            onConjunctionsChange={setConjunctions}
          />
        )}

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
                setSelectedSid(rec.sid)
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
            onBringToFront={() => { setHoveredZIndex(++zCounterRef.current); setSelectedSid(hoveredRecord?.sid ?? null) }}
            onPin={(currentPos) => {
              if (hoveredRecord) {
                const pinned = { ...hoveredRecord, _pinId: `${hoveredRecord.sid}-${Date.now()}`, _pos: currentPos || { ...hoveredPos } }
                setPinnedRecords(prev => [...prev, pinned])
                setHoveredRecord(null)
              }
            }}
            onCollapse={(currentPos) => {
              if (hoveredRecord) {
                const pinned = { ...hoveredRecord, _pinId: `${hoveredRecord.sid}-${Date.now()}`, _pos: currentPos || { ...hoveredPos }, _collapsed: true }
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
    </>
  )
}
