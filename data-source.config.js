// Data source for the Kanban board.
//
// Keep `source` as "local" for demo data from ./data.json.
// Change it to "databricks" to read from a Unity Catalog table.
export const DATA_SOURCE = {
  source: "databricks",

  local: {
    file: "data.json",
  },

  databricks: {
    // Connection values should come from environment variables so secrets are
    // not committed to source control.
    host: process.env.DATABRICKS_HOST,
    token: process.env.DATABRICKS_TOKEN,
    httpPath: process.env.DATABRICKS_SQL_HTTP_PATH,

    // Edit these three values to point at the right Unity Catalog table.
    catalog: "main",
    schema: "default",
    table: "requests",

    // Use ["*"] for all columns, or list the exact columns the board should load.
    columns: ["*"],

    // Optional SQL clauses for shaping the board data.
    where: "",
    orderBy: "",
    limit: 5000,
  },
};
