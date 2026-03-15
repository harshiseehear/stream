import { useRecords } from '../hooks/useRecords'
import { usePhysics } from '../hooks/usePhysics'
import Graph from '../components/Graph/Graph'
import Sliders from '../components/Graph/Sliders'
import RecordDetails from '../components/RecordDetails/RecordDetails'

export default function Home() {
  const records = useRecords()

  const {
    canvasRef,
    hoveredRecord,
    pinnedRecord, setPinnedRecord,
    pinnedIdxRef,
    attraction, setAttraction,
    repulsion, setRepulsion,
    inherentAttraction, setInherentAttraction,
  } = usePhysics(records)

  return (
    <div style={{
      backgroundColor: '#f5f5dc',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Graph ref={canvasRef} />

      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        color: '#7a6a5a',
        userSelect: 'none',
      }}>
        <Sliders
          attraction={attraction} setAttraction={setAttraction}
          repulsion={repulsion} setRepulsion={setRepulsion}
          inherentAttraction={inherentAttraction} setInherentAttraction={setInherentAttraction}
        />

        <RecordDetails
          record={hoveredRecord || pinnedRecord}
          onUnpin={pinnedRecord ? () => { pinnedIdxRef.current = null; setPinnedRecord(null) } : null}
        />
      </div>
    </div>
  )
}
