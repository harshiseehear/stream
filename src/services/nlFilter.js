import { buildSchema } from '../utils/filterSchema'

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

function buildPrompt(schema, query) {
  return `You are a filter assistant. Given a natural language query, produce structured filter rules that match the available fields and values exactly.

AVAILABLE FIELDS:
${JSON.stringify(schema.fields, null, 2)}

RULES:
- Only use field keys, operators, and values from the schema above.
- Match user names fuzzily to known values (first name, last name, partial match). Always output the full matching value from the schema.
- "someone's X" implies the Owner field (not Created By) unless "created by" is explicitly stated.
- Status synonyms: "complete/completed/done/finished" → "Done", "in progress/active/ongoing" → "In Progress", "open/new/todo" → "Open".
- When multiple people or values are named for the same field, use the "is_any_of" operator with an array value.
- For single value selection fields, use "is" operator.
- Default conjunction is "and". Use "or" only when the query explicitly says "or".
- If a value doesn't exactly match a known value, pick the closest match from the known values list.
- If the query mentions a template name, always put the templateLabel rule FIRST in the rules array.

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{
  "rules": [
    { "field": "<field key>", "operator": "<operator>", "value": "<value or array of values>" }
  ],
  "conjunction": "and" | "or"
}

USER QUERY: ${query}`
}

function fuzzyMatch(target, candidates) {
  const lower = target.toLowerCase()
  const exact = candidates.find(c => c.toLowerCase() === lower)
  if (exact) return exact
  const starts = candidates.find(c => c.toLowerCase().startsWith(lower))
  if (starts) return starts
  const includes = candidates.find(c => c.toLowerCase().includes(lower))
  if (includes) return includes
  return target
}

function validateRules(rules, schema) {
  const fieldMap = new Map(schema.fields.map(f => [f.key, f]))

  return rules
    .filter(rule => fieldMap.has(rule.field))
    .map(rule => {
      const fieldDef = fieldMap.get(rule.field)
      if (!fieldDef.operators.includes(rule.operator)) {
        rule.operator = fieldDef.operators[0]
      }

      if (fieldDef.values && fieldDef.values.length > 0) {
        if (Array.isArray(rule.value)) {
          rule.value = rule.value.map(v => fuzzyMatch(v, fieldDef.values))
        } else if (typeof rule.value === 'string') {
          rule.value = fuzzyMatch(rule.value, fieldDef.values)
        }
      }

      return rule
    })
}

export async function translateQuery(query, records) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  const schema = buildSchema(records)
  console.log('[nlFilter] schema fields:', schema.fields.length, 'query:', query)
  const prompt = buildPrompt(schema, query)

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error: ${response.status} ${err}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')

  console.log('[nlFilter] raw response:', text)
  const parsed = JSON.parse(text)
  const validatedRules = validateRules(parsed.rules || [], schema)
  validatedRules.sort((a, b) => (a.field === 'templateLabel' ? -1 : b.field === 'templateLabel' ? 1 : 0))
  console.log('[nlFilter] validated rules:', validatedRules.length)
  const conjunction = parsed.conjunction === 'or' ? 'or' : 'and'

  return {
    rules: validatedRules.map(r => ({
      id: crypto.randomUUID(),
      field: r.field,
      operator: r.operator,
      value: r.value,
    })),
    conjunction,
  }
}
