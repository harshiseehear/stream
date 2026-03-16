import { textSecondary, statusBadgeFallbackBg, statusBadgeFallbackBorder } from '../../theme/colors'

export default function StatusBadge({ label, color }) {
  if (!label) return null
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: 10,
      fontSize: 10,
      fontWeight: 600,
      background: color ? `${color}22` : statusBadgeFallbackBg,
      color: color || textSecondary,
      border: `1px solid ${color ? `${color}44` : statusBadgeFallbackBorder}`,
    }}>{label}</span>
  )
}
