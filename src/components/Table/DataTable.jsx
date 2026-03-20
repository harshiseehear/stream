import { useMemo } from 'react'
import { textPrimary, textSecondary, borderPanel, dropdownHoverBg, bgPage } from '../../theme/colors'
import { formatDate } from '../../utils/formatDate'

const STATIC_COLUMNS = [
  { key: 'sid', label: 'SID' },
  { key: 'templateLabel', label: 'Template' },
  { key: 'statusLabel', label: 'Status' },
  { key: 'recordLabel', label: 'Record Label' },
  { key: 'createdByName', label: 'Created By' },
  { key: 'recordCreated', label: 'Date Created' },
  { key: 'lastUpdate', label: 'Last Updated' },
]

const TEMPLATE_STATIC_COLUMNS = [
  { key: 'sid', label: 'SID' },
  { key: 'statusLabel', label: 'Status' },
  { key: 'recordLabel', label: 'Record Label' },
]

const TEMPLATE_TAIL_COLUMNS = [
  { key: 'createdByName', label: 'Created By' },
  { key: 'recordCreated', label: 'Date Created' },
  { key: 'lastUpdate', label: 'Last Updated' },
]

function resolveValue(record, col) {
  if (col.dynamic) {
    for (const sec of record.fieldSections) {
      for (const f of sec.fields) {
        if (f.name === col.fieldName) return f.value ?? ''
      }
    }
    return ''
  }
  const val = record[col.key] ?? ''
  if (col.key === 'recordCreated' || col.key === 'lastUpdate') {
    return formatDate(String(val)) ?? val
  }
  return val
}

export default function DataTable({ records, selectedTemplate, onRowClick }) {
  const columns = useMemo(() => {
    if (!selectedTemplate) return STATIC_COLUMNS

    // Extract dynamic field columns from records of this template
    const fieldOrder = []
    const seen = new Set()
    for (const r of records) {
      for (const sec of r.fieldSections) {
        for (const f of sec.fields) {
          if (!seen.has(f.name)) {
            seen.add(f.name)
            fieldOrder.push({ key: `field::${f.name}`, label: f.name, dynamic: true, fieldName: f.name })
          }
        }
      }
    }

    return [...TEMPLATE_STATIC_COLUMNS, ...fieldOrder, ...TEMPLATE_TAIL_COLUMNS]
  }, [records, selectedTemplate])

  if (!records || records.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: textSecondary,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
      }}>
        No records
      </div>
    )
  }

  const cellStyle = {
    padding: '6px 10px',
    borderBottom: `1px solid ${borderPanel}`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 260,
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 0 }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
      }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{
                ...cellStyle,
                textAlign: 'left',
                fontWeight: 600,
                color: textSecondary,
                position: 'sticky',
                top: 0,
                background: bgPage,
                zIndex: 1,
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map(rec => (
            <tr
              key={rec.uuid}
              onClick={() => onRowClick?.(rec)}
              style={{ cursor: 'pointer', color: textPrimary }}
              onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map(col => (
                <td key={col.key} style={cellStyle}>
                  {resolveValue(rec, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
