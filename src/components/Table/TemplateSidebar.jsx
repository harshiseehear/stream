import { useMemo } from 'react'
import { textPrimary, textSecondary, dropdownHoverBg } from '../../theme/colors'

export default function TemplateSidebar({ records, selected, onSelect, onAdd }) {
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
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
    color: active ? textPrimary : textSecondary,
    fontWeight: active ? 600 : 400,
    borderRadius: 6,
    background: active ? dropdownHoverBg : 'transparent',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  })

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}>
      <div
        onClick={() => onSelect(null)}
        style={itemStyle(selected === null)}
      >
        All Records
      </div>
      {templates.map(t => (
        <div
          key={t.template}
          onClick={() => onSelect(t.template)}
          style={{ ...itemStyle(selected === t.template), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span>
          {onAdd && (
            <svg
              onClick={e => { e.stopPropagation(); onAdd(t.template, t.label) }}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, cursor: 'pointer', opacity: 0.4, marginLeft: 4 }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}
