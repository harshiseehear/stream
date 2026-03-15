# Streamcell iOS Record Field Data Flow - Complete Documentation

## Overview
The Streamcell iOS application fetches, parses, and displays record fields and their values through a multi-layered architecture:
```
API → Models → View Models → Views
```

---

## 1. API LAYER - Data Fetching

### Primary Service: `RecordsService` 
Location: [Services/API/Sub Service/RecordsService.swift](Services/API/Sub%20Service/RecordsService.swift)

#### Key API Endpoints:

**A. Fetch Record Definition (Template)**
```swift
func getTemplate(recordDefUuid: String) async -> (success: RecordDef?, error: ScApiError?)
// Endpoint: GET https://records.{environmentDomain}/api/v1/definition/{recordDefUuid}
// Returns: RecordDef - Structure of all fields, sections, and capabilities
```

**B. Fetch Single Record Instance**
```swift
func getInstance(recordInstUuid: String) async -> (success: RecordInst?, error: ScApiError?)
// Endpoint: GET https://records.{environmentDomain}/api/v1/instance/{recordInstUuid}
// Returns: RecordInst - Complete record with all field values
```

**C. Fetch Multiple Record Instances**
```swift
func getInstancesFor(recordDefUuid: String) async -> (success: [RecordInst]?, error: ScApiError?)
// Endpoint: GET https://records.{environmentDomain}/api/v1/instances/{recordDefUuid}
// Returns: [RecordInst] - All instances for a record definition
```

**D. Update Field Value (Patch)**
```swift
func patchField(recordInstUuid: String, fieldDefUuid: String, newRecordResp: RecordResps) async -> ScApiError?
// Endpoint: PATCH https://records.{environmentDomain}/api/v1/instance/{recordInstUuid}/field/{fieldDefUuid}
// Request body: DataWrapper<RecordResps>
```

---

## 2. MODELS LAYER - Data Structures

### A. RecordDef (Record Definition/Template)
Location: [Models/Streamcell/RecordDef.swift](Models/Streamcell/RecordDef.swift)

**Structure:**
```swift
struct RecordDef: Codable {
    let uuid: String                           // Unique identifier for the record type
    let recordLabel: String                    // Display name (e.g., "Animal", "Sample")
    let recordCode: String                     // Code prefix (e.g., "ANI", "SAM")
    let recordStatus: StatusType
    let recordCreated: String
    let recordCreatedActor: Actor
    let lastUpdate: String
    let lastUpdateActor: Actor
    let statusDef: [RecordStatusDef]?          // Available status types
    let recordSectionDef: [RecordSectionDef]   // Sections containing fields
}
```

**Contains:**
- **RecordSectionDef**: Sections that organize fields
  - `uuid`: Unique section identifier
  - `sectionLabel`: Display name (e.g., "Basic Info", "Details")
  - `sectionFieldsDef`: [RecordFieldDef] - Fields in this section

- **RecordFieldDef**: Individual field definition
  - `uuid`: Unique field identifier
  - `fieldType`: FieldType enum (.text, .number, .date, .dropdown, .user, .scRecord, .smRecord, .task, .image, etc.)
  - `fieldLabel`: Display name
  - `attributes`: FieldDefAttributes - Configuration, validation, units, etc.

---

### B. RecordInst (Record Instance - The Actual Data)
Location: [Models/Streamcell/RecordInst.swift](Models/Streamcell/RecordInst.swift)

**Structure:**
```swift
struct RecordInst: Codable {
    let uuid: String                           // Unique record instance ID
    let recordDefUUID: String                  // Links to RecordDef
    let recordIncrementalSID: Int              // Sequential ID (e.g., ANI-001)
    let recordCreated: String                  // Creation timestamp
    let recordCreatedActor: Actor              // Who created it
    let lastUpdate: String                     // Last modification timestamp
    let lastUpdateActor: Actor                 // Who last modified it
    var containerUUID: String                  // Container/organization assignment
    var statusResps: RecordStatusResp?         // Current status
    var recordNotes: [RecordNotes]?            // Associated notes
    var attachments: [Attachment]?             // File attachments
    var recordResps: [String: RecordResps]     // *** FIELD VALUES (Map of fieldId → value)
    let taskRespsDerived: [String:TaskRespsDerived]?  // Derived task data
    var sectionVisibility: [String:Bool]       // Which sections are hidden
}
```

**Key Field:**
- `recordResps: [String: RecordResps]` — Dictionary mapping field UUIDs to their values

---

### C. RecordResps (Field Value Container)
Location: [Models/Streamcell/RecordInst.swift](Models/Streamcell/RecordInst.swift)

**The Generic Type-Safe Wrapper:**
```swift
struct RecordResps: Codable, Equatable {
    var value: Any?  // Holds the actual typed value
    
    // Custom codable to handle rich type detection
    // Decodes JSON and determines the field value type
}
```

**Supported Value Types in `RecordResps.value`:**

1. **String** - Text, TextArea, Number, Date, DateTime fields
   - Stored as plain `String` or converted from `Double`
   - Example: `"2026-03-15"`, `"Sample Name"`, `"42.5"`

2. **[Int]** - User field (list of user IDs)
   - Array of user IDs that have been assigned
   - Example: `[1, 5, 23]`

3. **RecordRespsSel** - Dropdown/Selection field
   ```swift
   struct RecordRespsSel: Codable {
       let sel: [String]      // Array of selected option IDs
       let selText: String    // Display text of selection
   }
   ```

4. **[RecordRespsTask]** - Task field (multi-row task list)
   ```swift
   struct RecordRespsTask: Codable {
       let uuid: String                          // Task row ID
       var taskRowDate: String?                  // Task due date
       var taskRowDone: Bool                     // Completion status
       var taskFieldsRespInst: [String : RecordResps]  // Fields in task row
   }
   ```

5. **[ExternalObject]** - SM Field (external database record fields)
   ```swift
   struct ExternalObject: Codable {
       let id: String                                    // Record ID
       let label: String                                // Display label
       let footer: String?                              // Footer text
       let subFields: [SubFieldTypes:ExternalSubFieldResp]  // Sub-fields
   }
   ```

6. **[RecordRespsScRecord]** - SC Field (linked Streamcell records)
   ```swift
   struct RecordRespsScRecord: Codable {
       let recordSID: String                    // Linked record SID
       let recordInstUUID: String               // Linked record instance UUID
       let subFieldResps: [String: RecordResps]?  // Linked record sub-fields
   }
   ```

7. **ImageResp** - Canvas/Image field
   ```swift
   struct ImageResp: Codable {
       let lines: [ImageRespLines]   // Drawing lines
       let points: [ImageRespPoints] // Annotation points
   }
   ```

8. **nil** - Empty/unset field

---

## 3. VIEW MODELS LAYER - Data Management & Binding

### StreamcellViewModel
Location: [View Models/StreamcellViewModel.swift](View%20Models/StreamcellViewModel.swift)

**Key Published Properties:**
```swift
@Published var templates: [String:RecordDef] = [:]              // Cached record definitions
@Published var recordInstances: [String:RecordInst] = [:]       // Cached instances (if stored)
```

**Key Methods:**

**A. Fetch Single Instance**
```swift
func getInstance(recordInstUuid: String) async -> RecordInst? {
    let instanceResponse = await RecordsService(ishToken: self.ishToken)
        .getInstance(recordInstUuid: recordInstUuid)
    // Handles error notifications if needed
    return instanceResponse.success
}
```

**B. Fetch Instances for Definition**
```swift
func getInstancesFor(recordDefUuid: String) async -> [RecordInst] {
    let instancesResponse = await RecordsService(ishToken: self.ishToken)
        .getInstancesFor(recordDefUuid: recordDefUuid)
    // Returns array of instances
}
```

**C. Update Field Value**
```swift
func patchField(recordInstUuid: String, fieldDefUuid: String, newRecordResp: RecordResps) async -> ResponseType {
    if let error = await RecordsService(ishToken: self.ishToken)
        .patchField(recordInstUuid: recordInstUuid, fieldDefUuid: fieldDefUuid, newRecordResp: newRecordResp) {
        // Handle error
        return .failure
    }
    return .success
}
```

**D. Create New Instance**
```swift
func postInstance(template: RecordDef, recordResps: [String:RecordResps], containerUuid: String, attachments: [Attachment]) async -> RecordInst? {
    let newInstance = RecordInst(recordDefUUID: template.uuid, recordResps: recordResps, attachments: attachments, containerUUID: containerUuid)
    let instanceResponse = await RecordsService(ishToken: self.ishToken).postInstance(recordInst: newInstance)
    // Creates notification on success
    return instanceResponse.success
}
```

---

## 4. VIEWS LAYER - UI Rendering

### A. RecordDetailParentView
Location: [Views/Record Instance/RecordDetailView.swift](Views/Record%20Instance/RecordDetailView.swift)

**Purpose:** Parent container that:
1. Fetches the `RecordInst` by UUID
2. Loads the `RecordDef` (template)
3. Checks user permissions
4. Polls for remote changes every 10 seconds

**Flow:**
```swift
struct RecordDetailParentView: View {
    @EnvironmentObject var streamcellViewModel: StreamcellViewModel
    let recordInstUuid: String
    @State private var recordInst: RecordInst?
    
    func findRecordInst() {
        Task {
            // 1. Fetch instance from API via view model
            guard let recordInst = await streamcellViewModel.getInstance(recordInstUuid: recordInstUuid) else { return }
            
            // 2. Update the template if needed
            await streamcellViewModel.updateTemplate(recordDefUuid: recordInst.recordDefUUID)
            
            // 3. Find first visible section and display RecordDetailView
            self.recordInst = recordInst
        }
    }
}
```

---

### B. RecordDetailView
Location: [Views/Record Instance/RecordDetailView.swift](Views/Record%20Instance/RecordDetailView.swift)

**Purpose:** Main UI that displays record data with multiple tabs

**Tab Structure:**
```
1. Details (compact mode only) - Status, container, key fields
2. Fields  - All record fields organized by sections
3. Notes   - RecordNotes list
4. Attachments - File attachments
5. History - Audit trail of changes
```

**Receives:**
```swift
struct RecordDetailView: View {
    let recordDef: RecordDef                    // Template defining structure
    @Binding var recordInst: RecordInst        // Current record data (bindable)
    @Binding var openedSectionUuid: String     // Currently open section
    @Binding var selectedTab: RecordDetailFocusType  // Active tab
}
```

---

### C. RecordInstanceFormView
Location: [Views/Record Instance/RecordInstanceFormView.swift](Views/Record%20Instance/RecordInstanceFormView.swift)

**Purpose:** Renders form to display/edit record fields

**Structure:**
```swift
struct RecordInstanceFormView: View {
    let recordDef: RecordDef
    @Binding var recordResps: [String: RecordResps]   // Bindable field values
    
    var body: some View {
        ForEach(recordDef.recordSectionDef) { section in
            // Display section header
            if openedSection == section.uuid {
                ForEach(section.sectionFieldsDef) { field in
                    // Create field input view
                    RecordRespInputView(
                        recordResp: Binding(get: { recordResps[field.uuid] },
                                          set: { recordResps[field.uuid] = $0 }),
                        fieldDef: field,
                        // ... other parameters
                    )
                }
            }
        }
    }
}
```

---

### D. RecordRespInputView
Location: [Views/Inputs/](Views/Inputs/)

**Purpose:** Renders a single field input based on field type

**Maps FieldType to UI Component:**
- `.text` → TextField
- `.number` → NumberInput
- `.date` → DatePicker
- `.dropdown` → Picker
- `.user` → UserSelector
- `.image` → Canvas
- `.scRecord` → LinkedRecordPicker
- `.smRecord` → ExternalObjectPicker
- `.task` → TaskTable
- etc.

**Updates:** Binds changes back to `recordResps[fieldUuid]` which triggers `patchField` API call

---

## 5. COMPLETE DATA FLOW EXAMPLE

### Scenario: Display a Record with Fields

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER NAVIGATION                                      │
│ Taps on record with UUID: "abc-123-def"                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. RecordDetailParentView.findRecordInst()              │
│ Calls: streamcellViewModel.getInstance("abc-123-def")   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. StreamcellViewModel.getInstance()                    │
│ Creates RecordsService and calls:                       │
│ RecordsService.getInstance(recordInstUuid:)             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. RecordsService (API Layer)                           │
│ Makes HTTP GET to:                                      │
│ /api/v1/instance/abc-123-def                           │
│                                                          │
│ Response JSON:                                          │
│ {                                                       │
│   "data": {                                             │
│     "uuid": "abc-123-def",                             │
│     "recordDefUUID": "record-def-1",                   │
│     "recordIncrementalSID": 5,                         │
│     "recordResps": {                                    │
│       "field_name_uuid": {                             │
│         "value": "John Doe"                            │
│       },                                                │
│       "field_age_uuid": {                              │
│         "value": "42"                                  │
│       },                                                │
│       "field_status_uuid": {                           │
│         "value": {                                      │
│           "sel": ["opt-1"],                            │
│           "selText": "Active"                          │
│         }                                               │
│       }                                                 │
│     },                                                  │
│     "statusResps": {...},                              │
│     "containerUUID": "container-1"                     │
│   }                                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. JSON Parsing to RecordInst Model                     │
│                                                          │
│ Custom Decoder in RecordInst:                           │
│ - Normalizes JSON keys (strips "field" prefix)         │
│ - Decodes recordResps to proper types                  │
│ - RecordResps.init() detects value type:               │
│   - String? → String                                    │
│   - [Int]? → [Int]                                      │
│   - {...sel, selText}? → RecordRespsSel                │
│   - [...]? → [RecordRespsTask]                         │
│   - etc.                                                │
│                                                          │
│ Result: RecordInst object with typed values            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. View Model Updates & Caches                          │
│                                                          │
│ Updates:                                                │
│ - templates[recordDefUUID] = recordDef (if needed)      │
│                                                          │
│ Returns RecordInst to RecordDetailParentView            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. RecordDetailParentView State Update                  │
│                                                          │
│ @State var recordInst = receivedInstance                │
│ Triggers view refresh                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 8. RecordDetailView Renders                             │
│                                                          │
│ Receives:                                               │
│ - recordDef: template with field definitions            │
│ - recordInst Binding: current data                      │
│                                                          │
│ Displays tabs: Details, Fields, Notes, Attachments...   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 9. RecordInstanceFormView Renders Fields                │
│                                                          │
│ For each section in recordDef.recordSectionDef:         │
│   For each field in section.sectionFieldsDef:           │
│     - Get value: recordInst.recordResps[field.uuid]     │
│     - Create binding to field value                     │
│     - Render appropriate input component                │
│                                                          │
│ Example Display:                                        │
│ ┌────────────────────────────────────────┐              │
│ │ Basic Information                      │              │
│ ├────────────────────────────────────────┤              │
│ │ Name: [John Doe]                       │ ← Text      │
│ │ Age: [42]                              │ ← Number    │
│ │ Status: [Active ▼]                     │ ← Dropdown  │
│ └────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

### Scenario: User Edits a Field

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                          │
│ User types new value in Name field: "Jane Doe"          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. RecordRespInputView Binding Update                   │
│                                                          │
│ onChange: { newValue in                                 │
│     recordResps[field.uuid] = RecordResps(value: newValue)  │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. RecordInstanceFormView Updates Dictionary            │
│                                                          │
│ @Binding var recordResps: [String: RecordResps]         │
│                                                          │
│ recordResps["name_field_uuid"] = RecordResps(value: "Jane Doe")  │
│                                                          │
│ Binding propagates to RecordDetailView                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. RecordDetailView Updates recordInst                  │
│                                                          │
│ @Binding var recordInst: RecordInst                     │
│ recordInst.recordResps["name_field_uuid"] = new value   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Trigger API Update                                   │
│                                                          │
│ (Optional) User taps Save/Submit button                 │
│                                                          │
│ streamcellViewModel.patchField(                         │
│     recordInstUuid: recordInst.uuid,                    │
│     fieldDefUuid: "name_field_uuid",                   │
│     newRecordResp: RecordResps(value: "Jane Doe")       │
│ )                                                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. RecordsService API Call                              │
│                                                          │
│ PATCH /api/v1/instance/abc-123-def/field/name_uuid    │
│                                                          │
│ Request body:                                           │
│ {                                                       │
│   "data": {                                             │
│     "value": "Jane Doe"                                 │
│   }                                                     │
│ }                                                       │
│                                                          │
│ Response: Success or Error                              │
└─────────────────────────────────────────────────────────┘
```

---

## 6. KEY FIELD TYPES & VALUE STRUCTURES

### Simple Types (String-based)
- **Text Field**: `RecordResps(value: "Sample Text")`
- **Textarea**: `RecordResps(value: "Multi-line\ntext")`
- **Number**: `RecordResps(value: "42.5")`
- **Date**: `RecordResps(value: "2026-03-15")`
- **DateTime**: `RecordResps(value: "2026-03-15T14:30:00Z")`

### Complex Types

**Dropdown (Single/Multi-select):**
```swift
RecordResps(value: RecordRespsSel(
    sel: ["option-uuid-1", "option-uuid-2"],
    selText: "Option 1; Option 2"
))
```

**User Assignment:**
```swift
RecordResps(value: [1, 5, 23])  // Array of user IDs
```

**Task (Multi-row):**
```swift
RecordResps(value: [
    RecordRespsTask(
        uuid: "task-1",
        taskRowDate: "2026-04-15",
        taskRowDone: false,
        taskFieldsRespInst: [
            "task-field-1": RecordResps(value: "Subtask 1"),
            "task-field-2": RecordResps(value: "In Progress")
        ]
    ),
    // ... more rows
])
```

**External Object / SM Field:**
```swift
RecordResps(value: [
    ExternalObject(
        id: "animal-12345",
        label: "Mouse A",
        footer: nil,
        subFields: [
            .AGENOW: ExternalSubFieldResp(externalValue: "3 weeks"),
            .ASEX: ExternalSubFieldResp(externalValue: "Male"),
            // ... other subfields
        ]
    )
])
```

**SC Record (Linked Streamcell Records):**
```swift
RecordResps(value: [
    RecordRespsScRecord(
        recordSID: "ANI-123",
        recordInstUUID: "linked-record-uuid",
        subFieldResps: [
            "subfield-uuid-1": RecordResps(value: "Subfield Value"),
            // ... other subfields from linked record
        ]
    )
])
```

**Image/Canvas:**
```swift
RecordResps(value: ImageResp(
    lines: [...ImageRespLines...],
    points: [...ImageRespPoints...]
))
```

---

## 7. KEY FILES SUMMARY

| File | Purpose |
|------|---------|
| Services/API/Sub Service/RecordsService.swift | API endpoint calls for records |
| Models/Streamcell/RecordDef.swift | Record templates and field definitions |
| Models/Streamcell/RecordInst.swift | Record instances, field values, response structures |
| Models/External Object/ExternalObject.swift | External object models (SM Fields) |
| View Models/StreamcellViewModel.swift | Central view model for data management |
| Views/Record Instance/RecordDetailView.swift | Main record display view |
| Views/Record Instance/RecordInstanceFormView.swift | Form to display/edit fields |
| Views/Inputs/ | Individual field input components |
| Views/Cells/MasterCellView.swift | Cell rendering for tables |

---

## 8. IMPORTANT IMPLEMENTATION DETAILS

### Key Normalization Logic
RecordInst custom decoder strips "field" and "task" prefixes during decoding:
```swift
if key.hasPrefix("field") {
    let stripped = String(key.dropFirst(5))
    normalized[stripped] = value
}
```

### Type Detection in RecordResps
The custom decoder tries each type in order:
1. ImageResp (if valid JSON image object)
2. String (text, textarea, number, date, datetime)
3. Double (failsafe for numbers)
4. [Int] (users)
5. RecordRespsSel (dropdowns)
6. [RecordRespsTask] (tasks)
7. [ExternalObject] (SM fields)
8. [RecordRespsScRecord] (SC fields)

### Polling for Changes
RecordDetailParentView polls `getInstance()` every 10 seconds to detect remote changes and refresh UI if `lastUpdate` timestamp differs.

### Permissions Management
- Cached in `streamcellViewModel.accessPermissionSummary`
- Keyed by RecordDef UUID
- Controls: view, edit, addNote, addFileAttachment, progress, transfer, sectionVisibility

---

## 9. EXAMPLE COMPLETE FLOW SEQUENCE

1. **User triggers navigation** → RecordDetailParentView loads
2. **View appears** → Calls `findRecordInst()` → Async fetch via view model
3. **View model calls API** → RecordsService.getInstance() makes network request
4. **Server responds** → JSON with all record data + field values
5. **JSON decoded** → RecordInst model parses JSON with custom decoders
6. **Field value detection** → RecordResps determines type of each field value
7. **State updated** → @State var recordInst receives data
8. **RecordDetailView renders** → Passes recordDef (template) + recordInst (data)
9. **RecordInstanceFormView iterates** → For each field in template, gets value from recordInst.recordResps
10. **Bindings created** → Two-way binding between UI component and recordResps dictionary
11. **User edit** → onChange event triggers binding update
12. **Optional API sync** → patchField() uploads change to server
13. **Polling continues** → Every 10s checks for remote changes from other users

---

## 10. RECORD DETAIL PARSING — FIELD-BY-FIELD BREAKDOWN

This section documents exactly how each field type's raw API value is parsed, stored, and rendered for display.

---

### A. Date & DateTime Fields

**Storage:** ISO 8601 string in `RecordResps.value` (type `String`)
```
Date:     "2026-03-15T00:00:00.000Z"
DateTime: "2026-03-15T14:30:00.000Z"
```

**Parsing Pipeline:**
1. `RecordResps.init(from:)` decodes as `String` (second decode attempt, after ImageResp check)
2. `DateService.getDate(from:)` converts the ISO string → `Date` using 3 strategies:
   - `ISO8601DateFormatter` (without fractional seconds)
   - `ISO8601DateFormatter` with `.withFractionalSeconds`
   - `NSDataDetector`-based natural language fallback (e.g. "tomorrow", "next week")

**Display Formatting:**
- `StreamcellViewModel.dateDisplayFrom(dateString:includeTime:)` resolves the user's date format from the JWT token's `df` claim (e.g. `"d MMM y"` → "15 Mar 2026")
- Normalizes the format string: replaces `"-"` with `" "`, `"mm"` with `"MMM"`, `"dd"` with `"d"`
- Appends `", HH:mm"` when `includeTime: true` (datetime fields)
- Delegates to `DateService.displayDateAsString(from:format:includeTime:)`

**Encoding (back to API):**
- `DateService.encodeDate(from:)` → `ISO8601DateFormatter` with `.withFractionalSeconds`
- Result: `"2026-03-15T14:30:00.000Z"`

**Input Component:** `DateInputView`
- Parses ISO string → `Date` on init for SwiftUI `DatePicker`
- Date-only fields: `DatePicker` with `.date` components
- DateTime fields: `DatePicker` with `.date` + `.hourAndMinute`, plus separate `.wheel`-style time picker
- Equality check: date-only compares year/month/day; datetime compares to minute precision

**Table Cell Display:** `MasterCellView` → calls `streamcellViewModel.dateDisplayFrom(dateString:)`

**Filter Comparisons:** `TableFilterService.compareDate()`
- `.date` fields: strips time via `calendar.startOfDay(for:)` for `.before`/`.after`
- `.datetime` fields: time-sensitive `<`/`>` comparisons
- `.on`/`.notOn`: uses `calendar.isDate(_:inSameDayAs:)`

**Calendar View:** `CustomCalendarView` normalizes dates to start-of-day for grouping, uses `Locale.current` for weekday headers, displays as `"EEEE, MMMM d"` (e.g. "Monday, March 15")

**Key Files:**
| File | Role |
|------|------|
| [Services/App/DateService.swift](Services/App/DateService.swift) | Central parsing/formatting service |
| [Views/Inputs/Individual inputs/DateInputView.swift](Views/Inputs/Individual%20inputs/DateInputView.swift) | Date/DateTime picker input |
| [View Models/StreamcellViewModel.swift](View%20Models/StreamcellViewModel.swift) | User-localized date format via JWT |
| [Services/App/TableFilterService.swift](Services/App/TableFilterService.swift) | Date comparison for table filters |

---

### B. User Fields (User Names)

**Storage:** Array of integer user IDs in `RecordResps.value` (type `[Int]`)
```json
[1, 5, 23]
```

**Parsing Pipeline:**
1. `RecordResps.init(from:)` decodes as `[Int]` (4th decode attempt)
2. User IDs are resolved to names at display time — never stored as strings

**User Resolution:**
- `StreamcellViewModel.users: [Int: SmUser]` — in-memory cache of all users
- Loaded on app startup via `getAllUsers()` → `SMDBService.getAllUsers(customerID:)`
- `SmUser` model:
  ```swift
  struct SmUser: Codable {
      let user_id: Int
      let first_name: String
      let last_name: String
      let active_status: StatusType
      var wrappedFullName: String { first_name + " " + last_name }
  }
  ```

**Display — Table Cells:** `MasterCellView` → `UserCellView(userId:)`
- Renders colored circle with user initials (first letter of first name + first letter of last name)
- Circle color derived from `userToColor(userId)` with auto-contrast text (light/dark)
- Tap reveals `UserFullNameView` popover showing full name
- Supports single user (`Int`), multi-user (`[Int]`), and nested arrays (`[[Int]]`)

**Display — String Representation:** `DisplayValueService.getDisplayValue(for:fieldType:)`
- Maps each `Int` → `"\(user.first_name) \(user.last_name)"` via `getUserDisplayName(userId:)`
- Multiple users joined with `", "`
- Falls back to the raw user ID as string if user not found in cache

### FB-14 Quick Fix: Show assignee name (not `User #27690`)

If a response payload contains only a numeric assignee ID (example: `27690`), resolve it through the same user cache used by user fields.

1. Ensure users are loaded before rendering assignee text:
```swift
await streamcellViewModel.getAllUsers()
```

2. Resolve ID → full name from `streamcellViewModel.users`:
```swift
func assigneeDisplayName(for userId: Int?, users: [Int: SmUser]) -> String {
    guard let userId else { return "Unassigned" }
    guard let user = users[userId] else { return "User #\(userId)" }
    return user.wrappedFullName
}
```

3. Use the resolver when rendering quick-fix feedback cards/details:
```swift
Text(assigneeDisplayName(for: feedback.assigneeId, users: streamcellViewModel.users))
```

Notes:
- The fallback `User #<id>` should only appear if the user cache has not loaded yet or the ID does not exist.
- This keeps behavior consistent with `DisplayValueService.getUserDisplayName(userId:)` and `UserCellView`.

**Actor Display:** Record metadata (`recordCreatedActor`, `lastUpdateActor`) uses the same system
- `Actor` struct: `{ id: Int, type: ActorType }` where `ActorType` is `.user` or `.workflow`
- Decoded from flat JSON keys: `recordCreatedActorId` + `recordCreatedActorType` → composed into `Actor`
- Workflows display as "Workflow Bot" instead of user initials

**Input Component:** `UserInputView`
- Renders `CustomDropdownInputView` listing all users from `streamcellViewModel.userList()` (sorted by first name)
- Groups by `active_status` — archived users shown with lower opacity and archive icon
- Searchable by `wrappedFullName`
- Updates binding with selected user ID array

**Key Files:**
| File | Role |
|------|------|
| [Models/X - Other/SmUser.swift](Models/X%20-%20Other/SmUser.swift) | User model |
| [Models/X - Other/Actor.swift](Models/X%20-%20Other/Actor.swift) | Actor struct (id + type) |
| [Enums/Audit/ActorType.swift](Enums/Audit/ActorType.swift) | USER / PROCESS_WORKFLOW enum |
| [View Models/StreamcellViewModel.swift](View%20Models/StreamcellViewModel.swift) | User cache & resolution |
| [Views/Cells/Individual cells/UserCellView.swift](Views/Cells/Individual%20cells/UserCellView.swift) | Initials circle display |
| [Views/Cells/Individual cells/UserFullNameView.swift](Views/Cells/Individual%20cells/UserFullNameView.swift) | Full name popover |
| [Views/Inputs/Individual inputs/UserInputView.swift](Views/Inputs/Individual%20inputs/UserInputView.swift) | User selection input |
| [Services/App/DisplayValueService.swift](Services/App/DisplayValueService.swift) | String conversion for exports/display |

---

### C. Rich Text (TipTap / Textbox) Fields

**Storage:** Serialized TipTap JSON string in `RecordResps.value` (type `String`)
```json
"{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Hello world\"}]}]}"
```

**Parsing Pipeline:**
1. `RecordResps.init(from:)` decodes as `String` (same as text/number/date — the JSON is stored as a plain string value)
2. At display time, `TipTapParsingService.parse(from:)` converts the JSON string → `TipTapDocument`:
   - First tries to decode as `VersionedResponse` (multiple content versions with metadata)
   - Falls back to direct `JSONDecoder().decode(TipTapDocument.self, from:)`
3. `TipTapParsingService.convertToAttributedString(content:)` walks the node tree → native SwiftUI `AttributedString`

**No HTML is used.** The entire rendering pipeline is JSON → `TipTapDocument` → `AttributedString`.

**TipTap Document Structure:**
```
TipTapDocument
  ├── type: .doc
  └── content: [TipTapNode]
       ├── type: .paragraph / .heading / .table / .blockquote / .orderedList / .bulletList / ...
       ├── content: [TipTapNode]?  (nested nodes)
       ├── text: String?            (leaf text content)
       ├── marks: [TipTapMark]?     (formatting: bold, italic, underline, strike, link, textStyle, highlight, etc.)
       └── attrs: TipTapAttributes? (heading level, table cell spans, mention IDs, record links, dates, images, etc.)
```

**Supported Node Types:** `doc`, `heading`, `paragraph`, `text`, `table`, `tableRow`, `tableHeader`, `tableCell`, `horizontalRule`, `blockquote`, `orderedList`, `bulletList`, `taskList`, `listItem`, `taskItem`, `mention`, `recordLink`, `imageResize`, `date`, `datetime`, `fileLink`, `hardBreak`

**Supported Mark Types:** `bold`, `italic`, `underline`, `strike`, `subscript`, `superscript`, `textStyle` (color), `highlight` (background color), `link`

**Mark Application:**
```swift
.bold       → .font = .body.bold()
.italic     → .font = .body.italic()
.underline  → .underlineStyle = .solid
.strike     → .strikethroughStyle = .solid
.link       → .link = URL(string: href)
.textStyle  → .foregroundColor = Color(hex: color)
.highlight  → .backgroundColor = Color(hex: color)
```

**Versioned Content:** Rich text can be stored with version history via `VersionedResponse`:
```swift
struct VersionedResponse: Codable {
    let uuid: String
    let versions: [Version]  // Ordered versions
}
struct Version: Codable {
    let version: Int
    let content: String       // TipTap JSON string
    let contentCreatedUser: Int
    let contentCreated: String
}
```

**Input Component:** `RichTextInputView` → `MarkedDownTextView`
- Editing produces plain text, converted to TipTap JSON on focus-lost via `TipTapDocument(plainText:)` → `.toJsonString()`
- Plain text init wraps text in `doc > paragraph > text` node structure

**Table Cell Display:** `TextboxCellView` → `MarkedDownTextView`
- Single-line mode for compact table rows
- Tap reveals full rich text in popover

**String Representation:** `DisplayValueService` extracts first text node: `parsed.content.first?.content?.first?.text`

**Key Files:**
| File | Role |
|------|------|
| [Models/Streamcell/TipTapDocument.swift](Models/Streamcell/TipTapDocument.swift) | TipTap document model (nodes, marks, attributes) |
| [Services/App/TipTapService.swift](Services/App/TipTapService.swift) | JSON → TipTapDocument → AttributedString |
| [Views/TipTap/MarkedDownTextView.swift](Views/TipTap/MarkedDownTextView.swift) | SwiftUI rich text display |
| [Views/Inputs/Individual inputs/RichTextInputView.swift](Views/Inputs/Individual%20inputs/RichTextInputView.swift) | Rich text editing input |
| [Views/Cells/Individual cells/TextboxCellView.swift](Views/Cells/Individual%20cells/TextboxCellView.swift) | Table cell display |

---

### D. Text Fields

**Storage:** Plain string in `RecordResps.value` (type `String`)
```
"Sample Name"
```

**Parsing:** `RecordResps.init(from:)` decodes as `String` (second attempt after ImageResp)

**Display:** Direct string rendering. `DisplayValueService` returns the string as-is. Also handles `[String]` arrays (returns first element).

**Input Component:** `TextInputView` with standard `TextField`

---

### E. Number Fields

**Storage:** String representation in `RecordResps.value` (type `String`)
```
"42.5"
```

**Parsing Pipeline:**
1. `RecordResps.init(from:)` first tries `String` decode
2. If that fails, tries `Double` decode and converts to `String(result)` — this handles bare numeric JSON values

**Unit Display:** Units from `FieldDefAttributes.unit` (e.g. "kg", "cm") are passed via `@Environment(\.inputUnit)` and rendered alongside the number value with reduced opacity

**Input Component:** `NumberInputView` with `.decimalPad` keyboard type

**Display:** `DisplayValueService` returns the string as-is

---

### F. Dropdown / Multi-Dropdown Fields

**Storage:** `RecordRespsSel` struct in `RecordResps.value`
```swift
RecordRespsSel(
    sel: ["option-uuid-1", "option-uuid-2"],  // Selected option UUIDs
    selText: "Option 1; Option 2"              // Display text
)
```

**Parsing:** `RecordResps.init(from:)` decodes as `RecordRespsSel` (5th attempt) — a simple Codable struct with `sel: [String]` and `selText: String`

**Display:** `DisplayValueService` resolves each UUID via `selectableValues[uuid].valueLabel` dictionary lookup and joins with `", "`

**Input Component:** `SelectableValueInputView` → `CustomDropdownInputView`
- Loads selectable values from the field's list UUID
- Single-select vs multi-select controlled by `FieldType` (.dropdown vs .multiDropdown)

---

### G. SC Record Fields (Linked Streamcell Records)

**Storage:** `[RecordRespsScRecord]` array in `RecordResps.value`
```swift
RecordRespsScRecord(
    recordSID: "ANI-123",           // Linked record's display SID
    recordInstUUID: "linked-uuid",  // Linked record's instance UUID
    subFieldResps: [                // Optional sub-field values
        "subfield-uuid": RecordResps(value: "Sub Value")
    ]
)
```

**Parsing — Key Normalization:**
- `subFieldResps` arrives from API as an **array of dictionaries** `[[String: RecordResps]]`
- Flattened into a single dictionary
- Keys stripped of `"subField"` prefix (8 characters)
- On encode, converted back to array-of-dicts with `"subField"` prefix restored

**Display:** `DisplayValueService` maps to `recordSID` values joined with `", "`

**Input Component:** `SCFieldInputView`

---

### H. SM Record Fields (External Objects — SoftMouse, etc.)

**Storage:** `[ExternalObject]` array in `RecordResps.value`
```swift
ExternalObject(
    id: "12345",                              // External ID (String or Int in JSON)
    label: "Mouse A",                         // Display label (decoded from "sid" key)
    footer: nil,
    subFields: [                              // Keyed by SubFieldTypes enum
        .AGENOW: ExternalSubFieldResp("3 weeks"),
        .ASEX: ExternalSubFieldResp("Male")
    ]
)
```

**Parsing — Special Behaviors:**
- `id` field: tries `String` first, falls back to `Int` → `String(intID)` (handles mixed API responses)
- `label` is decoded from the JSON key `"sid"` (not `"label"`)
- `subFieldResps`: tries array-of-dicts format (legacy SM Animal) first, then direct dict (SM Cage)
- Sub-field keys stripped of `"subField"` prefix → converted to `SubFieldTypes` enum

**ExternalSubFieldResp:** Wraps `Any?` — decodes as `String`, `Int`, or `SubFieldCompositeResp` (struct with `id: Int?` and `value: String?`). Has `.stringValue` computed property for uniform access.

**External Object Types:** `ExternalObjectType` enum — `.animal`, `.cage`, `.mgiStrain`, `.mgiGene`, `.publication` — each with a `link(id:)` method generating the appropriate external URL

**Display:** `DisplayValueService` maps to `.label` values joined with `", "`

**Input Component:** `ExternalObjectInputView`

---

### I. Task Fields (Multi-Row Task Lists)

**Storage:** `[RecordRespsTask]` array in `RecordResps.value`
```swift
RecordRespsTask(
    uuid: "task-row-1",
    taskRowDate: "2026-04-15T00:00:00Z",      // Optional due date
    taskRowDone: false,                         // Completion checkbox
    taskFieldsRespInst: [                       // Nested field values
        "subfield-uuid": RecordResps(value: "Subtask text")
    ]
)
```

**Parsing — Key Normalization:**
- `taskFieldsRespInst` keys stripped of `"field"` prefix during decode
- Re-prefixed with `"field"` during encode
- Each sub-field value is itself a `RecordResps` (recursive parsing)

**Key Prefix Logic (RecordInst encode):**
- During encoding, the system determines the prefix from the value type:
  - `[RecordRespsTask]` → prefix `"task"`
  - All other types → prefix `"field"`

**Derived Task Data:** `TaskRespsDerived` stores computed `last` and `next` task values (e.g. last completed, next due), also with `"field"` key normalization

**Input Component:** `TaskTableView`

---

### J. Canvas / Image Fields

**Storage:** `ImageResp` struct in `RecordResps.value`, but **double-encoded** as a JSON string
```
"{\"lines\":[...],\"width\":300,\"height\":200}"
```

**Parsing — Double Encoding:**
1. `RecordResps.init(from:)` first tries `String` decode
2. Then tries to parse that string as JSON into `ImageResp` — this is the **first** decode attempt, checked before plain string
3. If the string successfully decodes to `ImageResp`, it's stored as an `ImageResp` object (not string)

**ImageResp Structure:**
```swift
struct ImageResp: Codable, Equatable {
    var lines: [ImageRespLines]  // Drawing strokes
    let width: Double
    let height: Double
}
struct ImageRespLines: Codable, Equatable {
    let points: [ImageRespPoints]  // Path points
    let brushColor: Color          // Decoded from hex string via Color(hex:)
    let brushRadius: Int
}
struct ImageRespPoints: Codable, Equatable {
    let x: Double
    let y: Double
    var cgPoint: CGPoint { CGPoint(x: x, y: y) }
    // Encodes with coordinates rounded to 2 decimal places
}
```

**Encoding:** `ImageResp` → JSON string → encoded as string value (re-double-encodes). Brush colors converted back to hex via `.toHex()`

**Input Component:** `CanvasInputView`

---

### K. Status Fields

**Storage:** `RecordStatusResp` struct (on `RecordInst.statusResps`, not in `recordResps` dictionary)
```swift
RecordStatusResp(statusUUID: "status-uuid-1", statusLabel: "Active")
```

**Resolution:** `RecordStatusDef` definitions on `RecordDef.statusDef` provide label, color (hex → `Color(hex:)`), and state (`StatusType` enum)

**Display:** `DisplayValueService` resolves UUID → label via `statusDefs.first(where:)`

---

## 11. FIELD TYPE ROUTING — COMPLETE MAPPING

`RecordRespInputView` routes each `FieldType` to its specific input component:

| FieldType | Input Component | RecordResps Value Type |
|-----------|----------------|----------------------|
| `.date` | `DateInputView` | `String` (ISO 8601) |
| `.datetime` | `DateInputView` | `String` (ISO 8601) |
| `.number` | `NumberInputView` | `String` |
| `.user` | `UserInputView` (single) | `[Int]` |
| `.multiUser` | `UserInputView` (multi) | `[Int]` |
| `.dropdown` | `SelectableValueInputView` (single) | `RecordRespsSel` |
| `.multiDropdown` | `SelectableValueInputView` (multi) | `RecordRespsSel` |
| `.textfield` | `TextInputView` | `String` |
| `.textbox` | `RichTextInputView` | `String` (TipTap JSON) |
| `.image` | `CanvasInputView` | `ImageResp` (double-encoded JSON string) |
| `.smRecord` / `.multiSmRecord` | `ExternalObjectInputView` | `[ExternalObject]` |
| `.scRecord` / `.multiScRecord` | `SCFieldInputView` | `[RecordRespsScRecord]` |
| `.task` | `TaskTableView` | `[RecordRespsTask]` |
| `.node` / `.status` / `.actor` | `EmptyView` | N/A |

---

## 12. RecordResps TYPE DETECTION ORDER

`RecordResps.init(from decoder:)` attempts decoding in this exact sequence:

```
1. nil                           → value = nil
2. String → ImageResp (JSON)     → value = ImageResp (double-encoded canvas data)
3. String                        → value = String (text, textbox, number, date, datetime)
4. Double → String               → value = String (number fallback)
5. [Int]                         → value = [Int] (user field)
6. RecordRespsSel                → value = RecordRespsSel (dropdown)
7. [RecordRespsTask]             → value = [RecordRespsTask] (task)
8. [ExternalObject]              → value = [ExternalObject] (SM record)
9. [RecordRespsScRecord]         → value = [RecordRespsScRecord] (SC record)
```

**Important:** The order matters — `String` is checked before `[Int]` so that numeric strings (numbers, dates) are captured as strings, not arrays. `ImageResp` is checked first by parsing the string as JSON, so canvas data doesn't get stored as a plain string.

---

## 13. KEY NORMALIZATION PATTERNS

All key normalization follows the same pattern across the codebase:

| Context | Decode (strip prefix) | Encode (add prefix) |
|---------|----------------------|---------------------|
| `RecordInst.recordResps` | Strip `"field"` (5 chars) or `"task"` (4 chars) | Add `"field"` or `"task"` based on value type |
| `RecordRespsTask.taskFieldsRespInst` | Strip `"field"` (5 chars) | Add `"field"` |
| `TaskRespsDerived.last` / `.next` | Strip `"field"` (5 chars) | Add `"field"` |
| `RecordInst.taskRespsDerived` | Strip `"task"` (4 chars) | Add `"task"` |
| `RecordRespsScRecord.subFieldResps` | Array-of-dicts → flat dict, strip `"subField"` (8 chars) | Flat dict → array-of-dicts, add `"subField"` |
| `ExternalObject.subFieldResps` | Array-of-dicts or dict → strip `"subField"` (8 chars) → `SubFieldTypes` enum | Add `"subField"` + `.rawValue` |

---

## 14. DISPLAY VALUE SERVICE — COMPLETE FIELD MAP

`DisplayValueService.getDisplayValue(for:fieldType:)` converts raw values to display strings:

| FieldType | Input Type | Output |
|-----------|-----------|--------|
| `.textfield` | `String` or `[String]` | String as-is (first element if array) |
| `.textbox` | `String` (TipTap JSON) | First text node extracted from parsed TipTap, or raw string fallback |
| `.number` | `String` or `[String]` | String as-is (first element if array) |
| `.date` | `String` (ISO 8601) | `DateService.displayDateAsString(from:)` with default `"d MMM y"` |
| `.datetime` | `String` (ISO 8601) | `DateService.displayDateAsString(from:includeTime: true)` |
| `.user` / `.multiUser` | `Int` or `[Int]` | `"FirstName LastName"` per ID, joined with `", "` |
| `.dropdown` / `.multiDropdown` | `RecordRespsSel` | UUID → label lookup, joined with `", "` |
| `.status` | `RecordStatusResp` | UUID → label lookup from `statusDefs` |
| `.scRecord` / `.multiScRecord` | `[RecordRespsScRecord]` | `.recordSID` values joined with `", "` |
| `.smRecord` / `.multiSmRecord` | `[ExternalObject]` | `.label` values joined with `", "` |

Fallback: returns `""` for unrecognized types or nil values
