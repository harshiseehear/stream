# Filter System Implementation Plan — React Frontend Using Streamcell APIs

## Overview

This document scopes out a **filter system + saved views** implementation for a new React-based frontend that consumes the same Streamcell REST APIs as the iOS app. Everything below is derived from the actual API contracts, JSON shapes, and proven patterns in the existing iOS codebase.

The filter panel lets users build rules against record fields. Filtered records feed into `usePhysics` so only matching nodes appear on the graph. Filters can be persisted as part of a **Saved View** via the existing `/saved-views` API.

Visual style: simple rounded container, no fill, brown 1px border (`#8b7355`), matching the beige/brown aesthetic.

---

## 1. API CONTRACTS (What You'll Call)

**Base URL:** `https://records.{environmentDomain}/api/v1`

**Auth:** Every request needs `Authorization: Bearer {token}` header.

**Response wrapper:** All responses are wrapped in `{ "data": <payload> }`.

### 1.1 Fetching Data

| Endpoint | Method | Returns | Purpose |
|---|---|---|---|
| `/definitions/module/{moduleId}` | GET | `{ data: RecordDef[] }` | All templates in a module (field schemas) |
| `/definition/{recordDefUuid}` | GET | `{ data: RecordDef }` | Single template definition |
| `/instances/{recordDefUuid}` | GET | `{ data: RecordInst[] }` | All records for a template |
| `/instance/{recordInstUuid}` | GET | `{ data: RecordInst }` | Single record instance |

### 1.2 Saved Views (Filter Persistence)

| Endpoint | Method | Body / Params | Returns | Purpose |
|---|---|---|---|---|
| `/saved-views` | POST | `{ data: TableConfiguration }` | `{ data: TableConfiguration }` | Create/update a saved view |
| `/saved-views/{dataUuid}` | GET | — | `{ data: TableConfiguration[] }` | Fetch all saved views for a table |
| `/saved-views/{viewUuid}` | DELETE | — | — | Delete a saved view |

> **Key insight:** The `filter` array inside `TableConfiguration` is what gets persisted. There is no separate filter API — filters are embedded in saved views.

### 1.3 Other Relevant Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/instance/{id}/field/{fieldId}` | PATCH | Update a field value (body: `{ data: RecordResps }`) |
| `/instance/{id}/status` | PATCH | Update record status |
| `https://permissions.{domain}/api/v1/data-access/roles/user` | GET | User permissions/roles |

---

## 2. JSON DATA SHAPES (What The API Returns)

### 2.1 RecordDef (Template / Field Schema)

This is the source of truth for what fields exist, their types, and their configuration.

```json
{
  "uuid": "abc-123",
  "recordLabel": "Animal",
  "recordCode": "ANI",
  "recordStatus": "ACTIVE",
  "recordCreated": "2025-07-22T...",
  "recordCreatedActor": { "id": 1, "type": "USER" },
  "lastUpdate": "2025-07-22T...",
  "lastUpdateActor": { "id": 1, "type": "USER" },
  "statusDef": [
    {
      "isDefault": true,
      "statusUUID": "status-uuid-1",
      "statusColor": "#22c55e",
      "statusLabel": "Active",
      "statusState": "ACTIVE"
    }
  ],
  "recordSectionDef": [
    {
      "uuid": "section-uuid-1",
      "sectionLabel": "Basic Info",
      "isHidden": false,
      "sectionFieldsDef": [
        {
          "uuid": "field-uuid-1",
          "type": "FIELD",
          "fieldType": "TEXT",
          "fieldLabel": "Name",
          "fieldStatus": "ACTIVE",
          "fieldListUUID": null,
          "attributes": {
            "subtype": null,
            "mandatory": false,
            "multiSelect": false,
            "recordKey": true,
            "unit": null
          }
        },
        {
          "uuid": "field-uuid-2",
          "type": "FIELD",
          "fieldType": "NUMBER",
          "fieldLabel": "Weight",
          "fieldStatus": "ACTIVE",
          "attributes": { "unit": "kg" }
        },
        {
          "uuid": "field-uuid-3",
          "type": "FIELD",
          "fieldType": "SELECTABLE_VALUES",
          "fieldLabel": "Priority",
          "fieldStatus": "ACTIVE",
          "fieldListUUID": "list-uuid-1",
          "attributes": { "multiSelect": false }
        },
        {
          "uuid": "field-uuid-4",
          "type": "FIELD",
          "fieldType": "USER",
          "fieldLabel": "Assigned To",
          "attributes": { "multiSelect": true }
        },
        {
          "uuid": "field-uuid-5",
          "type": "FIELD",
          "fieldType": "DATE",
          "fieldLabel": "Due Date",
          "attributes": {}
        }
      ]
    }
  ]
}
```

**Field type mapping** (API `fieldType` string → logical type):

| API `fieldType` | `attributes.subtype` | `multiSelect` | Logical Type |
|---|---|---|---|
| `TEXT` | `null` | — | textfield |
| `TEXT` | `TEXTAREA` | — | textbox (rich text) |
| `NUMBER` | — | — | number |
| `DATE` | — | — | date |
| `DATETIME` | — | — | datetime |
| `IMAGE` | — | — | image/canvas |
| `USER` | — | `false` | single user |
| `USER` | — | `true` | multi user |
| `SELECTABLE_VALUES` | — | `false` | single dropdown |
| `SELECTABLE_VALUES` | — | `true` | multi dropdown |
| `SC_RECORD` | — | `false`/`true` | internal record link |
| `SM_RECORD` | — | `false`/`true` | external record link |

### 2.2 RecordInst (A Single Record's Data)

```json
{
  "uuid": "inst-uuid-1",
  "recordDefUUID": "abc-123",
  "recordIncrementalSID": 42,
  "recordCreated": "2025-08-01T...",
  "recordCreatedActor": { "id": 5, "type": "USER" },
  "lastUpdate": "2025-08-15T...",
  "lastUpdateActor": { "id": 5, "type": "USER" },
  "containerUUID": "container-uuid-1",
  "statusResps": {
    "statusUUID": "status-uuid-1",
    "statusLabel": "Active"
  },
  "recordResps": {
    "field{field-uuid-1}": "Sample Name",
    "field{field-uuid-2}": "72.5",
    "field{field-uuid-3}": { "sel": ["option-uuid-a"], "selText": "High" },
    "field{field-uuid-4}": [5, 12],
    "field{field-uuid-5}": "2025-09-01"
  },
  "taskRespsDerived": {},
  "sectionVisibility": {},
  "recordNotes": [],
  "attachments": []
}
```

**CRITICAL: `recordResps` key format:**
- Keys are prefixed: `"field{uuid}"` for fields, `"task{uuid}"` for tasks
- Strip the `field` prefix to get the bare field UUID for matching against `RecordDef`
- Values are **polymorphic** — the type depends on the field definition:

| Field Type | `recordResps` Value Shape | Example |
|---|---|---|
| Text / Number / Date | `string` | `"Hello"`, `"42.5"`, `"2025-09-01"` |
| Single/Multi User | `int[]` (user IDs) | `[5, 12]` |
| Single Dropdown | `{ sel: string[], selText: string }` | `{ "sel": ["opt-1"], "selText": "High" }` |
| Multi Dropdown | `{ sel: string[], selText: string }` | `{ "sel": ["opt-1","opt-2"], "selText": "High, Low" }` |
| SC Record (linked) | `[{ recordSID, recordInstUUID, subFieldResps? }]` | |
| SM Record (external) | `[{ id, label, footer?, subFields }]` | |
| Task | `[{ uuid, taskRowDate?, taskRowDone, taskFieldsRespInst }]` | |
| Image/Canvas | `{ lines, width, height }` | |
| Empty | `null` or absent | |

### 2.3 TableConfiguration (Saved View — What Gets POSTed)

This is the **exact JSON shape** the API expects for creating a saved view. Filters live inside this object.

```json
{
  "uuid": "view-uuid-1",
  "label": "My Filtered View",
  "dataUUID": "abc-123",
  "isShared": false,
  "layoutMode": "GRID",
  "pinnedColumns": { "leading": ["sid"], "trailing": [] },
  "visibleColumns": ["field-uuid-1", "field-uuid-2", "field-uuid-3"],
  "columnWidths": { "field-uuid-1": 320, "field-uuid-2": 120 },
  "sort": [{ "field": "field-uuid-1", "sort": "ASC" }],
  "filter": [
    {
      "field": "field-uuid-3",
      "operator": "EQUALS",
      "value": ["High", "Critical"]
    },
    {
      "field": "field-uuid-2",
      "operator": "GREATER_THAN",
      "value": [50.0]
    },
    {
      "field": "field-uuid-5",
      "operator": "BEFORE",
      "value": { "type": "RELATIVE", "base": "END_OF_MONTH", "offset": 0 }
    }
  ],
  "conditionalFormats": []
}
```

**JSON encoding quirks** (observed from iOS `TableConfiguration.encode`):
- `sort` is always an **array** (even for single sort) — `[{ field, sort }]` or `null`
- `filter` is an **array** of filter rules (AND logic) — `[{ field, operator, value }]`
- `pinnedColumns` is an **object** `{ leading: string[], trailing: string[] }` — not a flat array
- `columnWidths` values are **integers** (not floats)
- Incomplete filters (missing required value) are stripped on decode
- `layoutMode` uses raw strings: `"GRID"`, `"CARD"`, `"CALENDAR"`, `"KANBAN"`, `"PIVOT"`, `"GRAPH"`

### 2.4 Filter Rule JSON Shape

```json
{
  "field": "column-uuid",
  "operator": "EQUALS",
  "value": ["option1", "option2"]
}
```

**`field`**: The column UUID — matches field UUIDs from `RecordDef`, or system column keys.

**`operator`**: One of these raw strings:

| Operator String | Display Name | Needs Value? |
|---|---|---|
| `EQUALS` | Equals | Yes |
| `DOES_NOT_EQUAL` | Does Not Equal | Yes |
| `CONTAINS` | Contains | Yes |
| `NOT_CONTAINS` | Does Not Contain | Yes |
| `GREATER_THAN` | Greater Than | Yes |
| `GREATER_THAN_OR_EQUAL_TO` | Greater Than or Equal To | Yes |
| `LESS_THAN` | Less Than | Yes |
| `LESS_THAN_OR_EQUAL_TO` | Less Than or Equal To | Yes |
| `BEFORE` | Before | Yes (date) |
| `AFTER` | After | Yes (date) |
| `ON` | On | Yes (date) |
| `NOT_ON` | Not On | Yes (date) |
| `IS_EMPTY` | Is Empty | No |
| `IS_NOT_EMPTY` | Is Not Empty | No |
| `IS_TRUE` | Is True | No |
| `IS_FALSE` | Is False | No |

**`value`**: Polymorphic — shape depends on field type and operator:

| Scenario | Value Shape | Example |
|---|---|---|
| Text equals / contains | `string[]` | `["search term"]` |
| Dropdown "is any of" | `string[]` (option UUIDs or display values) | `["High", "Critical"]` |
| Number comparison | `number[]` (first element used) | `[50.0]` |
| User filter | `int[]` (user IDs) | `[5, 12]` |
| Fixed date | `{ "type": "FIXED", "value": "2025-09-01" }` | |
| Relative date | `{ "type": "RELATIVE", "base": "TODAY", "offset": -7 }` | |
| Valueless ops | `null` or omitted | (isEmpty, isNotEmpty, etc.) |

**Relative date bases:** `TODAY`, `START_OF_WEEK`, `END_OF_WEEK`, `START_OF_MONTH`, `END_OF_MONTH`, `START_OF_YEAR`, `END_OF_YEAR`

---

## 3. OPERATOR-PER-FIELD-TYPE MATRIX

This is exactly how the iOS app maps field types to valid operators. Your React app should use the same mapping.

| Field Type | Valid Operators |
|---|---|
| **textfield** | `CONTAINS`, `NOT_CONTAINS`, `EQUALS`, `DOES_NOT_EQUAL`, `IS_EMPTY`, `IS_NOT_EMPTY` |
| **textbox** | `CONTAINS`, `NOT_CONTAINS`, `IS_EMPTY`, `IS_NOT_EMPTY` |
| **number** | `EQUALS`, `DOES_NOT_EQUAL`, `GREATER_THAN`, `GREATER_THAN_OR_EQUAL_TO`, `LESS_THAN`, `LESS_THAN_OR_EQUAL_TO`, `IS_EMPTY`, `IS_NOT_EMPTY` |
| **date** | `BEFORE`, `AFTER`, `ON`, `NOT_ON`, `IS_EMPTY`, `IS_NOT_EMPTY` |
| **datetime** | `BEFORE`, `AFTER`, `ON`, `NOT_ON`, `IS_EMPTY`, `IS_NOT_EMPTY` |
| **image** | `IS_EMPTY`, `IS_NOT_EMPTY` |
| **user** (single) | `EQUALS`, `DOES_NOT_EQUAL`, `IS_EMPTY`, `IS_NOT_EMPTY` |
| **multiUser** | `CONTAINS`, `NOT_CONTAINS`, `IS_EMPTY`, `IS_NOT_EMPTY` |
| **dropdown** (single) | `EQUALS`, `DOES_NOT_EQUAL`, `IS_EMPTY`, `IS_NOT_EMPTY` |
| **multiDropdown** | `CONTAINS`, `NOT_CONTAINS`, `IS_EMPTY`, `IS_NOT_EMPTY` |
| **scRecord** (single) | `EQUALS`, `DOES_NOT_EQUAL`, `IS_EMPTY`, `IS_NOT_EMPTY` |
| **multiScRecord** | `CONTAINS`, `NOT_CONTAINS`, `IS_EMPTY`, `IS_NOT_EMPTY` |
| **status** | `EQUALS`, `DOES_NOT_EQUAL`, `IS_EMPTY`, `IS_NOT_EMPTY` |

---

## 4. FILTER EVALUATION LOGIC (Client-Side)

All filtering happens client-side. The API returns all records; you filter in the browser.

### 4.0 AND / OR Logic

Rules are organized into **groups**. Within a group, rules are combined with the group's junction (`AND` or `OR`). At the top level, groups are AND'd together (every group must pass).

```js
// Data model
{
  groups: [
    {
      id: 'group-1',
      junction: 'AND',  // or 'OR'
      rules: [ { id, field, operator, value }, ... ]
    },
    ...
  ]
}
```

Default UX: a single group with `AND` junction. The user can toggle the junction to `OR` via a pill/button between rules. A future "Add Group" button allows combining AND and OR (e.g., "(Status = Open OR Status = In Progress) AND Priority = High").

For v1, a single group with a toggleable AND/OR junction is sufficient. Multi-group is a natural extension.

Evaluation:
```js
function matchesAllGroups(record, groups, fieldDefs) {
  return groups.every(group => {
    const active = group.rules.filter(r => r.field && r.operator)
    if (active.length === 0) return true
    const fn = group.junction === 'OR' ? 'some' : 'every'
    return active[fn](rule => matchesSingleFilter(record, rule, fieldDefs))
  })
}
```

### 4.1 Resolving a Field Value from a Record

```js
function resolveFieldValue(record, fieldKey, fieldType) {
  // System/top-level properties
  if (fieldKey === 'templateLabel') return record.templateLabel
  if (fieldKey === 'statusLabel') return record.statusResps?.statusLabel
  if (fieldKey === 'sid') return `${record.recordCode}-${record.recordIncrementalSID}`
  if (fieldKey === 'recordCreated') return record.recordCreated
  if (fieldKey === 'lastUpdate') return record.lastUpdate

  // Dynamic field — look in recordResps
  // Keys in the API response are prefixed: "field{uuid}"
  const raw = record.recordResps[`field${fieldKey}`]
    ?? record.recordResps[fieldKey]
  return raw
}
```

### 4.2 Comparison Logic Per Operator

From `TableFilterService.swift` — exact behavior:

**EQUALS / DOES_NOT_EQUAL:**
- Text: check if `filterValue[]` contains the cell value (case-insensitive)
- Number: parse both as float, check if any filterValue matches
- Dropdown: compare `sel[0]` against filterValue array
- User: compare first user ID against filterValue int array
- Status: compare `statusUUID` against filterValue string array

**CONTAINS / NOT_CONTAINS:**
- Text: case-insensitive substring match — `cellValue.includes(filterValue[0])`
- Multi-dropdown: check if any `sel` element is in filterValue array
- Multi-user: check if any user ID is in filterValue array
- Multi-record: check if any recordSID contains filterValue string

**GREATER_THAN / LESS_THAN / GTE / LTE:**
- Parse cell value and filter value as numbers, compare

**BEFORE / AFTER / ON / NOT_ON:**
- Parse cell value as date
- If filter is relative date: calculate actual date from base + offset
- Compare dates (ON = same day regardless of time, BEFORE = strictly earlier, etc.)

**IS_EMPTY / IS_NOT_EMPTY:**
- Text: `null`, `undefined`, or `"".trim() === ""`
- Array: `null` or `.length === 0`
- Dropdown: `sel` is null or empty array
- Date: null or empty string

**IS_TRUE / IS_FALSE:**
- Boolean evaluation

### 4.3 Core Filter Function

```js
function matchesFilterGroups(record, groups, fieldDefs) {
  if (!groups || groups.length === 0) return true

  return groups.every(group => {
    const active = group.rules.filter(r => r.field && r.operator)
    if (active.length === 0) return true

    const check = rule => {
      if (!isValuelessOperator(rule.operator) && isFilterValueEmpty(rule.value)) {
        return true // incomplete rule = skip
      }
      return matchesSingleFilter(record, rule, fieldDefs)
    }

    return group.junction === 'OR'
      ? active.some(check)
      : active.every(check)
  })
}
```

---

## 5. WHAT THE REACT APP NEEDS TO DO

### 5.1 Data Fetching (Already Exists)

Your app already calls:
- `GET /definitions/module/{moduleId}` → get all templates (field schemas)
- `GET /instances/{recordDefUuid}` → get all records per template

These give you everything needed for filtering. No new API calls required for the filter itself.

### 5.2 New: Saved View Persistence

To save/load filter configurations, use the saved views API:

**Save a view:**
```js
const savedView = {
  uuid: crypto.randomUUID(),  // generate client-side for new views
  label: "My Filter View",
  dataUUID: templateUuid,      // which template this view belongs to
  isShared: false,             // false = personal, true = account-wide
  layoutMode: "GRID",
  pinnedColumns: { leading: [], trailing: [] },
  visibleColumns: [...],
  columnWidths: {},
  sort: null,
  filter: filters.map(f => ({
    field: f.field,
    operator: f.operator,
    value: f.value
  })),
  conditionalFormats: []
}

await fetch(`${BASE_URL}/saved-views`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: savedView })
})
```

**Load saved views:**
```js
const res = await fetch(`${BASE_URL}/saved-views/${templateUuid}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
const { data: views } = await res.json()
// views[].filter contains the persisted filter rules
```

**Delete a saved view:**
```js
await fetch(`${BASE_URL}/saved-views/${viewUuid}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
})
```

---

## 6. FILE PLAN

### New Files

| File | Purpose |
|---|---|
| `src/components/Filter/FilterPanel.jsx` | Main container — "Add Rule" button, list of filter rule rows, apply logic |
| `src/components/Filter/FilterRule.jsx` | Single rule row — field dropdown, operator dropdown, value input, remove button |
| `src/components/Filter/FilterDropdown.jsx` | Reusable styled `<select>` (brown border, rounded, no fill) |
| `src/components/Filter/FilterInput.jsx` | Reusable styled text/number/date `<input>` |
| `src/components/Filter/FilterDateInput.jsx` | Date-specific input with fixed/relative toggle |
| `src/components/Filter/SavedViewPanel.jsx` | List saved views, create/load/delete |
| `src/hooks/useFilteredRecords.js` | Pure filter logic — `(records, groups, fieldDefs)` → filtered records (supports AND/OR groups) |
| `src/hooks/useSavedViews.js` | Fetch/create/delete saved views via API |
| `src/utils/filterOperators.js` | Operator-per-field-type map, valueless check, display names |
| `src/utils/filterEvaluator.js` | `matchesSingleFilter`, `matchesFilterGroups`, `resolveFieldValue`, comparison functions, relative date calculation |

### Modified Files

| File | Change |
|---|---|
| `src/pages/Home.jsx` | Import `FilterPanel` + `useFilteredRecords`. Render panel above graph controls. Pass `filteredRecords` to `usePhysics`. |

---

## 7. COMPONENT DETAILS

### 7.1 FilterPanel.jsx

```
┌──────────────────────────────────────────────────┐  ← rounded 8px, 1px solid #8b7355, no fill
│  Filters                             [+ Add Rule] │
│                                                    │
│  ┌─ Rule ──────────────────────────────────── ✕ ┐ │
│  │ [Template ▾]  [is any of ▾]  [Bugs, Tasks  ] │ │
│  └──────────────────────────────────────────────┘ │
│                   [ AND ▾ ]                        │  ← toggleable: AND / OR
│  ┌─ Rule ──────────────────────────────────── ✕ ┐ │
│  │ [Weight ▾]    [greater than ▾]  [50        ] │ │
│  └──────────────────────────────────────────────┘ │
│                   [ AND ▾ ]                        │
│  ┌─ Rule ──────────────────────────────────── ✕ ┐ │
│  │ [Due Date ▾]  [before ▾]  [End of Month   ] │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  [Save as View]                                    │
└──────────────────────────────────────────────────┘
```

**State:** `groups` array via `useState` — each group has `{ id, junction: 'AND', rules: [] }`
- Default: one group with `AND` junction
- "Add Rule" appends a blank rule to the current group
- Junction toggle (AND/OR pill between rules) changes the group's `junction`
- Each change → `useFilteredRecords` recomputes via `matchesFilterGroups`
- No rules or all incomplete → show all records
- "Save as View" → opens name input, calls `POST /saved-views`
- When serializing to the API `filter` array, flatten all group rules (the API stores a flat array; the junction is a frontend-only concept stored alongside in the saved view or encoded as metadata)

### 7.2 FilterRule.jsx

One horizontal row:

1. **Field dropdown** — two groups:
   - **Record Properties**: Template, Status, SID, Record Label, Created By, Date Created, Last Updated
   - **Fields**: merged from ALL loaded templates' `RecordDef.recordSectionDef[].sectionFieldsDef[]`, de-duped by `fieldLabel`. If a Template filter rule already exists in a higher-priority position, narrow the field list to only that template's fields (hierarchy-aware narrowing). Otherwise show the union of all fields across templates.

2. **Operator dropdown** — populated from field type → operator mapping (Section 3)

3. **Value input** — varies by operator and field type:

   | Scenario | Input |
   |---|---|
   | Text equals/contains | Text `<input>` |
   | Number comparison | Number `<input>` |
   | Dropdown equals | Single-select dropdown of known values |
   | Multi-dropdown / "is any of" | Multi-select dropdown of known values |
   | User field | User picker dropdown sourced from existing `_userCache` via `getUserName(id)` — list individual users, not comma-joined strings |
   | Status field | Dropdown of `statusDef[]` from template |
   | Date — fixed | Date picker `<input type="date">` |
   | Date — relative | Toggle between Fixed/Relative. Relative shows dropdown: Today, Start of Week, End of Week, Start of Month, End of Month, Start of Year, End of Year — plus a numeric offset input (e.g. "+7 days" / "-3 days"). Included in v1. |
   | Valueless (isEmpty, etc.) | Nothing — no input rendered |

4. **Remove button** (✕)

**Reset behavior:**
- Field changes → reset operator + value
- Operator changes → reset value if input type changes

### 7.3 Collecting Possible Values for Dropdowns

For selection-type operators, scan loaded records to build options:

```js
function getPossibleValues(records, fieldKey, fieldType) {
  const values = new Set()
  for (const record of records) {
    const raw = resolveFieldValue(record, fieldKey, fieldType)
    if (raw == null) continue

    if (fieldType === 'dropdown' || fieldType === 'multiDropdown') {
      // raw is { sel: [...], selText: "..." }
      if (raw.sel) raw.sel.forEach(s => values.add(s))
    } else if (fieldType === 'status') {
      values.add(raw.statusUUID || raw)
    } else {
      values.add(String(raw))
    }
  }
  return [...values].sort()
}
```

For **status**, use `RecordDef.statusDef[]` directly — it gives you UUIDs, labels, and colors.

For **dropdown fields**, the options come from the template's list definitions (referenced by `fieldListUUID`) — the React app already has access to these. Use them directly for the dropdown options.

---

## 8. SAVED VIEWS INTEGRATION

### 8.1 useSavedViews Hook

```js
function useSavedViews(templateUuid) {
  const [views, setViews] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchViews = async () => { /* GET /saved-views/{templateUuid} */ }
  const createView = async (config) => { /* POST /saved-views */ }
  const deleteView = async (viewUuid) => { /* DELETE /saved-views/{viewUuid} */ }

  useEffect(() => { fetchViews() }, [templateUuid])

  return { views, loading, createView, deleteView, refetch: fetchViews }
}
```

### 8.2 SavedViewPanel.jsx

```
┌──────────────────────────────────────────────────┐
│  Saved Views                        [+ New View]  │
│                                                    │
│  ● Default View                                    │
│  ○ High Priority Items          [🔒]  [✕]         │
│  ○ Overdue Tasks                [🌐]  [✕]         │
└──────────────────────────────────────────────────┘
```

- List all views from API
- 🔒 = personal (`isShared: false`), 🌐 = account-wide (`isShared: true`)
- Clicking a view → load its `filter` array into `FilterPanel` state + apply other config
- Create: serialize current filters + layout into `TableConfiguration` JSON, POST
- Delete: with confirmation

### 8.3 What Gets Saved in a View

The full `TableConfiguration` object. For your React frontend, the minimum viable payload:

```json
{
  "uuid": "generated-uuid",
  "label": "View Name",
  "dataUUID": "template-uuid",
  "isShared": false,
  "layoutMode": "GRID",
  "pinnedColumns": { "leading": [], "trailing": [] },
  "visibleColumns": [],
  "columnWidths": {},
  "sort": null,
  "filter": [
    { "field": "field-uuid", "operator": "EQUALS", "value": ["someValue"] }
  ],
  "conditionalFormats": []
}
```

---

## 9. IMPLEMENTATION ORDER

1. **`filterOperators.js`** + **`filterEvaluator.js`** — operator map, comparison functions, field value resolution
2. **`useFilteredRecords.js`** — hook that takes `(records, groups, fieldDefs)` → filtered array (AND/OR group support)
3. **`FilterDropdown.jsx`** + **`FilterInput.jsx`** + **`FilterDateInput.jsx`** — styled primitives
4. **`FilterRule.jsx`** — single rule row with field/operator/value
5. **`FilterPanel.jsx`** — container with add/remove rule management
6. **Wire into `Home.jsx`** — state, pass filtered records to physics
7. **`useSavedViews.js`** — API integration for persisting views
8. **`SavedViewPanel.jsx`** — UI for saved view management
9. **Test with live data** — verify field discovery, operator logic, dropdown values, save/load round-trip

---

## 10. DECISIONS (Resolved)

| # | Question | Decision |
|---|---|---|
| 1 | **Cross-template filtering** | Merge fields from ALL templates. Template is a separate top-level filter. If a Template rule exists higher in the list, child rules narrow to that template's fields only (hierarchy-aware). |
| 2 | **User resolution** | Existing pipeline: `fetchUserNames()` → `_userCache` → `getUserName(id)`. User filter dropdowns will source individual user entries from the cache — not the comma-joined display strings. No new API calls needed. |
| 3 | **Dropdown option lists** | React app already has access to template list definitions via `fieldListUUID`. Use them directly. |
| 4 | **AND / OR logic** | Both supported. Rules in a group share a toggleable AND/OR junction. Groups are AND'd together. v1: single group with toggle. |
| 5 | **Saved view scope** | Save the full `TableConfiguration` (filters, sort, columns, layout, etc.). Focus for now is filters — other fields can be populated with defaults. |
| 6 | **Relative dates** | Included in v1. Fixed/Relative toggle with base dropdown (Today, Start/End of Week/Month/Year) + day offset input. |

---

## 11. DOMAIN MODEL (TypeScript Types)

Canonical types for the filter system. Keep these framework-agnostic so they can be shared across utils, hooks, and components.

```ts
// --- Filter primitives ---

type FilterOperator =
  | 'EQUALS' | 'DOES_NOT_EQUAL'
  | 'CONTAINS' | 'NOT_CONTAINS'
  | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL_TO'
  | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL_TO'
  | 'BEFORE' | 'AFTER' | 'ON' | 'NOT_ON'
  | 'IS_EMPTY' | 'IS_NOT_EMPTY'
  | 'IS_TRUE' | 'IS_FALSE'

type FilterDateValue = {
  type: 'FIXED' | 'RELATIVE'
  value?: string          // ISO date for FIXED
  base?: 'TODAY' | 'START_OF_WEEK' | 'END_OF_WEEK'
       | 'START_OF_MONTH' | 'END_OF_MONTH'
       | 'START_OF_YEAR' | 'END_OF_YEAR'
  offset?: number         // day offset for RELATIVE
}

type FilterValue = string[] | number[] | FilterDateValue | null

type FilterRule = {
  id: string
  field: string            // column UUID or top-level prop key
  operator: FilterOperator
  value?: FilterValue
}

type FilterGroup = {
  id: string
  junction: 'AND' | 'OR'
  rules: FilterRule[]
}

// --- Sort ---

type SortSpec = {
  field: string
  sort: 'ASC' | 'DESC'
}

// --- Query state (everything the UI needs to reproduce a view) ---

type QueryState = {
  filterGroups: FilterGroup[]
  sort: SortSpec | null
  search?: string
  visibleColumns?: string[]
  pinnedColumns?: { leading: string[]; trailing: string[] }
  columnWidths?: Record<string, number>
  layoutMode?: 'GRID' | 'CARD' | 'CALENDAR' | 'KANBAN' | 'PIVOT' | 'GRAPH'
}

// --- Saved view (what the API persists) ---

type SavedView = {
  uuid: string
  label: string
  dataUUID: string         // template UUID this view belongs to
  isShared: boolean        // false = personal, true = account-wide
  viewCreated: string      // ISO timestamp
  queryState: QueryState   // ← local representation; serialized into TableConfiguration for the API
}
```

**Mapping to the Streamcell API `TableConfiguration`:**

| Local `QueryState` field | API JSON key | Notes |
|---|---|---|
| `filterGroups` | `filter` | Flatten rules into a single array for persistence; junction is frontend metadata |
| `sort` | `sort` | Wrap in array: `[{ field, sort }]` |
| `visibleColumns` | `visibleColumns` | String array of column UUIDs |
| `pinnedColumns` | `pinnedColumns` | `{ leading: [], trailing: [] }` object |
| `columnWidths` | `columnWidths` | Values as integers |
| `layoutMode` | `layoutMode` | Raw string enum |

---

## 12. FRONTEND ARCHITECTURE (Three-Layer Design)

### Layer 1 — Domain (pure, no React)

Files: `src/utils/filterOperators.js`, `src/utils/filterEvaluator.js`, `src/utils/querySerializer.js`

Responsibilities:
- Type definitions and constants
- Operator-per-field-type map
- `matchesSingleFilter`, `matchesFilterGroups`, `resolveFieldValue`
- `toApiPayload(queryState)` → `TableConfiguration` JSON
- `fromApiPayload(tableConfig)` → `QueryState`
- `toUrlParams(queryState)` → URL search string
- `fromUrlParams(searchString)` → `QueryState`

Golden rule: **UI components never construct raw API payloads directly.** All translation goes through this layer.

### Layer 2 — State (React hooks + store)

Files: `src/hooks/useFilteredRecords.js`, `src/hooks/useSavedViews.js`, `src/hooks/useQueryState.js`

```ts
// Suggested state shape
type FilterScreenState = {
  selectedViewId: string | null
  queryState: QueryState
  baselineQueryState: QueryState | null  // snapshot at last save/apply
  isDirty: boolean                       // queryState ≠ baseline
}
```

Key behaviors:
- **Apply view** → sets `selectedViewId`, `queryState`, and `baselineQueryState` together
- **Any user edit** (add rule, change operator, toggle junction, etc.) → recalculates `isDirty`
- **Save** enabled only when `isDirty === true`
- Query key for data fetching includes serialized `queryState` for correct cache separation

### Layer 3 — UI (React components)

Files: `src/components/Filter/*.jsx`, `src/components/SavedViews/*.jsx`

Components consume state via hooks and call domain-layer utilities. No API translation logic lives here.

---

## 13. URL & NAVIGATION STATE

Keep filter/view state linkable and restorable through the URL.

Strategy:
- If a saved view is selected: `?viewId=v_123`
- If user modifies the view without saving: `?viewId=v_123&f=...&s=...` (transient overrides)
- If no view selected: `?f=...&s=...` (ad-hoc filters)

Benefits:
- Deep links for sharing and support
- Browser back/forward works intuitively
- Page refresh does not lose context

Implementation:
- Parse URL once on mount → hydrate store
- Debounce URL writes for fast-typing fields (search, text input values)
- Use `toUrlParams` / `fromUrlParams` from the domain layer

---

## 14. DIRTY STATE & SAVE SEMANTICS

A robust saved-view UX depends on strict dirty-state logic.

### Detecting dirty state

1. Normalize both current and baseline `QueryState` (sort keys, strip empty rules, remove ephemeral IDs).
2. Deep-compare normalized objects.
3. If different → `isDirty = true` → enable Save button.

### Save operations

| Action | Behavior |
|---|---|
| **Save** | Update the currently selected view via `POST /saved-views`. Reset `baselineQueryState`. Clear `isDirty`. |
| **Save as new** | Create a new view. Switch `selectedViewId` to the new UUID. Set new baseline. |
| **Discard changes** | Revert `queryState` to `baselineQueryState`. Clear `isDirty`. |

### Guardrails

- If the selected view is read-only (account-wide and user lacks edit permission) → hide **Save**, show only **Save as new**.
- Prompt before overwriting if there are concurrent updates (compare `viewCreated` / version).

---

## 15. FIELD METADATA SYSTEM

Drive filter UI from config, not hardcoded per-screen logic.

```ts
type FieldMeta = {
  key: string                    // column UUID or top-level prop key
  label: string                  // display name
  type: 'text' | 'number' | 'date' | 'datetime' | 'dropdown'
       | 'multiDropdown' | 'user' | 'multiUser' | 'status'
       | 'scRecord' | 'multiScRecord' | 'image' | 'textbox'
  operators: FilterOperator[]    // from Section 3 matrix
  options?: Array<{ label: string; value: string }>  // for dropdown/status/user
  templateUuid?: string          // which template this field belongs to (for cross-template merging)
}
```

Build this from `RecordDef` at load time:

```js
function buildFieldMetadata(templates, userCache) {
  const topLevel = [
    { key: 'templateLabel', label: 'Template', type: 'dropdown',
      operators: ['EQUALS','DOES_NOT_EQUAL','IS_EMPTY','IS_NOT_EMPTY'],
      options: templates.map(t => ({ label: t.recordLabel, value: t.recordLabel })) },
    { key: 'statusLabel', label: 'Status', type: 'status',
      operators: ['EQUALS','DOES_NOT_EQUAL','IS_EMPTY','IS_NOT_EMPTY'] },
    { key: 'sid', label: 'SID', type: 'text',
      operators: ['CONTAINS','NOT_CONTAINS','EQUALS','DOES_NOT_EQUAL','IS_EMPTY','IS_NOT_EMPTY'] },
    { key: 'recordCreated', label: 'Date Created', type: 'datetime',
      operators: ['BEFORE','AFTER','ON','NOT_ON','IS_EMPTY','IS_NOT_EMPTY'] },
    { key: 'lastUpdate', label: 'Last Updated', type: 'datetime',
      operators: ['BEFORE','AFTER','ON','NOT_ON','IS_EMPTY','IS_NOT_EMPTY'] },
    // ... createdByName, recordLabel
  ]

  const dynamic = []
  for (const tmpl of templates) {
    for (const sec of tmpl.recordSectionDef) {
      for (const f of sec.sectionFieldsDef) {
        const fieldType = resolveFieldType(f.fieldType, f.attributes)
        dynamic.push({
          key: f.uuid,
          label: f.fieldLabel,
          type: fieldType,
          operators: operatorsForType(fieldType),
          templateUuid: tmpl.uuid,
          // options populated from list defs or user cache as needed
        })
      }
    }
  }

  return [...topLevel, ...dedupeByLabel(dynamic)]
}
```

This enables:
- Dynamic filter UIs driven by config
- Reusable `FilterRule` component across any resource
- Central operator validation

---

## 16. CACHING & DATA FETCHING

With TanStack Query (React Query):

```js
const queryKey = ['records', templateUuid, serializeQueryState(queryState)]
const { data } = useQuery({ queryKey, queryFn: () => fetchRecords(templateUuid) })
```

- Query key includes serialized query state → correct cache per filter/view combination
- Fast back-navigation when returning to previous queries
- Avoid non-deterministic serialization ordering (sort object keys)
- Do not include ephemeral UI state (selected rule ID, panel open/closed) in query keys

Since filtering is client-side, the actual fetch doesn't use the filter params — but the query key still needs to include them so `useFilteredRecords` recomputes via `useMemo` when they change. An alternative: keep records in a stable query key and only use `useMemo` for filtering:

```js
const { data: allRecords } = useQuery({ queryKey: ['records', templateUuid], queryFn: ... })
const filteredRecords = useFilteredRecords(allRecords, filterGroups, fieldDefs)
```

This is simpler and avoids unnecessary refetches.

---

## 17. PHASED ROLLOUT

### Phase 1 — Foundation
- Add type definitions (`FilterRule`, `FilterGroup`, `QueryState`, `SavedView`)
- Build `filterOperators.js` + `filterEvaluator.js` + unit tests
- Build `querySerializer.js` (`toApiPayload`, `fromApiPayload`, `toUrlParams`, `fromUrlParams`)
- Introduce `useQueryState` hook with dirty tracking

### Phase 2 — Basic Filtering
- Ship `FilterPanel` + `FilterRule` for single-group AND rules
- Wire `useFilteredRecords` to data flow
- Sync query state to URL
- Test with live data

### Phase 3 — Saved Views MVP
- CRUD for personal views (`isShared: false`)
- `Save` and `Save as new` actions with dirty-state gating
- `SavedViewPanel` + view switcher + apply behavior

### Phase 4 — Advanced Features
- AND/OR junction toggle
- Cross-template hierarchy-aware field narrowing
- Account-wide views (`isShared: true`) with permissions
- Relative date filter inputs
- Duplicate view, set default view

### Phase 5 — Hardening
- Unsaved-changes warning on navigation
- URL deep-link round-trip tests
- Performance tuning for large filter trees / many records
- Accessibility and keyboard flows for filter builder
- Telemetry: filter adoption rate, save rate, error rate

---

## 18. TESTING STRATEGY

### Unit tests

| Area | What to test |
|---|---|
| Filter evaluation | Each operator × field type combination from Section 3 matrix |
| Relative dates | `calculateRelativeDate` with each base + positive/negative offsets |
| Dirty state | Normalize + deep-compare produces correct `isDirty` |
| Serialization | `toApiPayload` ↔ `fromApiPayload` round-trip stability |
| URL encode/decode | `toUrlParams` ↔ `fromUrlParams` round-trip stability |
| Operator-field validation | Invalid operator for a field type is rejected |

### Integration tests

| Scenario | Expected behavior |
|---|---|
| Apply saved view | Filter panel populates, records filter, URL updates |
| Edit after apply | `isDirty` becomes true, Save button enables |
| Save updates view | API called, baseline reset, `isDirty` clears |
| Add rule → remove rule | Returns to previous state; if matches baseline, `isDirty` clears |

### E2E tests

| Scenario | Expected behavior |
|---|---|
| Create view → reload | View persists and auto-applies |
| Share account view → another user applies | Other user sees same filtered result |
| Read-only user opens shared view | Cannot overwrite; only "Save as new" available |

---

## 19. COMMON FAILURE MODES

| Failure | Cause | Fix |
|---|---|---|
| Filter UI and API payload diverge | Manual JSON construction in components | Single translation layer (`querySerializer.js`) with strict schemas |
| Saved view applies but columns/layout don't match | Presentation state missing from saved payload | Include `visibleColumns`, `columnWidths`, `layoutMode` in `QueryState` |
| Dirty badge appears incorrectly | Ephemeral fields (rule IDs) included in comparison | Normalize and strip ephemeral fields before deep-compare |
| Deep links break across app versions | Query param format changed | Version the format (`v=2`) and keep a migration parser |
| Shared view overwritten accidentally | No concurrency check | Use `viewCreated` / version token during update; reject stale writes |
| Filter dropdown shows comma-joined user strings instead of individual users | Using pre-formatted display values | Source dropdown options from `_userCache` directly, not from record display strings |

---

## 20. END-TO-END FLOW SUMMARY

```
1. User opens page
   → URL parsed → queryState hydrated (or default)
   → Records fetched → fieldMetadata built from templates
   → FilterPanel renders with current rules

2. User adds/edits filter rules
   → queryState updates → isDirty recalculated
   → useFilteredRecords recomputes → graph re-renders with filtered nodes
   → URL updated (debounced)

3. User clicks "Save as View"
   → Name input → queryState serialized via toApiPayload()
   → POST /saved-views → API returns canonical TableConfiguration
   → selectedViewId set → baselineQueryState set → isDirty cleared

4. User selects a saved view
   → GET view's filter array → fromApiPayload() → queryState hydrated
   → baselineQueryState set → isDirty = false
   → Records re-filter → graph updates

5. User modifies saved view's filters
   → isDirty = true → Save button enabled
   → "Save" → POST /saved-views (update) → baseline reset
   → "Discard" → revert to baselineQueryState
```