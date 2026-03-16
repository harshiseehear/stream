import { useRef } from 'react'
import { borderPanel, textSecondary, textPlaceholder } from '../../theme/colors'

export default function FilterDropdown({ value, onChange, options, placeholder }) {
  const selectRef = useRef(null)
  const selected = options.find(o => (o.value ?? o) === value)
  const label = selected ? (selected.label ?? selected) : (placeholder || 'Select...')

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        onClick={() => selectRef.current?.showPicker?.() || selectRef.current?.click()}
        style={{
          border: `1px solid ${borderPanel}`,
          borderRadius: 999,
          background: 'transparent',
          color: value ? textSecondary : textPlaceholder,
          padding: '2px 8px',
          fontSize: 11,
          fontFamily: 'system-ui, sans-serif',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 150,
          lineHeight: 1.3,
        }}
      >
        {label}
      </button>
      <select
        ref={selectRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: 'pointer',
          fontSize: 11,
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  )
}
