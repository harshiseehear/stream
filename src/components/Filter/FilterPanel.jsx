import { useMemo, useState, useRef } from 'react'
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

export default function FilterPanel({ records, rules, conjunctions, onConjunctionsChange, onChange }) {
  const fields = useMemo(() => getAvailableFields(records), [records])
  const [chatValue, setChatValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const dragAllowed = useRef(null)

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
      onConjunctionsChange(result.conjunctions)
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

  const moveRule = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return
    const newRules = [...rules]
    const [moved] = newRules.splice(fromIdx, 1)
    newRules.splice(toIdx, 0, moved)
    const newConj = [...conjunctions]
    if (newConj.length > 0) {
      const [movedConj] = fromIdx < newConj.length
        ? newConj.splice(fromIdx, 1)
        : [newConj.pop()]
      const insertAt = Math.min(toIdx, newConj.length)
      newConj.splice(insertAt, 0, movedConj)
    }
    onChange(newRules)
    onConjunctionsChange(newConj)
  }

  const addRule = () => {
    onChange([...rules, { id: crypto.randomUUID(), field: '', operator: '', value: '' }])
    if (rules.length > 0) onConjunctionsChange([...conjunctions, 'and'])
  }

  const updateRule = (id, updated) => {
    onChange(rules.map(r => r.id === id ? updated : r))
  }

  const removeRule = (id) => {
    const idx = rules.findIndex(r => r.id === id)
    onChange(rules.filter(r => r.id !== id))
    if (idx >= 0) {
      const newConj = [...conjunctions]
      // Remove the conjunction associated with this gap
      if (idx < newConj.length) newConj.splice(idx, 1)
      else if (newConj.length > 0) newConj.splice(newConj.length - 1, 1)
      onConjunctionsChange(newConj)
    }
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
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'nlspin 1.2s linear infinite', verticalAlign: 'middle' }}>
              <circle cx="7" cy="7" r="5" fill="none" stroke={borderPanel} strokeWidth="1.2" opacity="0.45" />
              <circle cx="7" cy="2" r="1.5" fill={borderPanel} />
            </svg>
          ) : '↑'}
        </span>
        <style>{`@keyframes nlspin { to { transform: rotate(360deg) } }`}</style>
      </div>
      {error && <div style={{ color: '#e55', fontSize: 10, marginTop: 3, fontFamily: 'system-ui, sans-serif' }}>{error}</div>}
    </div>
  ), body: (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rules.map((rule, i) => (
        <div
          key={rule.id}
          draggable
          onDragStart={(e) => {
            if (dragAllowed.current !== i) { e.preventDefault(); return }
            setDragIdx(i)
            e.dataTransfer.effectAllowed = 'move'
            e.dataTransfer.setData('text/plain', '')
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            setOverIdx(i)
          }}
          onDragLeave={() => setOverIdx(null)}
          onDrop={(e) => {
            e.preventDefault()
            if (dragIdx !== null && dragIdx !== i) moveRule(dragIdx, i)
            setDragIdx(null)
            setOverIdx(null)
          }}
          onDragEnd={() => {
            setDragIdx(null)
            setOverIdx(null)
            dragAllowed.current = null
          }}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 4,
            opacity: dragIdx === i ? 0.4 : 1,
            borderTop: overIdx === i && dragIdx !== null && dragIdx !== i
              ? `2px solid ${borderPanel}`
              : '2px solid transparent',
            transition: 'opacity 0.15s',
            paddingTop: 2,
          }}
        >
          <span
            onMouseDown={() => { dragAllowed.current = i }}
            onMouseUp={() => { dragAllowed.current = null }}
            style={{
              cursor: 'grab',
              color: borderPanel,
              fontSize: 10,
              opacity: 0.4,
              userSelect: 'none',
              padding: '4px 2px',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >·</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <FilterRule
              rule={rule}
              fields={fields}
              records={records}
              onChange={(updated) => updateRule(rule.id, updated)}
              onRemove={() => removeRule(rule.id)}
              conjunction={i < rules.length - 1 ? (conjunctions[i] || 'and') : null}
              onConjunctionChange={(val) => {
                const newConj = [...conjunctions]
                newConj[i] = val
                onConjunctionsChange(newConj)
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )}
}
