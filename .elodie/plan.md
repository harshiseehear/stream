# Universal Search — Plan

## Current State

### Data Flow
1. **Login** → JWT stored in `sessionStorage` (`ishToken`)
2. **`useRecords()`** (hook) orchestrates all data loading:
   - `fetchUserNames()` → user ID-to-name cache (module-level `_userCache` in `formatFieldValue.js`)
   - `fetchModuleTemplates(23)` → array of templates (`uuid`, `recordLabel`, `recordCode`, `label`)
   - Per template (in parallel via `Promise.all`):
     - `fetchDefinition(uuid)` → field structure (`recordSectionDef[]`, `statusDef[]`)
     - `fetchInstances(uuid)` → actual record instances with `recordResps` (raw field data)
     - `fetchUserContainers(uuid)` → permission containers (uuid → label map)
   - `fetchHierarchyLevels()` → hierarchy labels (last level used as `containerLevelLabel`)
3. Records are transformed into display objects — raw `recordResps` values are run through `formatFieldValue()` which handles rich text extraction, date formatting, user ID resolution, selection objects, arrays, tasks, etc.

### Record Shape (output of `useRecords()`)
```js
{
  sid,                  // "CODE-123" (templateCode + incrementalSID)
  uuid,                 // instance UUID
  template,             // template/definition UUID
  templateLabel,        // human-readable template name
  fieldSections: [{     // visible sections only (sectionVisibility checked)
    sectionLabel,
    fields: [{ name, value, fieldType }]  // value = formatted display string
  }],
  recordLabel,          // instance label
  statusLabel,          // resolved from statusDef via statusResps.statusUUID
  statusColor,          // hex color from statusDef
  recordCreated,        // ISO datetime string
  lastUpdate,           // ISO datetime string
  createdByName,        // resolved via _userCache from recordCreatedActorId
  containerUUID,
  containerLabel,       // resolved via containerMap
  containerLevelLabel,  // e.g. "Container", from hierarchy levels
}
```

### Existing Filter System
- `useFilteredRecords(records, rules, conjunction)` — rule-based filter; resolves both static keys (e.g. `templateLabel`) and dynamic keys (`field::Name`) via `resolveFieldValue()`
- `nlFilter.js` — sends natural language to Gemini API, returns structured filter rules
- `filterSchema.js` — builds field metadata (keys, labels, categories, operators, possible values) from live records using `getAvailableFields()` + `getPossibleValues()`
- `FilterPanel.jsx` — chat input + manual rule builder in a `DraggablePanel`

### Theme System
- `theme/colors.js` exports reactive color tokens: `bgPage`, `textSecondary`, `borderPanel`, `textPlaceholder`, `dropdownHoverBg`, `dropdownText`, `controlActiveBackground`, etc.
- All components import colors directly from `theme/colors.js` (not via hooks)

---

## Universal Search Design

### Goal
A **Mac Spotlight-style** search overlay: `⌘K` opens a centered floating search bar. Typing shows a live-updating list of records whose field values match the query. Selecting a result pins the record on the graph.

### Architecture

```
⌘K (global shortcut)
    │
    ▼
SpotlightSearch (overlay component)
    │
    ├── Input field (auto-focused, debounced 150ms)
    │
    ▼
useUniversalSearch(records, debouncedQuery)     ← new hook
    │
    ├── Scans static fields:  sid, templateLabel, statusLabel,
    │   recordLabel, createdByName, containerLabel
    │
    └── Scans dynamic fields:  fieldSections[].fields[].value
    │   (skips "[Canvas]" and null values)
    │
    ▼
results[] — { record, matches: [{ field, snippet }] }
    │
    ▼
Result list (scrollable, keyboard-navigable)
    │
    ▼
onSelect(record) → pins record via existing setPinnedRecords
```

### Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useUniversalSearch.js` | **Create** | Core search logic — scans all record fields for query substring matches |
| `src/components/Search/SpotlightSearch.jsx` | **Create** | Spotlight overlay: backdrop, centered input, result list, keyboard nav |
| `src/pages/Home.jsx` | **Modify** | Add `⌘K` listener, manage spotlight open/close state, mount `SpotlightSearch`, pass records + pin callback |

---

### 1. `useUniversalSearch(records, query)` — Hook

```
Input:  records[]  (from useRecords, already loaded)
        query      (string)

Output: results[]  — { record, matches: [{ field, snippet }] }
```

**Logic:**
- If `query` trimmed length < 2 → return `[]`
- Lowercase the query once
- For each record:
  - Check static fields: `sid`, `templateLabel`, `statusLabel`, `recordLabel`, `createdByName`, `containerLabel`
  - Check dynamic fields: iterate `fieldSections[].fields[]`, use `f.name` as field label, `f.value` as searchable text
  - Skip values that are `null`, empty, or `"[Canvas]"`
  - Case-insensitive substring match: `String(value).toLowerCase().includes(query)`
  - For each match, build snippet: extract a window of ~60 chars around the match position
  - Collect all matches for the record
- If ≥1 match → include `{ record, matches }` in results
- Cap at **50 results** to keep the UI snappy
- Wrap in `useMemo([records, query])`

### 2. `SpotlightSearch.jsx` — Component

**Props:** `records`, `open`, `onClose`, `onSelect(record)`

**Internal state:**
- `query` — controlled input value
- `debouncedQuery` — debounced at 150ms (inline `useEffect` + `setTimeout`)
- `activeIndex` — keyboard-highlighted result index

**UI structure:**
```
<backdrop (semi-transparent, click to close)>
  <centered container (max-width ~560px, top ~20% of viewport)>
    <search input (large, auto-focused, ⌘K hint)>
    <result list (scrollable, max ~6 visible rows)>
      <result row>
        SID (bold) · Template (muted)
        "FieldName: ...matched sni[pp]et..." (match highlighted)
      </result row>
    </result list>
    <footer hint ("↑↓ navigate · ↵ select · esc close")>
  </centered container>
</backdrop>
```

**Keyboard handling:**
- `ArrowDown` / `ArrowUp` — move `activeIndex`, scroll into view
- `Enter` — select `results[activeIndex]`, call `onSelect(record)`, close
- `Escape` — close

**Styling:**
- Import colors from `theme/colors.js` (`bgPage`, `textSecondary`, `borderPanel`, `dropdownHoverBg`, `dropdownText`, `textPlaceholder`)
- Backdrop: `rgba(0,0,0,0.3)`, `position: fixed`, `inset: 0`, `z-index: 10000`
- Container: `bgPage` background, `borderPanel` border, rounded corners, subtle shadow
- Input: large font (16px), no border, transparent background, full width
- Result rows: 11-12px font, hover highlight with `dropdownHoverBg`
- Match highlight: bold or slightly different opacity on the matched substring

### 3. `Home.jsx` — Integration

```jsx
const [spotlightOpen, setSpotlightOpen] = useState(false)

// ⌘K global listener (in useEffect)
useEffect(() => {
  const handler = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setSpotlightOpen(o => !o)
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [])

// Pin callback (reuses existing setPinnedRecords)
const handleSearchSelect = (record) => {
  const pinned = {
    ...record,
    _pinId: `${record.sid}-${Date.now()}`,
    _pos: { x: 16, y: 16 },
  }
  setPinnedRecords(prev => [...prev, pinned])
  setSpotlightOpen(false)
}
```

Mount:
```jsx
<SpotlightSearch
  records={records}
  open={spotlightOpen}
  onClose={() => setSpotlightOpen(false)}
  onSelect={handleSearchSelect}
/>
```

---

### Implementation Order

1. **`src/hooks/useUniversalSearch.js`** — pure logic, no UI dependencies
2. **`src/components/Search/SpotlightSearch.jsx`** — overlay UI consuming the hook
3. **`src/pages/Home.jsx`** — wire ⌘K shortcut + mount component + pin callback

### Performance Notes

- Search is **fully client-side** — no API calls needed (records already fetched by `useRecords()`)
- Debounce input (150ms) to avoid filtering on every keystroke
- `useMemo` keyed on `[records, query]` prevents recalculation on unrelated re-renders
- Cap results at 50 — truncate with a "X more results…" hint
- No new dependencies required
