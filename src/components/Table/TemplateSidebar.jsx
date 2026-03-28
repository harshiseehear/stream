import { useState, useMemo } from 'react'
import { textPrimary, textSecondary, dropdownHoverBg } from '../../theme/colors'

export default function TemplateSidebar({ records, selected, onSelect, contentMode, onContentMode }) {
  const [recordsOpen, setRecordsOpen] = useState(true)

  const templates = useMemo(() => {
    if (!records || records.length === 0) return []
    const map = new Map()
    for (const r of records) {
      if (r.templateLabel && !map.has(r.templateLabel)) {
        map.set(r.templateLabel, { label: r.templateLabel, template: r.template })
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [records])

  const itemStyle = (active) => ({
    padding: '5px 12px',
    paddingLeft: 24,
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    color: active ? textPrimary : textSecondary,
    fontWeight: 400,
    borderRadius: 6,
    background: active ? dropdownHoverBg : 'transparent',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
  })

  const sectionStyle = (active) => ({
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 600,
    letterSpacing: 0.3,
    textTransform: 'capitalize',
    color: active ? textPrimary : textSecondary,
    borderRadius: 6,
    background: active ? dropdownHoverBg : 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    userSelect: 'none',
  })

  const chevron = (open) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Templates section */}
      <div
        onClick={() => onContentMode('templates')}
        style={sectionStyle(contentMode === 'templates')}
        onMouseEnter={e => { if (contentMode !== 'templates') e.currentTarget.style.background = dropdownHoverBg }}
        onMouseLeave={e => { if (contentMode !== 'templates') e.currentTarget.style.background = 'transparent' }}
      >
        Templates
      </div>

      {/* Workflows section */}
      <div
        onClick={() => onContentMode('workflows')}
        style={sectionStyle(contentMode === 'workflows')}
        onMouseEnter={e => { if (contentMode !== 'workflows') e.currentTarget.style.background = dropdownHoverBg }}
        onMouseLeave={e => { if (contentMode !== 'workflows') e.currentTarget.style.background = 'transparent' }}
      >
        Workflows
      </div>

      {/* Records section */}
      <div
        onClick={() => { setRecordsOpen(o => !o); if (contentMode !== 'records') onContentMode('records') }}
        style={{ ...sectionStyle(contentMode === 'records'), justifyContent: 'space-between' }}
        onMouseEnter={e => { if (contentMode !== 'records') e.currentTarget.style.background = dropdownHoverBg }}
        onMouseLeave={e => { if (contentMode !== 'records') e.currentTarget.style.background = 'transparent' }}
      >
        Records
        {chevron(recordsOpen)}
      </div>

      {recordsOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div
            onClick={() => onSelect(null)}
            style={itemStyle(selected === null)}
            onMouseEnter={e => { if (selected !== null) e.currentTarget.style.background = dropdownHoverBg }}
            onMouseLeave={e => { if (selected !== null) e.currentTarget.style.background = 'transparent' }}
          >
            All Records
          </div>
          {templates.map(t => (
            <div
              key={t.template}
              onClick={() => onSelect(t.template)}
              style={itemStyle(selected === t.template)}
              onMouseEnter={e => { if (selected !== t.template) e.currentTarget.style.background = dropdownHoverBg }}
              onMouseLeave={e => { if (selected !== t.template) e.currentTarget.style.background = 'transparent' }}
            >
              {t.label}
            </div>
          ))}
        </div>
      )}

      {/* Permissions section */}
      <div
        onClick={() => onContentMode('permissions')}
        style={sectionStyle(contentMode === 'permissions')}
        onMouseEnter={e => { if (contentMode !== 'permissions') e.currentTarget.style.background = dropdownHoverBg }}
        onMouseLeave={e => { if (contentMode !== 'permissions') e.currentTarget.style.background = 'transparent' }}
      >
        Permissions
      </div>
    </div>
  )
}
