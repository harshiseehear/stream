import StatusBadge from './StatusBadge'
import TimestampDisplay from './TimestampDisplay'
import FieldSection from './FieldSection'
import { bgPage, textPrimary, textSecondary, borderPanel } from '../../theme/colors'

export default function RecordDetailsPage({ record }) {
  if (!record) return null

  return (
    <div style={{
      maxWidth: 900,
      padding: '32px 24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: textPrimary,
    }}>
      {/* Header + Metadata inline */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{record.sid}</span>
          {record.recordKeyValue && (
            <span style={{ fontSize: 16, color: textSecondary }}>{record.recordKeyValue}</span>
          )}
          <StatusBadge label={record.statusLabel} color={record.statusColor} />
          {record.templateLabel && (
            <span style={{ fontSize: 13, color: textSecondary }}>{record.templateLabel}</span>
          )}
          <TimestampDisplay
            createdByName={record.createdByName}
            recordCreated={record.recordCreated}
            lastUpdate={record.lastUpdate}
            containerLabel={record.containerLabel}
            containerLevelLabel={record.containerLevelLabel}
            inline
          />
        </div>
      </div>

      {/* Field sections */}
      {record.fieldSections && record.fieldSections.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {record.fieldSections.map((sec, si) => (
            <FieldSection
              key={si}
              sectionLabel={sec.sectionLabel}
              fields={sec.fields}
              borderColor={borderPanel}
              subtleColor={textPrimary}
              sectionTextColor={bgPage}
              columns={3}
            />
          ))}
        </div>
      ) : (
        <div style={{ opacity: 0.4, fontStyle: 'italic', fontSize: 13 }}>No fields</div>
      )}
    </div>
  )
}
