import { formatDate } from '../../utils/formatDate'

export default function TimestampDisplay({ createdByName, recordCreated, lastUpdate, color, containerLabel, containerLevelLabel }) {
  if (!createdByName && !recordCreated && !lastUpdate && !containerLabel) return null
  return (
    <div style={{ fontSize: 10, color: color || undefined, opacity: color ? 1 : 0.45, marginTop: 10, marginBottom: 8, lineHeight: 1.6 }}>
      {containerLabel && <div>{containerLevelLabel || 'Container'}: {containerLabel}</div>}
      {createdByName && <div>{createdByName}</div>}
      {recordCreated && <div>Created {formatDate(recordCreated) || recordCreated}</div>}
      {lastUpdate && <div>Modified {formatDate(lastUpdate) || lastUpdate}</div>}
    </div>
  )
}
