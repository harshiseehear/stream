function FieldValue({ value, fieldType }) {
  if (value === null || value === undefined || value === '') {
    return <span style={{ opacity: 0.3, fontStyle: 'italic' }}>—</span>
  }

  const ft = (fieldType || '').toUpperCase()

  if (ft === 'TASK') {
    return <span style={{ fontWeight: 600, opacity: 0.7 }}>{value}</span>
  }

  if (ft === 'IMAGE' || ft === 'CANVAS') {
    return <span style={{ opacity: 0.4, fontStyle: 'italic' }}>{value}</span>
  }

  if (ft === 'RICH_TEXT') {
    return <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{value}</span>
  }

  if (ft === 'NUMBER' || ft === 'DATE' || ft === 'DATETIME') {
    return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
  }

  if (ft === 'SC_RECORD' || ft === 'SM_RECORD') {
    return <span style={{ fontWeight: 500 }}>{value}</span>
  }

  return <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{value}</span>
}

export default function FieldSection({ sectionLabel, fields, borderColor, subtleColor, sectionTextColor, columns = 1 }) {
  const cols = Math.max(1, columns)
  const rows = []
  for (let i = 0; i < fields.length; i += cols) {
    rows.push(fields.slice(i, i + cols))
  }
  const labelWidth = cols > 1 ? `${Math.round(35 / cols)}%` : '40%'

  return (
    <div style={{ margin: 0, minWidth: 0 }}>
      {sectionLabel && (
        <div style={{
          background: subtleColor || 'rgba(0,0,0,0.75)',
          color: sectionTextColor || '#fff',
          padding: '5px 12px',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.2,
        }}>{sectionLabel}</div>
      )}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 12,
        tableLayout: 'fixed',
      }}>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                borderBottom: `1px solid ${borderColor || 'rgba(0,0,0,0.08)'}`,
              }}
            >
              {Array.from({ length: cols }, (_, ci) => {
                const f = row[ci]
                return f ? (
                  <td key={`l${ci}`} style={{
                    padding: '5px 12px',
                    fontWeight: 600,
                    wordBreak: 'break-word',
                    width: labelWidth,
                    verticalAlign: 'top',
                    opacity: 0.7,
                    borderLeft: ci > 0 ? `1px solid ${borderColor || 'rgba(0,0,0,0.08)'}` : undefined,
                  }}>
                    {f.name}
                  </td>
                ) : (
                  <td key={`l${ci}`} style={{ width: labelWidth, borderLeft: ci > 0 ? `1px solid ${borderColor || 'rgba(0,0,0,0.08)'}` : undefined }} />
                )
              }).reduce((acc, label, ci) => {
                const f = row[ci]
                acc.push(label)
                acc.push(
                  f ? (
                    <td key={`v${ci}`} style={{ padding: '5px 12px', verticalAlign: 'top' }}>
                      <FieldValue value={f.value} fieldType={f.fieldType} />
                    </td>
                  ) : (
                    <td key={`v${ci}`} />
                  )
                )
                return acc
              }, [])}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
