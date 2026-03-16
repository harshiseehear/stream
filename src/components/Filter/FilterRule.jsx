import { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react'
import FilterDropdown from './FilterDropdown'
import FilterInput from './FilterInput'
import DatePicker from './DatePicker'
import {
  getFieldMeta,
  getOperators,
  getPossibleValues,
  needsValueInput,
  isMultiValueOperator,
  isDropdownOperator,
} from '../../hooks/useFilteredRecords'
import { bgPage, borderPanel, textSecondary, controlActiveBackground, dropdownHoverBg, dropdownText } from '../../theme/colors'

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
        ) : category === 'date' ? (
          <DatePicker
            value={rule.value}
            onChange={onValueChange}
            placeholder="Date"
          />
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
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)
  const dropRef = useRef(null)

  const filtered = useMemo(() => {
    if (!search) return available
    const q = search.toLowerCase()
    return available.filter(opt => opt.toString().toLowerCase().includes(q))
  }, [available, search])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open || !dropRef.current || !ref.current) return
    const triggerRect = ref.current.getBoundingClientRect()
    const el = dropRef.current
    let top = triggerRect.bottom + 4
    let left = triggerRect.left
    if (top + el.offsetHeight > window.innerHeight - 8) {
      top = Math.max(8, triggerRect.top - el.offsetHeight - 4)
    }
    if (left + el.offsetWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - el.offsetWidth - 8)
    }
    el.style.top = top + 'px'
    el.style.left = left + 'px'
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
            <div ref={dropRef} style={{
              position: 'fixed',
              background: bgPage,
              border: `1px solid ${borderPanel}`,
              borderRadius: 10,
              padding: 6,
              zIndex: 9999,
              maxHeight: 220,
              minWidth: 160,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder=""
                style={{
                  border: `1px solid ${borderPanel}`,
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontFamily: 'system-ui, sans-serif',
                  outline: 'none',
                  marginBottom: 4,
                  background: 'transparent',
                  color: dropdownText,
                }}
              />
              <div style={{ overflowY: 'auto', maxHeight: 160 }}>
                {filtered.map(opt => (
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
                {filtered.length === 0 && (
                  <div style={{ padding: '4px 8px', fontSize: 11, color: textSecondary, fontFamily: 'system-ui, sans-serif' }}>
                    No matches
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
