import { useState } from 'react'
import { useRecords } from '../hooks/useRecords'
import { bgPage, textSecondary } from '../theme/colors'
import { useFilteredRecords } from '../hooks/useFilteredRecords'
import { usePhysics } from '../hooks/usePhysics'
import Graph from '../components/Graph/Graph'
import Sliders from '../components/Graph/Sliders'
import RecordDetails from '../components/RecordDetails/RecordDetails'
import FilterPanel from '../components/Filter/FilterPanel'
import DraggablePanel from '../components/DraggablePanel'

export default function Home() {
  const records = useRecords()
  const [filterRules, setFilterRules] = useState([])
  const [conjunction, setConjunction] = useState('and')
  const filteredRecords = useFilteredRecords(records, filterRules, conjunction)

  const {
    canvasRef,
    hoveredRecord,
    pinnedRecord, setPinnedRecord,
    pinnedIdxRef,
    attraction, setAttraction,
    repulsion, setRepulsion,
    inherentAttraction, setInherentAttraction,
  } = usePhysics(filteredRecords)

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
        inset: 0,
        pointerEvents: 'none',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        color: textSecondary,
        userSelect: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <DraggablePanel title="Filters" defaultWidth={320} defaultHeight={200} defaultX={16} defaultY={16} action={filterPanel.addButton}>
            {filterPanel.body}
          </DraggablePanel>
        </div>

        <div style={{ pointerEvents: 'auto' }}>
          <DraggablePanel title="Graph" defaultWidth={260} defaultHeight={120} defaultX={16} defaultY={232}>
            <Sliders
              attraction={attraction} setAttraction={setAttraction}
              repulsion={repulsion} setRepulsion={setRepulsion}
              inherentAttraction={inherentAttraction} setInherentAttraction={setInherentAttraction}
            />
          </DraggablePanel>
        </div>

        <div style={{ pointerEvents: 'auto' }}>
          <RecordDetails
            record={hoveredRecord || pinnedRecord}
            onUnpin={pinnedRecord ? () => { pinnedIdxRef.current = null; setPinnedRecord(null) } : null}
          />
        </div>
      </div>
    </div>
  )
}
