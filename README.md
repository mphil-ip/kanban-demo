# Requests Kanban

A configurable Kanban board for tracking internal requests. The app is now packaged as a Databricks Apps-ready Node project with a Vite React frontend and an Express server.

## What It Does

- Loads request records from `data.json`
- Groups records into configurable tabs and Kanban columns
- Supports full-text search, typed filters, multi-field sorting, and saved filter views
- Provides a configuration UI for tabs, columns, card fields, filter fields, sort fields, and field type overrides
- Supports light and dark mode
- Saves named board configuration profiles through the local Express API
- Shows the raw loaded JSON data in the browser

## Project Structure

| Path | Purpose |
| --- | --- |
| `index.html` | Vite HTML shell |
| `src/main.jsx` | React entrypoint |
| `src/App.jsx` | Main board, filter, data, and configuration UI |
| `src/config.js` | Default board configuration |
| `data-source.config.js` | Local JSON or Databricks Unity Catalog data source settings |
| `data.json` | Request records loaded by the app |
| `server/index.js` | Express server for Databricks Apps and local production serving |
| `profiles/` | Saved configuration profiles |
| `app.yaml` | Databricks Apps start command |
| `product.md` | Product brief and current product definition |

The older root-level `app.js`, `config.js`, and `server.py` files are retained as legacy static-demo references. The Databricks-ready app uses the files under `src/` and `server/`.

## Local Development

Install dependencies:

```bash
npm install
```

Run the Vite dev server:

```bash
npm run dev
```

Open the URL printed by Vite, usually:

```text
http://localhost:5173
```

The Vite dev server can display the board and load `data.json`. Profile save/load behavior is provided by the Express server in production mode.

## Local Production Run

Build the frontend:

```bash
npm run build
```

Start the Express server:

```bash
npm run start
```

Open:

```text
http://localhost:8000
```

The Express server listens on `process.env.PORT` when provided, which is what Databricks Apps expects.

## Databricks Apps

This project is structured for Databricks Apps:

- `package.json` defines Node dependencies and scripts.
- `npm run build` creates the Vite production bundle in `dist/`.
- `app.yaml` tells Databricks Apps to start the app with `npm run start`.
- `server/index.js` serves the built frontend, `data.json`, and profile routes.

Deploy the project folder as a Databricks App. Databricks installs dependencies from `package.json`, builds the frontend, and runs the configured command.

## Configuration

Edit `src/config.js` to change the default board:

```js
export const CONFIG = {
  app: {
    title: "Requests",
  },
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
    emphasis: "type_detailed",
    linkField: "link",
    fields: ["requested_by", "assigned_to", "status", "age"],
  },
};
```

The in-browser Configure page can also change the active board setup and save it as a profile when the Express server is running.

## Data Source

Edit `data-source.config.js` to choose where board records come from.

The default uses the checked-in demo file:

```js
export const DATA_SOURCE = {
  source: "local",
  local: {
    file: "data.json",
  },
};
```

To load records from Databricks, change `source` to `"databricks"` and set the Unity Catalog target:

```js
export const DATA_SOURCE = {
  source: "databricks",
  databricks: {
    host: process.env.DATABRICKS_HOST,
    token: process.env.DATABRICKS_TOKEN,
    httpPath: process.env.DATABRICKS_SQL_HTTP_PATH,

    catalog: "main",
    schema: "default",
    table: "requests",

    columns: ["*"],
    where: "",
    orderBy: "",
    limit: 5000,
  },
};
```

Set the connection environment variables before starting the app:

```bash
export DATABRICKS_HOST="dbc-xxxxxxxx-xxxx.cloud.databricks.com"
export DATABRICKS_TOKEN="..."
export DATABRICKS_SQL_HTTP_PATH="/sql/1.0/warehouses/..."
npm run start
```

The app exposes `GET /data-source` as a quick sanity check. It returns the configured catalog, schema, table, and whether a token is present, but it does not return the token value.

## Profile API

Profiles are saved as JSON files in `profiles/`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/profiles` | List saved profile names |
| `GET` | `/profiles/:name` | Load a profile |
| `POST` | `/profiles/:name` | Save a profile |
| `DELETE` | `/profiles/:name` | Delete a profile |

## Current Limits

- Request records are read-only.
- `data.json` is loaded from the project root; there is no upload flow yet.
- Saved filter views are stored in browser local storage.
- Profiles save board configuration, not data.
- There is no authentication or multi-user persistence layer in this MVP.
