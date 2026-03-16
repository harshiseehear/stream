import { formatDate } from '../../utils/formatDate'

export default function TimestampDisplay({ createdByName, recordCreated, lastUpdate, color }) {
  if (!createdByName && !recordCreated && !lastUpdate) return null
  return (
    <div style={{ fontSize: 10, color: color || undefined, opacity: color ? 1 : 0.45, marginTop: 10, marginBottom: 8, lineHeight: 1.6 }}>
      {createdByName && <div>{createdByName}</div>}
      {recordCreated && <div>Created {formatDate(recordCreated) || recordCreated}</div>}
      {lastUpdate && <div>Modified {formatDate(lastUpdate) || lastUpdate}</div>}
    </div>
  )
}
