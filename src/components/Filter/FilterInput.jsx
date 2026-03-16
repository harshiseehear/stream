import { borderPanel, textSecondary } from '../../theme/colors'

const baseStyle = {
  border: `1px solid ${borderPanel}`,
  borderRadius: 999,
  background: 'transparent',
  color: textSecondary,
  padding: '2px 8px',
  fontSize: 11,
  outline: 'none',
  fontFamily: 'system-ui, sans-serif',
  flex: 'none',
  minWidth: 60,
  maxWidth: 150,
}

export default function FilterInput({ value, onChange, placeholder, type = 'text' }) {
  const charWidth = Math.max((value || placeholder || '').length, 6)
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...baseStyle, width: `${charWidth + 2}ch` }}
    />
  )
}
