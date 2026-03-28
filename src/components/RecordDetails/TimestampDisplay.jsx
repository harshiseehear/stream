import { formatDate } from '../../utils/formatDate'

export default function TimestampDisplay({ createdByName, recordCreated, lastUpdate, color, containerLabel, containerLevelLabel, inline }) {
  if (!createdByName && !recordCreated && !lastUpdate && !containerLabel) return null

  if (inline) {
    const parts = [
      containerLabel && `${containerLevelLabel || 'Container'}: ${containerLabel}`,
      createdByName,
      recordCreated && `Created ${formatDate(recordCreated) || recordCreated}`,
      lastUpdate && `Modified ${formatDate(lastUpdate) || lastUpdate}`,
    ].filter(Boolean)
    return (
      <span style={{ fontSize: 10, color: color || undefined, opacity: color ? 1 : 0.45, whiteSpace: 'nowrap' }}>
        {parts.join(' · ')}
      </span>
    )
  }

  return (
    <div style={{ fontSize: 10, color: color || undefined, opacity: color ? 1 : 0.45, marginTop: 10, marginBottom: 8, lineHeight: 1.6 }}>
      {containerLabel && <div>{containerLevelLabel || 'Container'}: {containerLabel}</div>}
      {createdByName && <div>{createdByName}</div>}
      {recordCreated && <div>Created {formatDate(recordCreated) || recordCreated}</div>}
      {lastUpdate && <div>Modified {formatDate(lastUpdate) || lastUpdate}</div>}
    </div>
  )
}
