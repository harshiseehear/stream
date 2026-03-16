import { useMemo } from 'react'
import FilterRule from './FilterRule'
import { getAvailableFields } from '../../hooks/useFilteredRecords'
import { borderPanel } from '../../theme/colors'

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

export default function FilterPanel({ records, rules, conjunction, onConjunctionChange, onChange }) {
  const fields = useMemo(() => getAvailableFields(records), [records])

  const addRule = () => {
    onChange([...rules, { id: crypto.randomUUID(), field: '', operator: '', value: '' }])
  }

  const updateRule = (id, updated) => {
    onChange(rules.map(r => r.id === id ? updated : r))
  }

  const removeRule = (id) => {
    onChange(rules.filter(r => r.id !== id))
  }

  return { addButton: <button onClick={addRule} style={addBtnStyle}>+</button>, body: (
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
