import { useMemo, useState, useRef, useEffect } from 'react'
import FilterDropdown from './FilterDropdown'
import FilterInput from './FilterInput'
import {
  getFieldMeta,
  getOperators,
  getPossibleValues,
  needsValueInput,
  isMultiValueOperator,
  isDropdownOperator,
} from '../../hooks/useFilteredRecords'
import { borderPanel, textSecondary, controlActiveBackground, dropdownBg, dropdownBorder, dropdownShadow, dropdownHoverBg, dropdownText } from '../../theme/colors'

const rowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 6,
  flexWrap: 'wrap',
}

const removeBtnStyle = {
  background: 'none',
  border: `1px solid ${borderPanel}`,
  borderRadius: '50%',
  color: borderPanel,
  cursor: 'pointer',
  fontSize: 11,
  width: 20,
  height: 20,
  padding: 0,
  lineHeight: 1,
  opacity: 0.6,
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export default function FilterRule({ rule, fields, records, onChange, onRemove, conjunction, onConjunctionChange }) {
  const fieldMeta = getFieldMeta(fields, rule.field)
  const category = fieldMeta?.category || 'text'
  const operators = getOperators(category)
  const showValue = needsValueInput(rule.operator)
  const isMulti = isMultiValueOperator(rule.operator)
  const isDropdown = isDropdownOperator(rule.operator, category)

  const possibleValues = useMemo(() => {
    if (!isDropdown || !rule.field) return []
    return getPossibleValues(records, rule.field)
  }, [records, rule.field, isDropdown])

  const fieldOptions = useMemo(() =>
    fields.map(f => ({ value: f.key, label: f.label })),
    [fields]
  )

  const operatorOptions = useMemo(() =>
    operators.map(o => ({ value: o.key, label: o.label })),
    [operators]
  )

  const onFieldChange = (val) => {
    onChange({ ...rule, field: val, operator: '', value: '' })
  }

  const onOperatorChange = (val) => {
    const newIsMulti = isMultiValueOperator(val)
    onChange({ ...rule, operator: val, value: newIsMulti ? [] : '' })
  }

  const onValueChange = (val) => {
    onChange({ ...rule, value: val })
  }

  const onMultiToggle = (val) => {
    const arr = Array.isArray(rule.value) ? rule.value : []
    const next = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
    onChange({ ...rule, value: next })
  }

  return (
    <div style={rowStyle}>
      <FilterDropdown
        value={rule.field}
        onChange={onFieldChange}
        options={fieldOptions}
        placeholder="Field"
      />

      {rule.field && (
        <FilterDropdown
          value={rule.operator}
          onChange={onOperatorChange}
          options={operatorOptions}
          placeholder="Operator"
        />
      )}

      {rule.field && rule.operator && showValue && (
        isDropdown ? (
          isMulti ? (
            <MultiSelect
              values={Array.isArray(rule.value) ? rule.value : []}
              options={possibleValues}
              onToggle={onMultiToggle}
            />
          ) : (
            <FilterDropdown
              value={rule.value}
              onChange={onValueChange}
              options={possibleValues.map(v => ({ value: v, label: v }))}
              placeholder="Value"
            />
          )
        ) : (
          <FilterInput
            value={rule.value}
            onChange={onValueChange}
            placeholder="Value"
            type={category === 'number' ? 'number' : 'text'}
          />
        )
      )}

      <button onClick={onRemove} style={removeBtnStyle} title="Remove rule">{"\u2715"}</button>

      {conjunction !== null && conjunction !== undefined && (
        <>
          <ConjunctionCircle label="&" active={conjunction === 'and'} onClick={() => onConjunctionChange('and')} />
          <ConjunctionCircle label="or" active={conjunction === 'or'} onClick={() => onConjunctionChange('or')} />
        </>
      )}
    </div>
  )
}

function ConjunctionCircle({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${borderPanel}`,
        borderRadius: '50%',
        background: active ? controlActiveBackground : 'transparent',
        color: borderPanel,
        width: 20,
        height: 20,
        padding: 0,
        fontSize: 9,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: active ? 700 : 400,
        cursor: 'pointer',
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        opacity: active ? 1 : 0.5,
      }}
      title={label === '&' ? 'AND' : 'OR'}
    >
      {label}
    </button>
  )
}

function MultiSelect({ values, options, onToggle }) {
  const available = options.filter(opt => !values.includes(opt))
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minWidth: 0, alignItems: 'center' }}>
      {values.map(val => (
        <span
          key={val}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            border: `1px solid ${borderPanel}`,
            borderRadius: 999,
            background: controlActiveBackground,
            color: textSecondary,
            fontSize: 11,
            padding: '2px 8px',
            fontFamily: 'system-ui, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          {val}
          <button
            onClick={() => onToggle(val)}
            style={{
              background: 'none',
              border: 'none',
              color: borderPanel,
              cursor: 'pointer',
              fontSize: 10,
              padding: 0,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Remove"
          >
            ✕
          </button>
        </span>
      ))}
      {available.length > 0 && (
        <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              border: `1px solid ${borderPanel}`,
              borderRadius: '50%',
              background: 'transparent',
              color: borderPanel,
              width: 20,
              height: 20,
              padding: 0,
              fontSize: 13,
              fontFamily: 'system-ui, sans-serif',
              cursor: 'pointer',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
          {open && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: dropdownBg,
              border: `1px solid ${dropdownBorder}`,
              borderRadius: 6,
              padding: 4,
              zIndex: 100,
              maxHeight: 150,
              overflowY: 'auto',
              minWidth: 120,
              boxShadow: dropdownShadow,
            }}>
              {available.map(opt => (
                <div
                  key={opt}
                  onClick={() => { onToggle(opt); setOpen(false) }}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    fontFamily: 'system-ui, sans-serif',
                    color: dropdownText,
                    cursor: 'pointer',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = dropdownHoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
