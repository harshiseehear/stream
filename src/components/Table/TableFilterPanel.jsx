import { useState } from 'react'
import FilterPanel from '../Filter/FilterPanel'
import { bgPage, borderPanel, textSecondary } from '../../theme/colors'

export default function TableFilterPanel({ records, filterRules, onFilterChange, conjunctions, onConjunctionsChange }) {
  const [visible, setVisible] = useState(false)

  const filterPanel = FilterPanel({
    records,
    rules: filterRules,
    conjunctions,
    onConjunctionsChange,
    onChange: onFilterChange,
  })

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        onClick={() => setVisible(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '3px 5px',
          borderRadius: 6,
          color: textSecondary,
          opacity: visible ? 1 : 0.7,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => { if (!visible) e.currentTarget.style.opacity = '0.7' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={textSecondary} stroke="none">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>
      {visible && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 8,
          width: 260,
          background: bgPage,
          border: `1px solid ${borderPanel}`,
          borderRadius: 12,
          padding: '10px 10px 8px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: textSecondary }}>Filter</span>
            {filterPanel.addButton}
          </div>
          {filterPanel.body}
          {filterPanel.chatInput}
        </div>
      )}
    </div>
  )
}
