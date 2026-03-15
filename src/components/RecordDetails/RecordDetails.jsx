import StatusBadge from './StatusBadge'
import TimestampDisplay from './TimestampDisplay'
import FieldSection from './FieldSection'

export default function RecordDetails({ record, onUnpin }) {
  if (!record) return null
  return (
    <div style={{
      marginTop: 12,
      padding: '10px 12px',
      background: 'transparent',
      borderRadius: 14,
      maxWidth: 320,
      maxHeight: 400,
      overflowY: 'auto',
      fontSize: 11,
      lineHeight: 1.5,
      color: '#5a4a3a',
      border: '1px solid #a0856e',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {record.templateLabel && (
          <span style={{ fontWeight: 700, fontSize: 13 }}>{record.templateLabel}</span>
        )}
        <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 500 }}>{record.sid}</span>
        <StatusBadge label={record.statusLabel} color={record.statusColor} />
        {onUnpin && (
          <span
            style={{ marginLeft: 'auto', cursor: 'pointer', opacity: 0.4, fontSize: 10, lineHeight: 1 }}
            onClick={onUnpin}
            title="Unpin"
          >✕</span>
        )}
      </div>

      <TimestampDisplay createdByName={record.createdByName} recordCreated={record.recordCreated} lastUpdate={record.lastUpdate} />

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
