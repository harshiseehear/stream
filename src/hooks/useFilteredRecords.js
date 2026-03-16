import { useMemo } from 'react'

const STATIC_TOP_FIELDS = [
  { key: 'templateLabel', label: 'Template', category: 'selection' },
  { key: 'statusLabel', label: 'Status', category: 'selection' },
  { key: 'recordLabel', label: 'Record Label', category: 'text' },
  { key: 'sid', label: 'SID', category: 'text' },
]

const STATIC_BOTTOM_FIELDS = [
  { key: 'createdByName', label: 'Created By', category: 'selection' },
  { key: 'recordCreated', label: 'Date Created', category: 'date' },
  { key: 'lastUpdate', label: 'Last Updated', category: 'date' },
]

function isUserFieldType(fieldType) {
  const ft = (fieldType || '').toUpperCase()
  return ft === 'USER' || ft === 'USERS' || ft === 'ACTOR'
}

function fieldTypeToCategory(fieldType) {
  const ft = (fieldType || '').toUpperCase()
  if (ft === 'NUMBER' || ft === 'DECIMAL' || ft === 'CURRENCY' || ft === 'PERCENT') return 'number'
  if (ft === 'DATE' || ft === 'DATETIME' || ft === 'TIME') return 'date'
  if (ft === 'SELECTION' || ft === 'DROPDOWN' || ft === 'SELECT') return 'selection'
  if (isUserFieldType(fieldType)) return 'selection'
  if (ft === 'BOOLEAN' || ft === 'CHECKBOX') return 'selection'
  return 'text'
}

function getTopLevelFields(records) {
  const containerLevelLabel = records?.find(r => r.containerLevelLabel)?.containerLevelLabel || 'Container'
  return [
    ...STATIC_TOP_FIELDS,
    { key: 'containerLabel', label: containerLevelLabel, category: 'selection' },
    ...STATIC_BOTTOM_FIELDS,
  ]
}

export function getAvailableFields(records) {
  const topLevel = getTopLevelFields(records)
  if (!records || records.length === 0) return topLevel

  const dynamicFieldMap = new Map()
  for (const rec of records) {
    for (const sec of rec.fieldSections) {
      for (const f of sec.fields) {
        if (!dynamicFieldMap.has(f.name)) {
          dynamicFieldMap.set(f.name, {
            key: `field::${f.name}`,
            label: f.name,
            category: fieldTypeToCategory(f.fieldType),
            fieldType: f.fieldType,
          })
        }
      }
    }
  }

  return [...topLevel, ...dynamicFieldMap.values()]
}

export function getFieldMeta(fields, fieldKey) {
  return fields.find(f => f.key === fieldKey) || null
}

function resolveFieldValue(record, fieldKey) {
  if (!fieldKey) return ''
  if (fieldKey.startsWith('field::')) {
    const name = fieldKey.slice(7)
    for (const sec of record.fieldSections) {
      for (const f of sec.fields) {
        if (f.name === name) return f.value ?? ''
      }
    }
    return ''
  }
  return record[fieldKey] ?? ''
}

function detectUserField(records, fieldKey) {
  if (!fieldKey.startsWith('field::')) return false
  const name = fieldKey.slice(7)
  for (const rec of records) {
    for (const sec of rec.fieldSections) {
      for (const f of sec.fields) {
        if (f.name === name) return isUserFieldType(f.fieldType)
      }
    }
  }
  return false
}

export function getPossibleValues(records, fieldKey) {
  if (!records || !fieldKey) return []
  const isUser = detectUserField(records, fieldKey)
  const values = new Set()
  for (const rec of records) {
    const val = resolveFieldValue(rec, fieldKey)
    if (val !== '' && val !== null && val !== undefined) {
      const strVal = String(val)
      if (isUser && strVal.includes(', ')) {
        strVal.split(', ').forEach(v => { if (v.trim()) values.add(v.trim()) })
      } else {
        values.add(strVal)
      }
    }
  }
  return [...values].sort()
}

export const OPERATORS = {
  text: [
    { key: 'equals', label: 'equals' },
    { key: 'does_not_equal', label: 'does not equal' },
    { key: 'contains', label: 'contains' },
    { key: 'does_not_contain', label: 'does not contain' },
    { key: 'starts_with', label: 'starts with' },
    { key: 'ends_with', label: 'ends with' },
    { key: 'is_empty', label: 'is empty' },
    { key: 'is_not_empty', label: 'is not empty' },
  ],
  selection: [
    { key: 'is', label: 'is' },
    { key: 'is_not', label: 'is not' },
    { key: 'is_any_of', label: 'is any of' },
    { key: 'is_none_of', label: 'is none of' },
    { key: 'is_empty', label: 'is empty' },
    { key: 'is_not_empty', label: 'is not empty' },
  ],
  date: [
    { key: 'is', label: 'is' },
    { key: 'is_before', label: 'is before' },
    { key: 'is_after', label: 'is after' },
    { key: 'is_empty', label: 'is empty' },
    { key: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { key: 'equals', label: 'equals' },
    { key: 'does_not_equal', label: 'does not equal' },
    { key: 'greater_than', label: 'greater than' },
    { key: 'less_than', label: 'less than' },
    { key: 'is_empty', label: 'is empty' },
    { key: 'is_not_empty', label: 'is not empty' },
  ],
}

export function getOperators(category) {
  return OPERATORS[category] || OPERATORS.text
}

export function needsValueInput(operator) {
  return operator && operator !== 'is_empty' && operator !== 'is_not_empty'
}

export function isMultiValueOperator(operator) {
  return operator === 'is_any_of' || operator === 'is_none_of'
}

export function isDropdownOperator(operator, category) {
  if (category === 'selection') {
    return operator === 'is' || operator === 'is_not' || operator === 'is_any_of' || operator === 'is_none_of'
  }
  return false
}

function matchesRule(record, rule) {
  const val = String(resolveFieldValue(record, rule.field)).toLowerCase()
  const target = String(rule.value ?? '').toLowerCase()

  switch (rule.operator) {
    case 'equals':
    case 'is': {
      if (val === target) return true
      if (val.includes(', ')) return val.split(', ').some(p => p.trim().toLowerCase() === target)
      return false
    }
    case 'does_not_equal':
    case 'is_not': {
      if (val.includes(', ')) return !val.split(', ').some(p => p.trim().toLowerCase() === target)
      return val !== target
    }
    case 'contains':
      return val.includes(target)
    case 'does_not_contain':
      return !val.includes(target)
    case 'starts_with':
      return val.startsWith(target)
    case 'ends_with':
      return val.endsWith(target)
    case 'is_empty':
      return !val || val.trim() === ''
    case 'is_not_empty':
      return val.trim() !== ''
    case 'is_any_of': {
      const arr = Array.isArray(rule.value) ? rule.value : []
      const parts = val.includes(', ') ? val.split(', ').map(p => p.trim().toLowerCase()) : [val]
      return arr.some(v => {
        const t = String(v).toLowerCase()
        return parts.some(p => p === t)
      })
    }
    case 'is_none_of': {
      const arr = Array.isArray(rule.value) ? rule.value : []
      const parts = val.includes(', ') ? val.split(', ').map(p => p.trim().toLowerCase()) : [val]
      return !arr.some(v => {
        const t = String(v).toLowerCase()
        return parts.some(p => p === t)
      })
    }
    case 'greater_than':
      return parseFloat(val) > parseFloat(target)
    case 'less_than':
      return parseFloat(val) < parseFloat(target)
    case 'is_before':
      return val < target
    case 'is_after':
      return val > target
    default:
      return true
  }
}

export function useFilteredRecords(records, rules, conjunction = 'and') {
  return useMemo(() => {
    if (!records || rules.length === 0) return records
    const activeRules = rules.filter(r => r.field && r.operator && (
      !needsValueInput(r.operator) ||
      (Array.isArray(r.value) ? r.value.length > 0 : r.value !== '')
    ))
    if (activeRules.length === 0) return records
    if (conjunction === 'or') {
      return records.filter(record => activeRules.some(rule => matchesRule(record, rule)))
    }
    return records.filter(record => activeRules.every(rule => matchesRule(record, rule)))
  }, [records, rules, conjunction])
}
