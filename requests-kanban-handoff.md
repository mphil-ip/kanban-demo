# Requests Kanban — Claude Code Handoff

## Project Summary
Building an MVP Kanban board for tracking internal requests. The app is config-driven: a JSON schema defines the UI (tabs, columns, card fields) and a separate JSON array provides the data. The goal is a clean separation so the UI logic never needs to change when data or configuration changes.

---

## Current State
A fully working demo has been built and delivered as a 4-file static web app (`kanban-demo.zip`). It runs locally via `python3 -m http.server 8000`.

### File Structure
```
kanban-demo/
├── index.html     # Shell — loads React via CDN, references the 3 JS files
├── config.js      # CONFIG object — defines tabs, columns, card fields
├── data.js        # SAMPLE_DATA array — the JSON records
└── app.js         # All UI logic (React, no JSX, no build step)
```

### How to Run
```bash
cd kanban-demo
python3 -m http.server 8000
# Open http://localhost:8000
```

---

## Data Schema
The app is built around this data model:

| Display Name           | Field Key           | Type                        |
|------------------------|---------------------|-----------------------------|
| Request Id             | `id`                | Integer (6 digits, leading zeros preserved as string) |
| Request Name           | `name`              | Text                        |
| Request Type           | `type`              | Text                        |
| Request Type Detailed  | `type_detailed`     | Text                        |
| Created By             | `created_by`        | Text                        |
| Created By Title       | `created_by_title`  | Text                        |
| Created By Office      | `created_by_office` | Text                        |
| Requested By           | `requested_by`      | Text                        |
| Requested By Office    | `requested_by_office` | Text                      |
| Requested By Title     | `requested_by_title` | Text                       |
| Created Date           | `created`           | Date string `YYYY-MM-DD HH:MM` |
| Last Modified Date     | `last_modified`     | Date string `YYYY-MM-DD HH:MM` |
| Current State          | `state`             | Text                        |
| Time Entered Current State | `time_in_state` | String `HH:MM`             |
| Progress Status        | `status`            | Text                        |
| Request Age            | `age`               | String `HH:MM`              |
| Assigned To            | `assigned_to`       | Text                        |

---

## Current CONFIG Object (`config.js`)
```js
const CONFIG = {
  tabs: {
    field: "type",
    values: ["Policy", "Procurement", "HR", "IT", "Facilities"],
  },
  columns: {
    field: "state",
    values: ["Submitted", "In Review", "Pending Approval", "Approved", "Closed"],
  },
  card: {
    title: "name",
    subtitle: "id",
    fields: ["requested_by", "assigned_to", "status", "age"],
  },
};
```

- **Tabs** are driven by `type` — one tab per request type
- **Kanban columns** are driven by `state` — cards are placed in the column matching their current state
- **Cards** show: request name (title), ID (subtitle), requested_by, assigned_to, status badge, age

---

## UI Behavior
- **Tabs** at the top filter the board by `type`, with a count badge per tab
- **Columns** render cards filtered to that `state` value; empty columns show a dashed placeholder
- **Search bar** in the header does a live full-text filter across all fields
- **Click a card** → opens a right-side detail drawer showing all 17 fields
- **Status badge** colors are hardcoded in `app.js`:
  - `On Track` → green
  - `At Risk` → orange
  - `Delayed` → red
  - `Complete` → blue

---

## Design Decisions
- Clean, minimal aesthetic: white background, black type, no decorative chrome
- Font: DM Sans (body) + DM Mono (IDs) via Google Fonts CDN
- React loaded via CDN (no build tooling required)
- No JSX — `app.js` uses `React.createElement` so it runs in the browser without a compiler
- `config.js` and `data.js` load before `app.js` as plain `<script>` tags, so `CONFIG` and `SAMPLE_DATA` are globals available to the app

---

## What Was Explicitly Decided
- Tabs → `type` field
- Columns → `state` field
- Visual style → clean & minimal (white/light)
- Deployment → local Python HTTP server, no build step
- File separation → 4 files so config and data can be edited independently of UI logic

---

## Suggested Next Steps
These were discussed but not yet built:

1. **Real data ingestion** — replace `data.js` sample array with a file picker or paste-in JSON panel in the UI
2. **Config editor UI** — in-browser panel to change tabs/columns/card fields without editing files directly
3. **Drag-to-move cards** — drag a card between columns to update its `state`
4. **Date / age filtering** — filter panel for created date range, age thresholds, assigned_to
5. **Export** — CSV or JSON export of the current filtered view
6. **Proper build setup** — if the project grows, migrate to Vite + React with JSX for cleaner component authoring

---

## Notes for Claude Code
- The `.jsx` artifact version also exists (single-file React component with JSX) if you want to port this to a proper Vite/CRA project — ask the user if they have it saved
- The current `app.js` is intentionally verbose (`React.createElement` calls) due to the no-build constraint — if you set up a bundler, rewriting with JSX will significantly clean it up
- All state is in-memory; no backend, no persistence layer yet