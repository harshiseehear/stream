import { getAvailableFields, getPossibleValues, OPERATORS } from '../hooks/useFilteredRecords'

const MAX_VALUES = 100

export function buildSchema(records) {
  const fields = getAvailableFields(records)

  return {
    fields: fields.map(f => {
      const operators = (OPERATORS[f.category] || OPERATORS.text).map(op => op.key)
      const entry = { key: f.key, label: f.label, category: f.category, operators }

      if (f.category === 'selection' || f.category === 'text') {
        const values = getPossibleValues(records, f.key)
        entry.values = values.length > MAX_VALUES ? values.slice(0, MAX_VALUES) : values
      }

      return entry
    }),
  }
}
