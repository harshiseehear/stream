import { borderPanel, textPrimary, textSecondary, bgPage } from '../theme/colors'

export default function ViewToggle({ view, onChange }) {
  return (
    <div style={{
      display: 'inline-flex',
      border: `1px solid ${borderPanel}`,
      borderRadius: 8,
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 12,
    }}>
      {['graph', 'table'].map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            padding: '5px 14px',
            border: 'none',
            background: view === v ? borderPanel : 'transparent',
            color: view === v ? textPrimary : textSecondary,
            fontWeight: view === v ? 600 : 400,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            textTransform: 'capitalize',
          }}
        >
          {v}
        </button>
      ))}
    </div>
  )
}
