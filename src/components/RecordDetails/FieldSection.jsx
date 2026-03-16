export default function FieldSection({ sectionLabel, fields, borderColor, subtleColor }) {
  return (
    <div>
      {sectionLabel && (
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: subtleColor || undefined,
          opacity: subtleColor ? 1 : 0.45,
          marginBottom: 3,
        }}>{sectionLabel}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {fields.map((f, fi) => (
          <div key={fi} style={{ display: 'flex', gap: 6 }}>
            <span style={{ opacity: 0.55, flexShrink: 0, width: 100, textAlign: 'left' }}>{f.name}:</span>
            <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
