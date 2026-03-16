import { buildSchema } from '../utils/filterSchema'

const API_URL = '/api/gemini'

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
- If a value doesn't exactly match a known value, pick the closest match from the known values list.
- If the query mentions a template name, always put the templateLabel rule FIRST in the rules array.

CONJUNCTION RULES (very important):
- Each rule (except the last) has a "conjunction" that connects it to the NEXT rule: "and" or "or".
- Default is "and". Use "or" when the query implies alternative/separate groups of conditions.
- Compound queries like "show me X by person AND ALSO Y" should be split into separate rule groups joined by "or":
  e.g. "projects by kelly and also objectives" →
    rule 1: template is Projects (conjunction: "and")
    rule 2: owner is Kelly ... (conjunction: "or")
    rule 3: template is 2026 Objectives
  Because rules evaluate left-to-right: (template=Projects AND owner=Kelly) OR (template=Objectives).
- "and also", "as well as", "plus", "along with" between different template/category types means an "or" group boundary.
- Conditions that further narrow the SAME group (e.g. "projects by kelly") use "and" between them.

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{
  "rules": [
    { "field": "<field key>", "operator": "<operator>", "value": "<value or array of values>", "conjunction": "and" | "or" }
  ]
}
The last rule should omit "conjunction" or set it to null.

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

      // Preserve per-rule conjunction
      rule._conjunction = rule.conjunction || 'and'

      return rule
    })
}

export async function translateQuery(query, records) {
  const schema = buildSchema(records)
  console.log('[nlFilter] schema fields:', schema.fields.length, 'query:', query)
  const prompt = buildPrompt(schema, query)

  const response = await fetch(API_URL, {
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
  console.log('[nlFilter] validated rules:', validatedRules.length)

  // Extract per-rule conjunctions from the validated rules
  // conjunctions[i] sits between rule i and rule i+1
  const builtRules = validatedRules.map(r => ({
    id: crypto.randomUUID(),
    field: r.field,
    operator: r.operator,
    value: r.value,
    _conjunction: r._conjunction,
  }))

  const conjunctions = builtRules.length > 1
    ? builtRules.slice(0, -1).map(r => r._conjunction || 'and')
    : []

  // Clean up internal property
  builtRules.forEach(r => delete r._conjunction)

  return {
    rules: builtRules,
    conjunctions,
  }
}
