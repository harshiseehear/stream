import { useMemo } from 'react'

const STATIC_FIELDS = ['sid', 'templateLabel', 'statusLabel', 'recordLabel', 'createdByName', 'containerLabel', 'recordKeyValue']
const MAX_RESULTS = 50
const SNIPPET_WINDOW = 60

function buildSnippet(value, terms) {
  const lower = value.toLowerCase()
  // Find the first matching term to center the snippet around
  let bestIdx = -1
  let bestTerm = terms[0]
  for (const t of terms) {
    const idx = lower.indexOf(t)
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
      bestIdx = idx
      bestTerm = t
    }
  }
  if (bestIdx === -1) return value.slice(0, SNIPPET_WINDOW)
  const half = Math.floor(SNIPPET_WINDOW / 2)
  const start = Math.max(0, bestIdx - half)
  const end = Math.min(value.length, bestIdx + bestTerm.length + half)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < value.length ? '…' : ''
  return prefix + value.slice(start, end) + suffix
}

function fieldContainsAny(str, terms) {
  const lower = str.toLowerCase()
  return terms.some(t => lower.includes(t))
}

export function useUniversalSearch(records, query) {
  return useMemo(() => {
    if (!records || !query || query.trim().length < 2) return []
    const terms = query.trim().toLowerCase().split(/\s+/).filter(t => t.length > 0)
    if (terms.length === 0) return []
    const results = []

    for (const record of records) {
      // Collect all searchable field strings for this record
      const allFields = []

      for (const key of STATIC_FIELDS) {
        const val = record[key]
        if (val == null || val === '') continue
        allFields.push({ field: key, str: String(val) })
      }

      if (record.fieldSections) {
        for (const section of record.fieldSections) {
          for (const f of section.fields) {
            if (f.value == null || f.value === '' || f.value === '[Canvas]') continue
            allFields.push({ field: f.name, str: String(f.value) })
          }
        }
      }

      // Check that every term matches at least one field
      const allTermsMatch = terms.every(t =>
        allFields.some(({ str }) => str.toLowerCase().includes(t))
      )
      if (!allTermsMatch) continue

      // Build match snippets from fields that contain any term
      const matches = []
      for (const { field, str } of allFields) {
        if (fieldContainsAny(str, terms)) {
          matches.push({ field, snippet: buildSnippet(str, terms) })
        }
      }

      if (matches.length > 0) {
        results.push({ record, matches })
        if (results.length >= MAX_RESULTS) break
      }
    }

    return results
  }, [records, query])
}
