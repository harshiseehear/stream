import { useParams, useOutletContext } from 'react-router-dom'
import RecordDetailsPage from '../components/RecordDetails/RecordDetailsPage'
import { textSecondary } from '../theme/colors'

export default function RecordPage() {
  const { sid } = useParams()
  const { records } = useOutletContext()

  if (records === null) {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" style={{ animation: 'orbit-spin 1.2s linear infinite' }}>
          <circle cx="16" cy="16" r="12" fill="none" stroke={textSecondary} strokeWidth="1.5" opacity="0.45" />
          <circle cx="16" cy="4" r="2.5" fill={textSecondary} />
        </svg>
        <style>{`@keyframes orbit-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const record = records.find(r => r.sid === sid)

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      padding: 12,
    }}>
      {/* Content area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
      }}>
        {record ? (
          <RecordDetailsPage record={record} />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            color: textSecondary,
            fontSize: 14,
          }}>
            Record "{sid}" not found
          </div>
        )}
      </div>
    </div>
  )
}
