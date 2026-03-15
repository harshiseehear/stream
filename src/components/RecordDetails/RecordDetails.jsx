import StatusBadge from './StatusBadge'
import TimestampDisplay from './TimestampDisplay'
import FieldSection from './FieldSection'

export default function RecordDetails({ record, onUnpin }) {
  if (!record) return null
  return (
    <div style={{
      marginTop: 12,
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.82)',
      borderRadius: 8,
      maxWidth: 320,
      maxHeight: 400,
      overflowY: 'auto',
      fontSize: 11,
      lineHeight: 1.5,
      color: '#5a4a3a',
      backdropFilter: 'blur(6px)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid rgba(160,133,110,0.15)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{record.sid}</span>
        {record.templateLabel && (
          <span style={{ fontSize: 10, opacity: 0.55, fontWeight: 500 }}>{record.templateLabel}</span>
        )}
        {onUnpin && (
          <span
            style={{ marginLeft: 'auto', cursor: 'pointer', opacity: 0.4, fontSize: 10, lineHeight: 1 }}
            onClick={onUnpin}
            title="Unpin"
          >✕</span>
        )}
      </div>

      <StatusBadge label={record.statusLabel} color={record.statusColor} />
      <TimestampDisplay recordCreated={record.recordCreated} lastUpdate={record.lastUpdate} />

      {record.fieldSections && record.fieldSections.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {record.fieldSections.map((sec, si) => (
            <FieldSection key={si} sectionLabel={sec.sectionLabel} fields={sec.fields} />
          ))}
        </div>
      ) : (
        <div style={{ opacity: 0.4, fontStyle: 'italic' }}>No fields</div>
      )}
    </div>
  )
}
