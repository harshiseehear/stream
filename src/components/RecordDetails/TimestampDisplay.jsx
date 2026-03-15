import { formatDate } from '../../utils/formatDate'

export default function TimestampDisplay({ createdByName, recordCreated, lastUpdate }) {
  if (!createdByName && !recordCreated && !lastUpdate) return null
  return (
    <div style={{ fontSize: 10, opacity: 0.45, marginBottom: 8, lineHeight: 1.6 }}>
      {createdByName && <div>{createdByName}</div>}
      {recordCreated && <div>Created {formatDate(recordCreated) || recordCreated}</div>}
      {lastUpdate && <div>Modified {formatDate(lastUpdate) || lastUpdate}</div>}
    </div>
  )
}
