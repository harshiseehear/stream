import { formatDate } from '../../utils/formatDate'

export default function TimestampDisplay({ recordCreated, lastUpdate }) {
  if (!recordCreated && !lastUpdate) return null
  return (
    <div style={{ fontSize: 10, opacity: 0.45, marginBottom: 8 }}>
      {recordCreated && <span>Created {formatDate(recordCreated) || recordCreated}</span>}
      {recordCreated && lastUpdate && <span style={{ margin: '0 6px' }}>·</span>}
      {lastUpdate && <span>Updated {formatDate(lastUpdate) || lastUpdate}</span>}
    </div>
  )
}
