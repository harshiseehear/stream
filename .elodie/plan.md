# Filter System — Implementation Plan

## Overview

Add a client-side filter panel to the Home page that lets users build filter rules against record fields. Filtered records are passed into `usePhysics` so only matching nodes appear on the graph.

Visual style: simple rounded container, no fill, brown 1px border — matching the existing beige/brown aesthetic.

---

## Data Model Observations

Each record from `useRecords()` has:

```
{
  sid, uuid, template, templateLabel,
  fieldSections: [{ sectionLabel, fields: [{ name, value, fieldType }] }],
  recordLabel, statusLabel, statusColor,
  recordCreated, lastUpdate, createdByName
}
```

**Available field types** (from `formatFieldValue` + definition processing):
- Text/string fields (default)
- Number fields
- Date fields (formatted by `formatDate`)
- User reference fields (array of user IDs → resolved names)
- Selection/dropdown fields (`{ sel, selText }`)
- Rich text fields (JSON with `versions`/`type`)
- Task fields (`taskRowDone` array)
- Record reference fields (`recordSID` array)
- Boolean fields
- Image/Canvas fields (display as `[Canvas]`)

**Top-level filterable properties** (always present on every record):
| Property | Type | Notes |
|---|---|---|
| `templateLabel` | string | Which template the record belongs to |
| `statusLabel` | string | Current status text |
| `statusColor` | string/null | Status color hex |
| `recordLabel` | string | Record display name |
| `sid` | string | Serial ID like `CODE-001` |
| `createdByName` | string | Creator's full name |
| `recordCreated` | string | ISO timestamp |
| `lastUpdate` | string | ISO timestamp |

**Dynamic fields** (vary per template): every `{ name, value, fieldType }` inside `fieldSections`.

---

## Filter Rule Structure

```js
{
  id: crypto.randomUUID(),
  field: '',        // e.g. "templateLabel" | "statusLabel" | "field::Priority"
  operator: '',     // e.g. "equals" | "contains" | "is_any_of" etc.
  value: '',        // string input or selected values
}
```

### Field Selector — "Where" Dropdown

Two groups in the dropdown:

1. **Record properties** (always available):
   - Template
   - Status
   - Record Label
   - SID
   - Created By
   - Date Created
   - Last Updated

2. **Dynamic fields** (gathered from all loaded records):
   - Scan `records[*].fieldSections[*].fields[*].name` to collect a unique set of field names
   - Group by section label if desired, or show flat list
   - Prefix internally with `field::` to distinguish from top-level props

### Operator Dropdown — varies by field type

| Field Category | Operators |
|---|---|
| **Text** (templateLabel, statusLabel, recordLabel, sid, createdByName, text fields) | equals, does not equal, contains, does not contain, starts with, ends with, is empty, is not empty |
| **Selection/Enum** (statusLabel, templateLabel, selection fields) | is, is not, is any of, is none of, is empty, is not empty |
| **Date** (recordCreated, lastUpdate, date fields) | is, is before, is after, is between, is empty, is not empty |
| **Number** | equals, does not equal, greater than, less than, between, is empty, is not empty |
| **User** (createdByName, user fields) | is, is not, is any of, is none of, is empty, is not empty |

### Value Input — varies by operator

| Operator | Input Type |
|---|---|
| equals, does not equal, contains, does not contain, starts with, ends with, greater than, less than | Text/number input |
| is, is not | Dropdown of known values (collected from records) |
| is any of, is none of | Multi-select dropdown of known values |
| between | Two inputs (min/max or start/end date) |
| is empty, is not empty | No value input needed |
| is before, is after | Date input |

**Collecting possible values for dropdowns**: scan all loaded records for the selected field and build a `Set` of unique display values. For `templateLabel` and `statusLabel` this gives clean enum-like lists. For dynamic fields, it gives whatever values exist in the data.

---

## File Plan

### New Files

| File | Purpose |
|---|---|
| `src/components/Filter/FilterPanel.jsx` | Main container — "Add Rule" button, list of `FilterRule` rows, apply logic |
| `src/components/Filter/FilterRule.jsx` | Single rule row — field dropdown, operator dropdown, value input, remove button |
| `src/components/Filter/FilterDropdown.jsx` | Reusable styled `<select>` dropdown (brown border, rounded, no fill) |
| `src/components/Filter/FilterInput.jsx` | Reusable styled text/number `<input>` (matching style) |
| `src/hooks/useFilteredRecords.js` | Pure filter logic — takes `(records, rules)` → returns filtered records |

### Modified Files

| File | Change |
|---|---|
| `src/pages/Home.jsx` | Import `FilterPanel` + `useFilteredRecords`. Render panel above the graph controls. Pass `filteredRecords` to `usePhysics` instead of raw `records`. |

---

## Component Details

### `FilterPanel.jsx`

```
┌─────────────────────────────────────────────┐  ← rounded, 1px solid #8b7355, no fill
│  Filters                          [+ Add Rule] │
│                                                 │
│  ┌─ Rule 1 ────────────────────────────── ✕ ┐  │
│  │ [Template ▾]  [is any of ▾]  [Bugs, Tasks]│  │
│  └──────────────────────────────────────────┘  │
│  ┌─ Rule 2 ────────────────────────────── ✕ ┐  │
│  │ [Status ▾]    [equals ▾]    [Open      ] │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

- State: `rules` array (managed via `useState`)
- "Add Rule" appends a blank rule `{ id, field: '', operator: '', value: '' }`
- Each rule change updates state → `useFilteredRecords` recomputes
- When no rules exist or all rules are incomplete, show all records (no filtering)

### `FilterRule.jsx`

One horizontal row with:
1. **Field dropdown** — populated from record properties + dynamic fields
2. **Operator dropdown** — populated based on selected field's type category
3. **Value input** — text input OR dropdown/multi-select depending on operator
4. **Remove button** (✕)

When the field changes → reset operator and value.
When the operator changes → reset value if input type changes.

### `FilterDropdown.jsx`

Styled `<select>`:
- `border: 1px solid #8b7355`
- `border-radius: 6px`
- `background: transparent`
- `color: #7a6a5a`
- `padding: 4px 8px`
- `font-size: 12px`
- `outline: none`

### `FilterInput.jsx`

Styled `<input>`:
- Same border/radius/color as dropdown
- `background: transparent`

### `useFilteredRecords.js`

```js
export function useFilteredRecords(records, rules) {
  return useMemo(() => {
    if (!records || rules.length === 0) return records
    const activeRules = rules.filter(r => r.field && r.operator)
    if (activeRules.length === 0) return records

    return records.filter(record => {
      return activeRules.every(rule => matchesRule(record, rule))
    })
  }, [records, rules])
}
```

**`matchesRule(record, rule)`** resolves the field value:
- Top-level prop → `record[prop]`
- Dynamic field → scan `record.fieldSections` for matching `field.name`, take `field.value`

Then applies the operator:
- `equals` → `val === rule.value`
- `contains` → `val.includes(rule.value)` (case-insensitive)
- `does_not_contain` → `!val.includes(rule.value)`
- `is_any_of` → `rule.value` (array) `.some(v => v === val)`
- `is_empty` → `!val || val.trim() === ''`
- etc.

All rules are AND'd together (record must match every active rule).

---

## Helper Utilities

### Extracting available fields from records

```js
function getAvailableFields(records) {
  const topLevel = [
    { key: 'templateLabel', label: 'Template', category: 'selection' },
    { key: 'statusLabel', label: 'Status', category: 'selection' },
    { key: 'recordLabel', label: 'Record Label', category: 'text' },
    { key: 'sid', label: 'SID', category: 'text' },
    { key: 'createdByName', label: 'Created By', category: 'user' },
    { key: 'recordCreated', label: 'Date Created', category: 'date' },
    { key: 'lastUpdate', label: 'Last Updated', category: 'date' },
  ]

  const dynamicFieldMap = new Map()
  for (const rec of records) {
    for (const sec of rec.fieldSections) {
      for (const f of sec.fields) {
        if (!dynamicFieldMap.has(f.name)) {
          dynamicFieldMap.set(f.name, {
            key: `field::${f.name}`,
            label: f.name,
            category: fieldTypeToCategory(f.fieldType),
          })
        }
      }
    }
  }

  return [...topLevel, ...dynamicFieldMap.values()]
}
```

### Extracting possible values for a field

```js
function getPossibleValues(records, fieldKey) {
  const values = new Set()
  for (const rec of records) {
    const val = resolveFieldValue(rec, fieldKey)
    if (val) values.add(val)
  }
  return [...values].sort()
}
```

---

## Integration into Home.jsx

```jsx
// Home.jsx changes
import FilterPanel from '../components/Filter/FilterPanel'
import { useFilteredRecords } from '../hooks/useFilteredRecords'

export default function Home() {
  const records = useRecords()
  const [filterRules, setFilterRules] = useState([])
  const filteredRecords = useFilteredRecords(records, filterRules)

  const { canvasRef, ... } = usePhysics(filteredRecords)  // ← filtered, not raw

  return (
    <div style={{ ... }}>
      <Graph ref={canvasRef} />
      <div style={{ position: 'absolute', top: 16, left: 16, ... }}>
        <FilterPanel
          records={records}          // full records for field/value discovery
          rules={filterRules}
          onChange={setFilterRules}
        />
        <Sliders ... />
        <RecordDetails ... />
      </div>
    </div>
  )
}
```

---

## Styling Notes

- All filter UI follows existing design language: beige/brown palette, `system-ui` font, 12px size
- Container: `border: 1px solid #8b7355`, `border-radius: 8px`, `background: transparent`, `padding: 12px`
- Dropdowns and inputs: `border: 1px solid #8b7355`, `border-radius: 6px`, `background: transparent`
- "Add Rule" button: text-only, same brown color, `cursor: pointer`
- Remove (✕) button: subtle, no border, brown color on hover
- Compact layout — each rule is a single row
- Panel max-width ~320px to match existing sidebar controls

---

## Implementation Order

1. Create `useFilteredRecords.js` with `matchesRule` + `resolveFieldValue` logic
2. Create `FilterDropdown.jsx` + `FilterInput.jsx` (styled primitives)
3. Create `FilterRule.jsx` (field/operator/value row)
4. Create `FilterPanel.jsx` (container + add/remove rule management)
5. Wire into `Home.jsx` — add state, pass filtered records to physics
6. Test with live data — verify field discovery, operator logic, dropdown values
