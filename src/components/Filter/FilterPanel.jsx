import { useMemo, useState } from 'react'
import FilterRule from './FilterRule'
import { getAvailableFields } from '../../hooks/useFilteredRecords'
import { borderPanel, textSecondary } from '../../theme/colors'
import { translateQuery } from '../../services/nlFilter'

const addBtnStyle = {
  border: 'none',
  background: 'none',
  color: borderPanel,
  padding: 0,
  fontSize: 18,
  fontFamily: 'system-ui, sans-serif',
  cursor: 'pointer',
  lineHeight: 1,
}

const chatWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  border: `1px solid ${borderPanel}`,
  borderRadius: 12,
  padding: '2px 7px 2px 10px',
  boxSizing: 'border-box',
}

const chatInputStyle = {
  flex: 1,
  minWidth: 0,
  border: 'none',
  padding: '2px 0',
  fontSize: 11,
  fontFamily: 'system-ui, sans-serif',
  color: textSecondary,
  background: 'transparent',
  outline: 'none',
  lineHeight: 1.4,
}

export default function FilterPanel({ records, rules, conjunction, onConjunctionChange, onChange }) {
  const fields = useMemo(() => getAvailableFields(records), [records])
  const [chatValue, setChatValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNlSubmit = async () => {
    const query = chatValue.trim()
    if (!query || loading) return
    setLoading(true)
    setError('')
    console.log('[FilterPanel] submitting NL query:', query)
    try {
      const result = await translateQuery(query, records)
      console.log('[FilterPanel] got rules:', result.rules.length, 'conjunction:', result.conjunction)
      onChange(result.rules)
      onConjunctionChange(result.conjunction)
      setChatValue('')
    } catch (e) {
      console.error('[FilterPanel] NL filter error:', e)
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNlSubmit()
    }
  }

  const addRule = () => {
    onChange([...rules, { id: crypto.randomUUID(), field: '', operator: '', value: '' }])
  }

  const updateRule = (id, updated) => {
    onChange(rules.map(r => r.id === id ? updated : r))
  }

  const removeRule = (id) => {
    onChange(rules.filter(r => r.id !== id))
  }

  return { addButton: <button onClick={addRule} style={addBtnStyle}>+</button>, chatInput: (
    <div>
      <div style={chatWrapperStyle}>
        <input
          type="text"
          value={chatValue}
          onChange={e => setChatValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Thinking…' : ''}
          disabled={loading}
          style={{ ...chatInputStyle, opacity: loading ? 0.5 : 1 }}
        />
        <span
          onClick={handleNlSubmit}
          style={{ color: borderPanel, fontSize: 14, lineHeight: 1, cursor: loading ? 'default' : 'pointer', flexShrink: 0 }}
        >
          {loading ? (
            <span style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              border: `1.5px solid ${borderPanel}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'nlspin 0.7s linear infinite',
              verticalAlign: 'middle',
            }} />
          ) : '↑'}
        </span>
        <style>{`@keyframes nlspin { to { transform: rotate(360deg) } }`}</style>
      </div>
      {error && <div style={{ color: '#e55', fontSize: 10, marginTop: 3, fontFamily: 'system-ui, sans-serif' }}>{error}</div>}
    </div>
  ), body: (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rules.map((rule, i) => (
        <FilterRule
          key={rule.id}
          rule={rule}
          fields={fields}
          records={records}
          onChange={(updated) => updateRule(rule.id, updated)}
          onRemove={() => removeRule(rule.id)}
          conjunction={i < rules.length - 1 ? conjunction : null}
          onConjunctionChange={onConjunctionChange}
        />
      ))}
    </div>
  )}
}
