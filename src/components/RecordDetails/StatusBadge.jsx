export default function StatusBadge({ label, color }) {
  if (!label) return null
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: 10,
      fontSize: 10,
      fontWeight: 600,
      background: color ? `${color}22` : 'rgba(160,133,110,0.12)',
      color: color || '#7a6a5a',
      border: `1px solid ${color ? `${color}44` : 'rgba(160,133,110,0.2)'}`,
    }}>{label}</span>
  )
}
