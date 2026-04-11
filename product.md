# Product Brief: Requests Kanban

## Overview

Requests Kanban is a lightweight, browser-based board for tracking internal requests through configurable workflow stages. It is designed as a no-build, local-first MVP: teams can open the app from a small static web bundle, point it at JSON data, and reshape the board through configuration instead of changing UI code.

The current demo focuses on operational request tracking across categories such as Policy, Procurement, HR, IT, and Facilities. Each request appears as a card on a Kanban board, with tabs, columns, card fields, filters, sorting, and saved views driven by the underlying data schema.

## Product Goal

Give internal teams a fast way to inspect, segment, and monitor request queues without committing to a full workflow platform or custom backend.

The product is strongest when the primary need is visibility: seeing what exists, where each item stands, who owns it, and which requests need attention.

## Target Users

- Operations leads monitoring request volume and workflow state
- Department managers reviewing work by request type, owner, or status
- Analysts preparing filtered views of request queues
- Small internal teams that need a configurable board before investing in a production system

## Core Jobs

1. See all requests grouped into meaningful work stages.
2. Filter requests by type, people, dates, durations, status, or other available fields.
3. Sort active queues by age, time in state, created date, owner, or other fields.
4. Save useful filter and sort combinations as reusable views.
5. Reconfigure the board layout without editing application logic.
6. Save named board configurations as profiles when running with the local server.
7. Inspect the raw JSON data that powers the board.

## Current Experience

The main screen is a Kanban board with:

- A header containing the app title, theme toggle, optional profile selector, Data button, Configure button, and full-text search.
- Tabs across the top, currently grouped by request type.
- A filter and sort panel with per-tab state.
- A narrative summary showing how many items are visible and which constraints are active.
- Horizontally scrollable columns, currently grouped by request state.
- Request cards showing key fields and opening the configured request link when clicked.

The app also includes:

- A Data page that displays the loaded `data.json` records and supports copying JSON.
- A Configure page for changing title, tabs, columns, card fields, link field, filterable fields, sortable fields, and field type overrides.
- Profile management for creating, saving, renaming, duplicating, loading, and deleting named configurations when served through `server.py`.

## Data Model

The product expects `data.json` to be a flat JSON array of request records. Field names are flexible, but the current sample data uses:

| Field | Meaning |
| --- | --- |
| `id` | Request ID |
| `name` | Request name |
| `type` | Request category |
| `type_detailed` | More specific request type |
| `created_by` | Person who created the request |
| `created_by_title` | Creator title |
| `created_by_office` | Creator office |
| `requested_by` | Requestor |
| `requested_by_office` | Requestor office |
| `requested_by_title` | Requestor title |
| `created` | Created date/time |
| `last_modified` | Last modified date/time |
| `state` | Current workflow state |
| `time_in_state` | Duration in current state |
| `status` | Progress status |
| `age` | Request age |
| `assigned_to` | Current assignee |
| `link` | External request URL |

The app derives available fields from the live data, so additional fields can be shown, filtered, sorted, or used for tabs and columns through configuration.

## Configuration Model

`config.js` defines the default board:

- App title
- Tab grouping field and visible tab values
- Column grouping field and visible column values
- Card title, subtitle, tertiary emphasis field, link field, and body fields
- Optional filterable fields
- Optional sortable fields
- Optional field type overrides

If some values are missing, the app derives sensible defaults from the loaded data:

- Missing card body fields become all fields not already used by card headers, tab grouping, column grouping, or link field.
- Missing tab and column values are inferred from unique data values.
- Missing filter and sort fields default to all available fields.
- Field types are auto-detected as text, categorical, date, or duration unless overridden.

## Filters, Sorting, And Views

Filtering supports different operators by field type:

- Text: contains, does not contain, is, is not, is empty, is not empty
- Categorical: is any of, is none of, is, is not
- Date: is, before, after, between
- Duration: equals, less than, greater than, between

Filters can match all conditions or any condition. Sorts can include multiple fields in priority order and support ascending or descending direction.

Filter and sort state is stored per tab, so each tab can maintain its own working view. Named saved views are stored in browser local storage.

## Profiles

Profiles are named configuration snapshots stored as JSON files in `profiles/`. They are available only when the app runs through `server.py`, which exposes a small REST API:

- `GET /profiles`
- `GET /profiles/:name`
- `POST /profiles/:name`
- `DELETE /profiles/:name`

The app remembers the last active profile in browser local storage and attempts to restore it on startup.

## Technical Shape

The product intentionally avoids build tooling:

- `index.html` loads React and ReactDOM from CDNs.
- `config.js` provides the default global `CONFIG`.
- `app.js` contains all React UI logic using `React.createElement` rather than JSX.
- `data.json` contains request records and is fetched at runtime.
- `server.py` serves static files and enables profile persistence.

This makes the demo easy to run and edit locally, but it also means the code is concentrated in one large `app.js` file.

## How To Run

```bash
python3 server.py
```

Then open:

```text
http://localhost:8000
```

Running through `server.py` is preferred because it enables profile save/load behavior. Static serving can display the board, but profile management will be hidden if `/profiles` is unavailable.

## Current Constraints

- The app is read-only for request records; moving cards does not update request state.
- Data must be supplied as `data.json`; there is no import UI yet.
- Profiles save configuration only, not the request data itself.
- Saved filter views are stored in browser local storage, not profile files.
- There is no authentication, authorization, audit log, or multi-user collaboration.
- There is no backend persistence for request edits.
- The UI is optimized for local demo and internal exploration, not production deployment.

## Product Opportunities

The most natural next steps are:

1. Add data import through file upload or paste-in JSON.
2. Support drag-and-drop card movement and persist state changes.
3. Add export for the current filtered view as CSV or JSON.
4. Persist saved views inside profiles so they travel with board configurations.
5. Add validation and clearer error handling for malformed data/configuration.
6. Split the React app into maintainable modules or migrate to Vite if the product grows.
7. Add a real backend when multiple users, request edits, or production persistence become necessary.

## Product Positioning

Requests Kanban is best understood as a configurable request visibility layer. It is not yet a full workflow system. Its value is speed: load structured request data, configure how the board should organize it, and immediately give stakeholders a usable way to inspect the queue.
