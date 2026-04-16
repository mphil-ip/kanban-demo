import React, { useState, useMemo, useEffect, useContext, createContext } from "react";
import { CONFIG } from "./config.js";

// ─── Theme ────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext({});

const THEMES = {
  light: {
    bg: "#fafafa",
    headerBg: "#fff",
    headerBorder: "#ebebeb",
    cardBg: "#fff",
    cardBorder: "#e8e8e8",
    filterBg: "#fafafa",
    filterBorder: "#ebebeb",
    configPageBg: "#f5f5f5",
    sectionBg: "#fff",
    sectionBorder: "#ebebeb",
    inputBg: "#fff",
    inputBorder: "#e8e8e8",
    profileBg: "#f7f7f7",
    profileBorder: "#f0f0f0",
    emptyColBg: "#f7f7f7",
    emptyColBorder: "#e8e8e8",
    colBadgeBg: "#efefef",
    configRowBg: "#f7f7f7",
    text: "#111",
    textMid: "#555",
    textMuted: "#888",
    textLight: "#aaa",
    textVeryLight: "#bbb",
    textFaint: "#ccc",
    tabActive: "#111",
    tabInactive: "#aaa",
    tabBorder: "#111",
    pillActiveBg: "#111",
    pillActiveText: "#fff",
    pillActiveBorder: "#111",
    pillInactiveBg: "#fff",
    pillInactiveText: "#888",
    pillInactiveBorder: "#e0e0e0",
    toggleActiveBg: "#111",
    toggleActiveText: "#fff",
    toggleInactiveBg: "#fff",
    toggleInactiveText: "#aaa",
    cardTitleLink: "#0066cc",
    cardTitleDefault: "#111",
    cardFieldLabel: "#bbb",
    cardFieldValue: "#444",
    cardSubtitle: "#bbb",
    cardEmphasis: "#555",
    divider: "#e0e0e0",
    accent: "#0066cc",
    danger: "#cc3300",
    saveBtn: "#111",
    saveBtnText: "#fff",
    colBadgeText: "#999",
    summaryPillBg: "#111",
    summaryPillText: "#fff",
    searchBg: "#fafafa",
  },
  dark: {
    bg: "#111",
    headerBg: "#1a1a1a",
    headerBorder: "#2a2a2a",
    cardBg: "#222",
    cardBorder: "#2e2e2e",
    filterBg: "#161616",
    filterBorder: "#2a2a2a",
    configPageBg: "#0d0d0d",
    sectionBg: "#1a1a1a",
    sectionBorder: "#2a2a2a",
    inputBg: "#252525",
    inputBorder: "#383838",
    profileBg: "#191919",
    profileBorder: "#2a2a2a",
    emptyColBg: "#191919",
    emptyColBorder: "#2a2a2a",
    colBadgeBg: "#2a2a2a",
    configRowBg: "#252525",
    text: "#e8e8e8",
    textMid: "#bbb",
    textMuted: "#888",
    textLight: "#666",
    textVeryLight: "#555",
    textFaint: "#444",
    tabActive: "#e8e8e8",
    tabInactive: "#555",
    tabBorder: "#e8e8e8",
    pillActiveBg: "#e8e8e8",
    pillActiveText: "#111",
    pillActiveBorder: "#e8e8e8",
    pillInactiveBg: "#252525",
    pillInactiveText: "#666",
    pillInactiveBorder: "#383838",
    toggleActiveBg: "#e8e8e8",
    toggleActiveText: "#111",
    toggleInactiveBg: "#252525",
    toggleInactiveText: "#555",
    cardTitleLink: "#7ab8f5",
    cardTitleDefault: "#e8e8e8",
    cardFieldLabel: "#555",
    cardFieldValue: "#aaa",
    cardSubtitle: "#555",
    cardEmphasis: "#888",
    divider: "#2e2e2e",
    accent: "#7ab8f5",
    danger: "#f87171",
    saveBtn: "#e8e8e8",
    saveBtnText: "#111",
    colBadgeText: "#777",
    summaryPillBg: "#e8e8e8",
    summaryPillText: "#111",
    searchBg: "#252525",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FIELD_LABELS = {
  id: "Request ID",
  name: "Request Name",
  type: "Request Type",
  type_detailed: "Type Detailed",
  created_by: "Created By",
  created_by_title: "Creator Title",
  created_by_office: "Creator Office",
  requested_by: "Requested By",
  requested_by_title: "Requestor Title",
  requested_by_office: "Requestor Office",
  created: "Created Date",
  last_modified: "Last Modified",
  state: "Current State",
  time_in_state: "Time in State",
  status: "Progress Status",
  age: "Request Age",
  assigned_to: "Assigned To",
  link: "Request Link",
};

function label(key) {
  return FIELD_LABELS[key] || key.replace(/_/g, " ");
}

function uniqueValues(field, data) {
  return [...new Set(data.map(d => d[field]).filter(Boolean))];
}

// Fill in any missing config values by deriving them from the data schema.
// Called in both App (for board rendering) and ConfigPage (for initial state).
function resolveConfig(cfg, allFields, data) {
  const reserved = new Set([
    cfg.card?.title, cfg.card?.subtitle, cfg.card?.emphasis,
    cfg.tabs?.field, cfg.columns?.field, cfg.card?.linkField,
  ].filter(Boolean));
  // Use hardcoded values only if they actually exist in the data for that field.
  // If the field was changed and the old values no longer match, derive from data.
  function resolvedValues(fieldName, hardcoded) {
    if (!hardcoded) return uniqueValues(fieldName, data);
    const present = new Set(data.map(d => d[fieldName]));
    return hardcoded.some(v => present.has(v)) ? hardcoded : uniqueValues(fieldName, data);
  }

  return {
    ...cfg,
    card: {
      ...cfg.card,
      fields: (() => {
        const dataFields = allFields.filter(f => !reserved.has(f));
        if (!cfg.card?.fields) return dataFields;
        // Keep configured fields that still exist in the data, then append any
        // new data fields that aren't already in the list.
        const existing = cfg.card.fields.filter(f => allFields.includes(f));
        const added = dataFields.filter(f => !existing.includes(f));
        return [...existing, ...added];
      })(),
    },
    tabs: {
      ...cfg.tabs,
      values: resolvedValues(cfg.tabs?.field, cfg.tabs?.values),
    },
    columns: {
      ...cfg.columns,
      values: resolvedValues(cfg.columns?.field, cfg.columns?.values),
    },
    filterFields: cfg.filterFields ?? allFields,
    sortFields: cfg.sortFields ?? allFields,
    fieldTypeOverrides: cfg.fieldTypeOverrides ?? {},
  };
}

function parseHours(str) {
  if (!str && str !== 0) return 0;
  const s = String(str);
  if (s.includes(":")) {
    const [h, m] = s.split(":").map(Number);
    return h + (m || 0) / 60;
  }
  return parseFloat(s) || 0;
}

// ─── Condition operators ───────────────────────────────────────────────────────
const OPERATORS = {
  categorical: [
    { value: "is_any_of",   label: "is any of" },
    { value: "is_none_of",  label: "is none of" },
    { value: "is",          label: "is" },
    { value: "is_not",      label: "is not" },
  ],
  text: [
    { value: "contains",     label: "contains" },
    { value: "not_contains", label: "does not contain" },
    { value: "is",           label: "is" },
    { value: "is_not",       label: "is not" },
    { value: "is_empty",     label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  date: [
    { value: "is",      label: "is" },
    { value: "before",  label: "is before" },
    { value: "after",   label: "is after" },
    { value: "between", label: "is between" },
  ],
  duration: [
    { value: "equals",        label: "equals" },
    { value: "less_than",     label: "is less than" },
    { value: "greater_than",  label: "is greater than" },
    { value: "between",       label: "is between" },
  ],
};

function defaultOperator(type) {
  if (type === "categorical") return "is_any_of";
  if (type === "date")        return "before";
  if (type === "duration")    return "less_than";
  return "contains";
}

function defaultValue(type, operator) {
  if (operator === "is_empty" || operator === "is_not_empty") return null;
  if (type === "categorical") return (operator === "is_any_of" || operator === "is_none_of") ? [] : "";
  if (type === "date" || type === "duration") return operator === "between" ? { from: "", to: "" } : "";
  return "";
}

function matchesCondition(item, { field, operator, value }) {
  const raw = item[field];
  const str = String(raw ?? "");
  switch (operator) {
    case "is":           return str === String(value ?? "");
    case "is_not":       return str !== String(value ?? "");
    case "is_any_of":    return Array.isArray(value) && value.length > 0 ? value.includes(raw) : true;
    case "is_none_of":   return Array.isArray(value) && value.length > 0 ? !value.includes(raw) : true;
    case "contains":     return str.toLowerCase().includes(String(value ?? "").toLowerCase());
    case "not_contains": return !str.toLowerCase().includes(String(value ?? "").toLowerCase());
    case "is_empty":     return !raw || str === "";
    case "is_not_empty": return !!(raw && str !== "");
    case "before":       return value ? str.slice(0, 10) < value : true;
    case "after":        return value ? str.slice(0, 10) > value : true;
    case "between":      return (value?.from && value?.to) ? (str.slice(0, 10) >= value.from && str.slice(0, 10) <= value.to) : true;
    case "equals":       return parseHours(str) === parseFloat(value || 0);
    case "less_than":    return parseHours(str) < parseFloat(value || 0);
    case "greater_than": return parseHours(str) > parseFloat(value || 0);
    default: return true;
  }
}

function detectFieldType(field, data) {
  const samples = data.map(d => d[field]).filter(v => v !== undefined && v !== null && v !== "");
  if (samples.length === 0) return "text";
  if (samples.every(v => /^https?:\/\//.test(String(v)))) return "text";
  if (samples.every(v => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) return "date";
  if (samples.every(v => /^\d+:\d{2}$/.test(String(v)) || /^\d+(\.\d+)?$/.test(String(v)))) return "duration";
  const unique = new Set(samples);
  if (unique.size < samples.length && unique.size <= 20) return "categorical";
  return "text";
}

const LAST_PROFILE_KEY = "kanban_last_profile";

// ─── Card ─────────────────────────────────────────────────────────────────────
function KanbanCard({ item, config }) {
  const t = useContext(ThemeCtx);
  const [hovered, setHovered] = useState(false);
  const linkVal = item[config.card.linkField];
  const hasLink = !!linkVal;

  return React.createElement("div", {
    onClick: hasLink ? () => window.open(linkVal, "_blank", "noopener,noreferrer") : undefined,
    onMouseEnter: hasLink ? () => setHovered(true) : undefined,
    onMouseLeave: hasLink ? () => setHovered(false) : undefined,
    style: {
      background: t.cardBg,
      border: `1px solid ${t.cardBorder}`,
      borderRadius: 8,
      padding: "14px 16px",
      cursor: hasLink ? "pointer" : "default",
      boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.2)" : "none",
      transform: hovered ? "translateY(-1px)" : "none",
      transition: "box-shadow 0.15s, transform 0.15s",
    }
  },
    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: config.card.emphasis ? 4 : 8 } },
      React.createElement("span", { style: { fontWeight: 600, fontSize: 13, color: t.cardTitleDefault, lineHeight: 1.3, flex: 1, paddingRight: 8 } }, item[config.card.title]),
      React.createElement("span", { style: { fontFamily: "monospace", fontSize: 11, color: t.cardSubtitle, whiteSpace: "nowrap" } }, `#${item[config.card.subtitle]}`)
    ),
    config.card.emphasis && item[config.card.emphasis] && React.createElement("div", {
      style: { fontSize: 12, fontWeight: 500, color: t.cardEmphasis, marginBottom: 8 }
    }, item[config.card.emphasis]),
    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
      ...config.card.fields.map(f =>
        React.createElement("div", { key: f, style: { display: "flex", gap: 6, alignItems: "center" } },
          React.createElement("span", { style: { fontSize: 11, color: t.cardFieldLabel, minWidth: 76 } }, label(f)),
          React.createElement("span", { style: { fontSize: 11, color: t.cardFieldValue } }, item[f] != null && item[f] !== "" ? item[f] : "—")
        )
      )
    )
  );
}

// Produces a human-readable description of a saved filter/sort state (used in tooltips).
function describeFilterState({ conditions, filterMode, sort }, fieldTypes) {
  const parts = [];
  if ((conditions || []).length > 0) {
    const connector = ` ${(filterMode || "and").toUpperCase()} `;
    const descs = conditions.map(c => {
      const type = fieldTypes[c.field] || "text";
      const ops = (OPERATORS[type] || []).find(o => o.value === c.operator);
      const opLabel = ops ? ops.label : c.operator;
      if (c.operator === "is_empty" || c.operator === "is_not_empty") return `${label(c.field)} ${opLabel}`;
      if (Array.isArray(c.value)) return `${label(c.field)} ${opLabel}: ${c.value.join(", ")}`;
      if (c.value && typeof c.value === "object") return `${label(c.field)} ${opLabel}: ${c.value.from || "…"} → ${c.value.to || "…"}`;
      return `${label(c.field)} ${opLabel}: ${c.value}`;
    });
    parts.push(descs.join(connector));
  }
  const rules = sort || [];
  if (rules.length > 0) {
    parts.push(`Sort: ${rules.map(r => `${label(r.field)} ${r.dir === "asc" ? "↑" : "↓"}`).join(", ")}`);
  }
  return parts.join("\n") || "No constraints";
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
function FilterPanel({
  data, filterFields, sortFields, fieldTypes,
  conditions, onConditionsChange, filterMode, onFilterModeChange,
  sort, onSortChange,
  savedFilters, onSaveFilter, onDeleteSavedFilter, onApplyFilter,
}) {
  const t = useContext(ThemeCtx);
  const [collapsed, setCollapsed] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [hoveredSaved, setHoveredSaved] = useState(null);

  const hasConditions = conditions.length > 0;
  const hasSort = sort.length > 0;
  const hasAny = hasConditions || hasSort;
  const activeCount = conditions.length + sort.length;

  // Fields already used can still be reused (unlike old approach — conditions are independent rows)
  const availableSortFields = sortFields.filter(f => !sort.some(r => r.field === f));

  function addCondition(field) {
    if (!field) return;
    const type = fieldTypes[field] || "text";
    const operator = defaultOperator(type);
    const value = defaultValue(type, operator);
    onConditionsChange([...conditions, { id: Date.now(), field, operator, value }]);
  }

  function removeCondition(id) {
    onConditionsChange(conditions.filter(c => c.id !== id));
  }

  function updateCondition(id, patch) {
    onConditionsChange(conditions.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  function changeOperator(id, operator) {
    const c = conditions.find(x => x.id === id);
    if (!c) return;
    const type = fieldTypes[c.field] || "text";
    const value = defaultValue(type, operator);
    updateCondition(id, { operator, value });
  }

  function addSort(field) {
    if (!field || sort.some(r => r.field === field)) return;
    onSortChange([...sort, { field, dir: "asc" }]);
  }

  function removeSort(field) { onSortChange(sort.filter(r => r.field !== field)); }

  // ── Value input for a condition ──
  function renderValueInput(condition) {
    const { id, field, operator, value } = condition;
    const type = fieldTypes[field] || "text";
    if (operator === "is_empty" || operator === "is_not_empty") return null;

    const inputStyle = { fontSize: 12, padding: "4px 8px", borderRadius: 6, border: `1px solid ${t.inputBorder}`, color: t.text, background: t.inputBg };

    if (type === "categorical") {
      const allVals = [...new Set(data.map(d => d[field]).filter(Boolean))];
      if (operator === "is_any_of" || operator === "is_none_of") {
        const selected = Array.isArray(value) ? value : [];
        return React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 } },
          allVals.map(v => {
            const on = selected.includes(v);
            return React.createElement("button", {
              key: v, onClick: () => {
                const next = on ? selected.filter(x => x !== v) : [...selected, v];
                updateCondition(id, { value: next });
              },
              style: { fontSize: 11, padding: "3px 9px", borderRadius: 20, cursor: "pointer", border: "1px solid",
                borderColor: on ? t.pillActiveBorder : t.pillInactiveBorder,
                background: on ? t.pillActiveBg : t.pillInactiveBg,
                color: on ? t.pillActiveText : t.pillInactiveText }
            }, v);
          })
        );
      }
      // is / is_not for categorical — dropdown
      return React.createElement("select", {
        value: value || "",
        onChange: e => updateCondition(id, { value: e.target.value }),
        style: { ...inputStyle, cursor: "pointer" }
      },
        React.createElement("option", { value: "" }, "Select…"),
        allVals.map(v => React.createElement("option", { key: v, value: v }, v))
      );
    }

    if (type === "date") {
      if (operator === "between") {
        const v = (value && typeof value === "object") ? value : { from: "", to: "" };
        return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
          React.createElement("input", { type: "date", value: v.from, onChange: e => updateCondition(id, { value: { ...v, from: e.target.value } }), style: inputStyle }),
          React.createElement("span", { style: { fontSize: 12, color: t.textLight } }, "→"),
          React.createElement("input", { type: "date", value: v.to, onChange: e => updateCondition(id, { value: { ...v, to: e.target.value } }), style: inputStyle })
        );
      }
      return React.createElement("input", { type: "date", value: value || "", onChange: e => updateCondition(id, { value: e.target.value }), style: inputStyle });
    }

    if (type === "duration") {
      if (operator === "between") {
        const v = (value && typeof value === "object") ? value : { from: "", to: "" };
        return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
          React.createElement("input", { type: "number", value: v.from, min: 0, placeholder: "min", onChange: e => updateCondition(id, { value: { ...v, from: e.target.value } }), style: { ...inputStyle, width: 70 } }),
          React.createElement("span", { style: { fontSize: 12, color: t.textLight } }, "–"),
          React.createElement("input", { type: "number", value: v.to, min: 0, placeholder: "max", onChange: e => updateCondition(id, { value: { ...v, to: e.target.value } }), style: { ...inputStyle, width: 70 } }),
          React.createElement("span", { style: { fontSize: 12, color: t.textLight } }, "hrs")
        );
      }
      return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
        React.createElement("input", { type: "number", value: value || "", min: 0, onChange: e => updateCondition(id, { value: e.target.value }), style: { ...inputStyle, width: 80 } }),
        React.createElement("span", { style: { fontSize: 12, color: t.textLight } }, "hrs")
      );
    }

    // text
    return React.createElement("input", {
      type: "text", value: value || "", placeholder: "Value…",
      onChange: e => updateCondition(id, { value: e.target.value }),
      style: { ...inputStyle, minWidth: 160 }
    });
  }

  // ── Collapsed summary pills ──
  const pillStyle = { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, padding: "2px 8px 2px 10px", borderRadius: 20, background: t.summaryPillBg, color: t.summaryPillText };
  const xBtnStyle = { background: "none", border: "none", cursor: "pointer", color: t.summaryPillText, opacity: 0.5, fontSize: 13, lineHeight: 1, padding: 0 };

  const toggleBtn = React.createElement("button", {
    onClick: () => setCollapsed(c => !c),
    style: { fontSize: 12, fontWeight: 500, color: hasAny ? t.text : t.textMuted, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }
  },
    `Filters ${collapsed ? "▾" : "▴"}`,
    activeCount > 0 && React.createElement("span", {
      style: { fontSize: 10, fontWeight: 700, background: t.pillActiveBg, color: t.pillActiveText, borderRadius: 10, padding: "1px 6px" }
    }, activeCount)
  );

  if (collapsed) {
    return React.createElement("div", {
      style: { background: t.filterBg, borderBottom: `1px solid ${t.filterBorder}`, padding: "8px 32px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minHeight: 38 }
    },
      toggleBtn,
      conditions.length > 0 && React.createElement("div", { style: { width: 1, height: 14, background: t.divider, flexShrink: 0 } }),
      conditions.length > 0 && React.createElement("span", { style: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: t.textLight } }, "Filters"),
      ...conditions.map(c => {
        const type = fieldTypes[c.field] || "text";
        const ops = (OPERATORS[type] || []).find(o => o.value === c.operator);
        const opLabel = ops ? ops.label : c.operator;
        let valLabel = "";
        if (c.operator !== "is_empty" && c.operator !== "is_not_empty") {
          if (Array.isArray(c.value)) valLabel = c.value.length > 0 ? `: ${c.value.join(", ")}` : "";
          else if (c.value && typeof c.value === "object") valLabel = c.value.from ? `: ${c.value.from} → ${c.value.to}` : "";
          else valLabel = c.value ? `: ${c.value}` : "";
        }
        return React.createElement("span", { key: c.id, style: pillStyle },
          `${label(c.field)} ${opLabel}${valLabel}`,
          React.createElement("button", { onClick: e => { e.stopPropagation(); removeCondition(c.id); }, style: xBtnStyle }, "×")
        );
      }),
      hasConditions && React.createElement("button", { onClick: () => onConditionsChange([]), style: { fontSize: 11, color: t.textLight, background: "none", border: "none", cursor: "pointer", padding: 0 } }, "Clear"),
      hasSort && React.createElement("div", { style: { width: 1, height: 14, background: t.divider, flexShrink: 0 } }),
      hasSort && React.createElement("span", { style: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: t.textLight } }, "Sort"),
      ...sort.map(r => React.createElement("span", { key: r.field, style: pillStyle },
        `${label(r.field)} ${r.dir === "asc" ? "↑" : "↓"}`,
        React.createElement("button", { onClick: e => { e.stopPropagation(); removeSort(r.field); }, style: xBtnStyle }, "×")
      ))
    );
  }

  // ── Expanded ──
  const selStyle = { fontSize: 12, padding: "4px 8px", borderRadius: 6, border: `1px solid ${t.inputBorder}`, color: t.textMid, background: t.inputBg, cursor: "pointer" };
  const sectionLabelStyle = { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, flexShrink: 0 };
  const ghostBtnStyle = { fontSize: 12, color: t.textLight, background: "none", border: "none", cursor: "pointer", padding: 0 };
  const savedPillStyle = {
    display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500,
    padding: "3px 8px 3px 11px", borderRadius: 20, cursor: "pointer", userSelect: "none",
    border: `1px solid ${t.pillInactiveBorder}`, background: t.pillInactiveBg, color: t.textMid,
  };
  const savedXStyle = { background: "none", border: "none", cursor: "pointer", color: t.textMuted, opacity: 0.45, fontSize: 13, lineHeight: 1, padding: 0 };

  return React.createElement("div", {
    style: { background: t.filterBg, borderBottom: `1px solid ${t.filterBorder}`, padding: "12px 32px", display: "flex", flexDirection: "column", gap: 10 }
  },

    // ── Top bar: toggle + save view ──
    React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
      toggleBtn,
      saving
        ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
            React.createElement("input", {
              type: "text", value: saveName, placeholder: "Name this view…",
              onChange: e => setSaveName(e.target.value),
              onKeyDown: e => {
                if (e.key === "Enter" && saveName.trim()) { onSaveFilter(saveName.trim()); setSaveName(""); setSaving(false); }
                if (e.key === "Escape") { setSaving(false); setSaveName(""); }
              },
              autoFocus: true,
              style: { fontSize: 12, padding: "4px 8px", borderRadius: 6, border: `1px solid ${t.inputBorder}`, color: t.text, background: t.inputBg, width: 160 }
            }),
            React.createElement("button", {
              onClick: () => { if (saveName.trim()) { onSaveFilter(saveName.trim()); setSaveName(""); setSaving(false); } },
              style: { fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "none", background: t.saveBtn, color: t.saveBtnText, cursor: saveName.trim() ? "pointer" : "default", opacity: saveName.trim() ? 1 : 0.4 }
            }, "Save"),
            React.createElement("button", { onClick: () => { setSaving(false); setSaveName(""); }, style: ghostBtnStyle }, "Cancel")
          )
        : React.createElement("button", {
            onClick: () => setSaving(true),
            disabled: !hasAny,
            title: hasAny ? "Save current filters and sort as a named view" : "Add at least one filter or sort first",
            style: { fontSize: 12, padding: "4px 10px", borderRadius: 6, border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: hasAny ? t.textMid : t.textFaint, cursor: hasAny ? "pointer" : "default" }
          }, "Save view…")
    ),

    // ── Filters section ──
    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
      // AND/OR sentence header — only when there are conditions
      hasConditions && React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.textMuted } },
        React.createElement("span", null, "Where"),
        React.createElement("div", { style: { display: "flex", borderRadius: 4, border: `1px solid ${t.inputBorder}`, overflow: "hidden" } },
          ["all", "any"].map(m => React.createElement("button", {
            key: m,
            onClick: () => onFilterModeChange(m === "all" ? "and" : "or"),
            title: m === "all" ? "Every condition must match" : "At least one condition must match",
            style: { fontSize: 11, fontWeight: 700, padding: "2px 9px", cursor: "pointer", border: "none",
              background: (m === "all" ? filterMode === "and" : filterMode === "or") ? t.toggleActiveBg : t.toggleInactiveBg,
              color: (m === "all" ? filterMode === "and" : filterMode === "or") ? t.toggleActiveText : t.toggleInactiveText,
            }
          }, m))
        ),
        React.createElement("span", null, "of the following are true")
      ),

      // Condition rows
      ...conditions.map(c => {
        const type = fieldTypes[c.field] || "text";
        const ops = OPERATORS[type] || OPERATORS.text;
        return React.createElement("div", { key: c.id, style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
          // Field selector
          React.createElement("select", {
            value: c.field,
            onChange: e => {
              const newField = e.target.value;
              const newType = fieldTypes[newField] || "text";
              const newOp = defaultOperator(newType);
              updateCondition(c.id, { field: newField, operator: newOp, value: defaultValue(newType, newOp) });
            },
            style: selStyle
          },
            filterFields.map(f => React.createElement("option", { key: f, value: f }, label(f)))
          ),
          // Operator selector
          React.createElement("select", {
            value: c.operator,
            onChange: e => changeOperator(c.id, e.target.value),
            style: selStyle
          },
            ops.map(o => React.createElement("option", { key: o.value, value: o.value }, o.label))
          ),
          // Value input (null for is_empty/is_not_empty)
          renderValueInput(c),
          // Remove button
          React.createElement("button", {
            onClick: () => removeCondition(c.id),
            style: { background: "none", border: "none", cursor: "pointer", color: t.textFaint, fontSize: 16, lineHeight: 1, padding: "0 4px", flexShrink: 0 }
          }, "×")
        );
      }),

      // Section footer: add condition + clear all
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 2 } },
        React.createElement("select", {
          value: "", onChange: e => { addCondition(e.target.value); e.target.value = ""; }, style: selStyle
        },
          React.createElement("option", { value: "" }, "+ Add condition"),
          filterFields.map(f => React.createElement("option", { key: f, value: f }, label(f)))
        ),
        hasConditions && React.createElement("button", { onClick: () => onConditionsChange([]), style: ghostBtnStyle }, "Clear all")
      )
    ),

    // ── Sort section ──
    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
        React.createElement("span", { style: sectionLabelStyle }, "Sort"),
        React.createElement("select", {
          value: "", onChange: e => { addSort(e.target.value); e.target.value = ""; }, style: selStyle
        },
          React.createElement("option", { value: "" }, "+ Add sort"),
          availableSortFields.map(f => React.createElement("option", { key: f, value: f }, label(f)))
        ),
        hasSort && React.createElement("button", { onClick: () => onSortChange([]), style: ghostBtnStyle }, "Clear all")
      ),
      ...sort.map((rule, i) =>
        React.createElement("div", { key: rule.field, style: { display: "flex", alignItems: "center", gap: 10, paddingLeft: 4 } },
          React.createElement("span", { style: { fontSize: 11, color: t.textFaint, width: 16, flexShrink: 0 } }, `${i + 1}`),
          React.createElement("span", { style: { fontSize: 12, color: t.textMuted, width: 110, flexShrink: 0 } }, label(rule.field)),
          React.createElement("div", { style: { display: "flex", borderRadius: 6, border: `1px solid ${t.inputBorder}`, overflow: "hidden" } },
            ["asc", "desc"].map(dir => React.createElement("button", {
              key: dir, onClick: () => onSortChange(sort.map(r => r.field === rule.field ? { ...r, dir } : r)),
              style: { fontSize: 11, fontWeight: 600, padding: "3px 10px", cursor: "pointer", border: "none",
                background: rule.dir === dir ? t.toggleActiveBg : t.toggleInactiveBg,
                color: rule.dir === dir ? t.toggleActiveText : t.toggleInactiveText }
            }, dir === "asc" ? "↑ Asc" : "↓ Desc"))
          ),
          React.createElement("button", { onClick: () => removeSort(rule.field), style: { background: "none", border: "none", cursor: "pointer", color: t.textFaint, fontSize: 16, lineHeight: 1, padding: "0 4px" } }, "×")
        )
      ),
      sort.length === 0 && React.createElement("span", { style: { fontSize: 11, color: t.textFaint, paddingLeft: 4 } }, "No sort applied")
    ),

    // ── Saved views section ──
    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, paddingTop: 8, borderTop: `1px solid ${t.filterBorder}` } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
        React.createElement("span", { style: sectionLabelStyle }, "Saved Views"),
        savedFilters.length === 0 && React.createElement("span", { style: { fontSize: 11, color: t.textFaint } }, "None yet — save a view above"),
        ...savedFilters.map(sf =>
          React.createElement("div", {
            key: sf.name,
            style: { position: "relative", display: "inline-flex" },
            onMouseEnter: () => setHoveredSaved(sf.name),
            onMouseLeave: () => setHoveredSaved(null),
          },
            React.createElement("span", {
              style: savedPillStyle,
              onClick: () => onApplyFilter(sf),
              title: "Click to apply this saved view",
            },
              sf.name,
              React.createElement("button", { onClick: e => { e.stopPropagation(); onDeleteSavedFilter(sf.name); }, style: savedXStyle }, "×")
            ),
            hoveredSaved === sf.name && React.createElement("div", {
              style: {
                position: "absolute", bottom: "calc(100% + 6px)", left: 0, zIndex: 200,
                background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                borderRadius: 8, padding: "8px 12px", minWidth: 200, maxWidth: 320,
                fontSize: 11, color: t.text, lineHeight: 1.6,
                boxShadow: "0 4px 16px rgba(0,0,0,0.18)", whiteSpace: "pre-line",
              }
            }, describeFilterState(sf, fieldTypes))
          )
        )
      )
    )
  );
}

// ─── Data Page ────────────────────────────────────────────────────────────────
function DataPage({ data, onBack }) {
  const t = useContext(ThemeCtx);
  const [copied, setCopied] = useState(false);

  const json = JSON.stringify(data, null, 2);

  function highlighted() {
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      match => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span style="color:#7ab8f5">${match}</span>`;   // key
          return `<span style="color:#a8d8a8">${match}</span>`;                          // string
        }
        if (/true|false/.test(match)) return `<span style="color:#f5a623">${match}</span>`; // boolean
        if (/null/.test(match))       return `<span style="color:#aaa">${match}</span>`;    // null
        return `<span style="color:#d9a8f5">${match}</span>`;                               // number
      }
    );
  }

  function copy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return React.createElement("div", { style: { minHeight: "100vh", background: t.configPageBg, display: "flex", flexDirection: "column" } },
    // Header
    React.createElement("div", { style: { background: t.headerBg, borderBottom: `1px solid ${t.headerBorder}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, flexShrink: 0 } },
      React.createElement("button", {
        onClick: onBack,
        style: { fontSize: 13, color: t.textMid, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }
      }, "← Board"),
      React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: t.text } }, `Data  ·  ${data.length} records`),
      React.createElement("button", {
        onClick: copy,
        style: { fontSize: 13, padding: "7px 18px", borderRadius: 8, border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.textMid, cursor: "pointer" }
      }, copied ? "Copied ✓" : "Copy JSON")
    ),
    // JSON block
    React.createElement("div", { style: { flex: 1, overflow: "auto", padding: 28 } },
      React.createElement("pre", {
        dangerouslySetInnerHTML: { __html: highlighted() },
        style: {
          background: "#1a1a2e", color: "#e8e8e8",
          fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.7,
          padding: "24px 28px", borderRadius: 10, margin: 0,
          overflowX: "auto",
        }
      })
    )
  );
}

// ─── Config Page sub-components (defined outside to keep stable identity) ──────
function CfgSection({ title, children }) {
  const t = useContext(ThemeCtx);
  const sl = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, marginBottom: 10, display: "block" };
  return React.createElement("div", {
    style: { background: t.sectionBg, borderRadius: 10, border: `1px solid ${t.sectionBorder}`, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }
  },
    React.createElement("span", { style: sl }, title),
    children
  );
}

function CfgTogglePill({ active, onClick, children }) {
  const t = useContext(ThemeCtx);
  return React.createElement("button", {
    onClick,
    style: {
      fontSize: 12, padding: "4px 11px", borderRadius: 20, cursor: "pointer",
      border: "1px solid",
      borderColor: active ? t.pillActiveBorder : t.pillInactiveBorder,
      background: active ? t.pillActiveBg : t.pillInactiveBg,
      color: active ? t.pillActiveText : t.pillInactiveText,
    }
  }, children);
}

// ─── Config Page ───────────────────────────────────────────────────────────────
function ConfigPage({ config, data, allFields, onChange, onBack, profiles, activeProfile, onSaveProfile, onDeleteProfile, onRenameProfile }) {
  const t = useContext(ThemeCtx);
  const [local, setLocal] = useState(() => resolveConfig(config, allFields, data));
  const [profileName, setProfileName] = useState(activeProfile || "");
  // Keep input in sync when activeProfile changes (after save / rename)
  useEffect(() => { setProfileName(activeProfile || ""); }, [activeProfile]);

  const inputStyle = { width: "100%", fontSize: 13, padding: "7px 10px", borderRadius: 6, border: `1px solid ${t.inputBorder}`, color: t.text, background: t.inputBg, marginBottom: 4 };
  const selectStyle = { ...inputStyle, cursor: "pointer" };

  function setTabField(field) {
    setLocal(l => ({ ...l, tabs: { field, values: uniqueValues(field, data) } }));
  }
  function setColField(field) {
    setLocal(l => ({ ...l, columns: { field, values: uniqueValues(field, data) } }));
  }
  function toggleSectionValue(section, val) {
    setLocal(l => {
      const existing = l[section].values;
      const next = existing.includes(val) ? existing.filter(v => v !== val) : [...existing, val];
      return { ...l, [section]: { ...l[section], values: next } };
    });
  }
  function toggleCardField(f) {
    setLocal(l => {
      const existing = l.card.fields;
      const next = existing.includes(f) ? existing.filter(x => x !== f) : [...existing, f];
      return { ...l, card: { ...l.card, fields: next } };
    });
  }
  function moveCardField(i, dir) {
    const next = [...local.card.fields];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setLocal(l => ({ ...l, card: { ...l.card, fields: next } }));
  }

  async function save() {
    onChange(local);
    if (activeProfile) await onSaveProfile(activeProfile, local);
    onBack();
  }

  const cardFieldOptions = allFields.filter(f => f !== local.card.title && f !== local.card.subtitle);

  return React.createElement("div", { style: { minHeight: "100vh", background: t.configPageBg } },

    // Header
    React.createElement("div", { style: { background: t.headerBg, borderBottom: `1px solid ${t.headerBorder}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 } },
      React.createElement("button", {
        onClick: onBack,
        style: { fontSize: 13, color: t.textMid, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }
      }, "← Board"),
      React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: t.text } }, "Configure"),
      React.createElement("button", {
        onClick: save,
        style: { fontSize: 13, fontWeight: 600, padding: "7px 18px", borderRadius: 8, border: "none", background: t.saveBtn, color: t.saveBtnText, cursor: "pointer" }
      }, "Save")
    ),

    // Body — 2-column grid
    React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 28, maxWidth: 960, margin: "0 auto" }
    },

      // ── Profiles ── (only when server.py is running)
      profiles !== null && React.createElement("div", { style: { gridColumn: "1 / -1" } },
        React.createElement(CfgSection, { title: "Profiles" },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
            React.createElement("input", {
              type: "text",
              value: profileName,
              onChange: e => setProfileName(e.target.value),
              placeholder: "Profile name…",
              style: { fontSize: 13, padding: "7px 10px", borderRadius: 6, border: `1px solid ${t.inputBorder}`, color: t.text, background: t.inputBg, width: 220, outline: "none" },
            }),
            // Rename — when there's an active profile and the name has been changed
            activeProfile && profileName.trim() && profileName.trim() !== activeProfile && React.createElement("button", {
              onClick: async () => { await onRenameProfile(activeProfile, profileName.trim(), local); onBack(); },
              style: { fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 6, border: "none", background: t.saveBtn, color: t.saveBtnText, cursor: "pointer" }
            }, "Rename"),
            // Save as new — creates a new profile, applies config, returns to board
            profileName.trim() && React.createElement("button", {
              onClick: async () => { onChange(local); await onSaveProfile(profileName.trim(), local); onBack(); },
              style: { fontSize: 13, padding: "7px 14px", borderRadius: 6, border: `1px solid ${t.inputBorder}`, background: "none", color: t.textMid, cursor: "pointer" }
            }, activeProfile ? "Duplicate" : "Create"),
            // Delete — remove the active profile file
            activeProfile && React.createElement("button", {
              onClick: () => { if (window.confirm(`Delete "${activeProfile}"?`)) onDeleteProfile(activeProfile); },
              style: { fontSize: 13, padding: "7px 14px", borderRadius: 6, border: `1px solid ${t.inputBorder}`, background: "none", color: t.danger, cursor: "pointer" }
            }, "Delete"),
          ),
          React.createElement("span", { style: { fontSize: 11, color: t.textVeryLight } },
            activeProfile
              ? profileName.trim() && profileName.trim() !== activeProfile
                ? `Active: "${activeProfile}" — Rename replaces it, Duplicate keeps both.`
                : `Active: "${activeProfile}" — the header Save button applies settings and updates this profile.`
              : "Enter a name and click Create to save the current settings as a new profile."
          )
        )
      ),

      // ── General ──
      React.createElement(CfgSection, { title: "General" },
        React.createElement("div", null,
          React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 } }, "App title"),
          React.createElement("input", {
            type: "text", value: local.app.title,
            onChange: e => setLocal(l => ({ ...l, app: { ...l.app, title: e.target.value } })),
            style: inputStyle,
          })
        ),
        React.createElement("div", null,
          React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 } }, "Link field"),
          React.createElement("select", {
            value: local.card.linkField,
            onChange: e => setLocal(l => ({ ...l, card: { ...l.card, linkField: e.target.value } })),
            style: selectStyle,
          },
            React.createElement("option", { value: "" }, "— none —"),
            allFields.map(f => React.createElement("option", { key: f, value: f }, label(f)))
          ),
          React.createElement("span", { style: { fontSize: 11, color: t.textVeryLight } }, "Field containing a URL — clicking a card opens it in a new tab")
        )
      ),

      // ── Card ──
      React.createElement(CfgSection, { title: "Card" },
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          React.createElement("div", null,
            React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 } }, "Primary header"),
            React.createElement("select", {
              value: local.card.title,
              onChange: e => setLocal(l => ({ ...l, card: { ...l.card, title: e.target.value } })),
              style: selectStyle,
            }, allFields.map(f => React.createElement("option", { key: f, value: f }, label(f))))
          ),
          React.createElement("div", null,
            React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 } }, "Secondary header"),
            React.createElement("select", {
              value: local.card.subtitle,
              onChange: e => setLocal(l => ({ ...l, card: { ...l.card, subtitle: e.target.value } })),
              style: selectStyle,
            }, allFields.map(f => React.createElement("option", { key: f, value: f }, label(f))))
          ),
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 } }, "Tertiary header"),
            React.createElement("select", {
              value: local.card.emphasis || "",
              onChange: e => setLocal(l => ({ ...l, card: { ...l.card, emphasis: e.target.value || null } })),
              style: selectStyle,
            },
              React.createElement("option", { value: "" }, "— none —"),
              allFields.map(f => React.createElement("option", { key: f, value: f }, label(f)))
            ),
            React.createElement("span", { style: { fontSize: 11, color: t.textVeryLight } }, "Shown between the primary/secondary headers and the body fields")
          )
        ),
        React.createElement("div", null,
          React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 6 } }, "Body fields"),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 } },
            local.card.fields.map((f, i) =>
              React.createElement("div", {
                key: f,
                style: { display: "flex", alignItems: "center", gap: 6, background: t.configRowBg, borderRadius: 6, padding: "5px 8px" }
              },
                React.createElement("button", {
                  onClick: () => moveCardField(i, -1),
                  style: { background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? t.textFaint : t.textMuted, fontSize: 12, padding: "0 2px" }
                }, "↑"),
                React.createElement("button", {
                  onClick: () => moveCardField(i, 1),
                  style: { background: "none", border: "none", cursor: i === local.card.fields.length - 1 ? "default" : "pointer", color: i === local.card.fields.length - 1 ? t.textFaint : t.textMuted, fontSize: 12, padding: "0 2px" }
                }, "↓"),
                React.createElement("span", { style: { flex: 1, fontSize: 12, color: t.text } }, label(f)),
                React.createElement("button", {
                  onClick: () => toggleCardField(f),
                  style: { background: "none", border: "none", cursor: "pointer", color: t.textVeryLight, fontSize: 14, padding: "0 2px" }
                }, "×")
              )
            )
          ),
          React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } },
            cardFieldOptions
              .filter(f => !local.card.fields.includes(f))
              .map(f =>
                React.createElement("button", {
                  key: f,
                  onClick: () => toggleCardField(f),
                  style: { fontSize: 11, padding: "3px 9px", borderRadius: 20, cursor: "pointer", border: `1px dashed ${t.divider}`, background: t.inputBg, color: t.textMuted }
                }, `+ ${label(f)}`)
              )
          )
        )
      ),

      // ── Filters & Sorting ──
      React.createElement("div", { style: { gridColumn: "1 / -1" } },
        React.createElement(CfgSection, { title: "Filters & Sorting" },
          React.createElement("div", null,
            React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 6 } }, "Filterable fields"),
            React.createElement("span", { style: { fontSize: 11, color: t.textVeryLight, display: "block", marginBottom: 8 } }, "Toggle which fields appear in the filter panel on the board"),
            React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } },
              allFields.map(f => {
                const active = local.filterFields.includes(f);
                return React.createElement(CfgTogglePill, {
                  key: f, active,
                  onClick: () => {
                    const next = active ? local.filterFields.filter(x => x !== f) : [...local.filterFields, f];
                    setLocal(l => ({ ...l, filterFields: next }));
                  },
                }, label(f));
              })
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 6 } }, "Sortable fields"),
            React.createElement("span", { style: { fontSize: 11, color: t.textVeryLight, display: "block", marginBottom: 8 } }, "Toggle which fields can be used as sort criteria"),
            React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } },
              allFields.map(f => {
                const active = (local.sortFields ?? allFields).includes(f);
                return React.createElement(CfgTogglePill, {
                  key: f, active,
                  onClick: () => {
                    const current = local.sortFields ?? allFields;
                    const next = active ? current.filter(x => x !== f) : [...current, f];
                    setLocal(l => ({ ...l, sortFields: next }));
                  },
                }, label(f));
              })
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 6 } }, "Field types"),
            React.createElement("span", { style: { fontSize: 11, color: t.textVeryLight, display: "block", marginBottom: 8 } }, "Override the auto-detected filter control type for each field"),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
              allFields.map(f => {
                const detected = detectFieldType(f, data);
                const overrides = local.fieldTypeOverrides || {};
                const current = overrides[f] || "auto";
                return React.createElement("div", {
                  key: f,
                  style: { display: "flex", alignItems: "center", gap: 10, background: t.configRowBg, borderRadius: 6, padding: "6px 10px" }
                },
                  React.createElement("span", { style: { flex: 1, fontSize: 12, color: t.text } }, label(f)),
                  React.createElement("span", { style: { fontSize: 11, color: t.textFaint, minWidth: 80 } }, current === "auto" ? `detected: ${detected}` : ""),
                  React.createElement("select", {
                    value: current,
                    onChange: e => {
                      const val = e.target.value;
                      const next = { ...overrides };
                      if (val === "auto") delete next[f]; else next[f] = val;
                      setLocal(l => ({ ...l, fieldTypeOverrides: next }));
                    },
                    style: { fontSize: 12, padding: "3px 8px", borderRadius: 6, border: `1px solid ${current !== "auto" ? t.pillActiveBorder : t.inputBorder}`, background: current !== "auto" ? t.pillActiveBg : t.inputBg, color: current !== "auto" ? t.pillActiveText : t.textMid, cursor: "pointer" }
                  },
                    React.createElement("option", { value: "auto" }, "auto"),
                    React.createElement("option", { value: "text" }, "text"),
                    React.createElement("option", { value: "categorical" }, "categorical"),
                    React.createElement("option", { value: "date" }, "date"),
                    React.createElement("option", { value: "duration" }, "duration")
                  )
                );
              })
            )
          )
        )
      ),

      // ── Tabs ──
      React.createElement(CfgSection, { title: "Tabs" },
        React.createElement("div", null,
          React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 } }, "Group by field"),
          React.createElement("select", {
            value: local.tabs.field,
            onChange: e => setTabField(e.target.value),
            style: selectStyle,
          }, allFields.map(f => React.createElement("option", { key: f, value: f }, label(f))))
        ),
        React.createElement("div", null,
          React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 6 } }, "Visible tabs"),
          React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } },
            uniqueValues(local.tabs.field, data).map(v =>
              React.createElement(CfgTogglePill, {
                key: v,
                active: local.tabs.values.includes(v),
                onClick: () => toggleSectionValue("tabs", v),
              }, v)
            )
          )
        )
      ),

      // ── Columns ──
      React.createElement(CfgSection, { title: "Columns" },
        React.createElement("div", null,
          React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 4 } }, "Group by field"),
          React.createElement("select", {
            value: local.columns.field,
            onChange: e => setColField(e.target.value),
            style: selectStyle,
          }, allFields.map(f => React.createElement("option", { key: f, value: f }, label(f))))
        ),
        React.createElement("div", null,
          React.createElement("label", { style: { fontSize: 12, color: t.textMuted, display: "block", marginBottom: 6 } }, "Visible columns"),
          React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } },
            uniqueValues(local.columns.field, data).map(v =>
              React.createElement(CfgTogglePill, {
                key: v,
                active: local.columns.values.includes(v),
                onClick: () => toggleSectionValue("columns", v),
              }, v)
            )
          )
        )
      )
    )
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [config, setConfig] = useState(CONFIG);
  const [activeTab, setActiveTab] = useState(CONFIG.tabs.values[0]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("board"); // "board" | "config" | "data"
  // Per-tab filter/sort state: { [tabName]: { conditions, filterMode, sort[] } }
  const [tabState, setTabState] = useState({});
  // Named saved filter views, persisted to localStorage
  const [savedFilters, setSavedFilters] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kanban_saved_filters") || "[]"); } catch { return []; }
  });
  const [dark, setDark] = useState(() => localStorage.getItem("kanban_dark") === "true");
  const [profiles, setProfiles] = useState(null); // null = server not running
  const [activeProfile, setActiveProfile] = useState(null);

  const theme = dark ? THEMES.dark : THEMES.light;

  // Load data
  useEffect(() => {
    fetch("data.json")
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(setData)
      .catch(e => setLoadError(e.message));
  }, []);

  // Load profile list + auto-restore last used profile
  useEffect(() => {
    fetch("/profiles")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(async list => {
        setProfiles(list);
        const last = localStorage.getItem(LAST_PROFILE_KEY);
        if (last && list.includes(last)) {
          const r2 = await fetch(`/profiles/${encodeURIComponent(last)}.json`);
          if (r2.ok) {
            const c = await r2.json();
            setConfig(c);
            setActiveTab(c.tabs?.values?.[0] ?? CONFIG.tabs.values[0]);
            setActiveProfile(last);
          }
        }
      })
      .catch(() => setProfiles(null)); // server.py not running — hide profile bar
  }, []);

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem("kanban_dark", String(dark));
  }, [dark]);

  const allFields = useMemo(() =>
    data ? [...new Set(data.flatMap(d => Object.keys(d)))] : [],
    [data]
  );

  const fieldTypes = useMemo(() => {
    if (!data) return {};
    const overrides = config.fieldTypeOverrides || {};
    return Object.fromEntries(allFields.map(f => [f, overrides[f] || detectFieldType(f, data)]));
  }, [data, allFields, config]);

  // Resolved config: fills in card.fields, tabs.values, columns.values, filterFields
  // from the live data schema whenever they're absent from the raw config.
  const effectiveConfig = useMemo(() =>
    data ? resolveConfig(config, allFields, data) : config,
    [config, allFields, data]
  );

  // Derive current tab's filter/sort state
  const tabCurrent = tabState[activeTab] || { conditions: [], filterMode: "and", sort: [] };
  const conditions = tabCurrent.conditions || [];
  const filterMode = tabCurrent.filterMode || "and";
  const sort = tabCurrent.sort || [];

  const tabData = useMemo(() => {
    if (!data) return [];
    const filtered = data.filter(d => {
      if (d[effectiveConfig.tabs.field] !== activeTab) return false;
      if (search && !Object.values(d).some(v => String(v).toLowerCase().includes(search.toLowerCase()))) return false;
      if (conditions.length === 0) return true;
      const results = conditions.map(c => matchesCondition(d, c));
      return filterMode === "or" ? results.some(Boolean) : results.every(Boolean);
    });
    if (sort.length > 0) {
      filtered.sort((a, b) => {
        for (const { field, dir } of sort) {
          const type = fieldTypes[field];
          let cmp;
          if (type === "duration") {
            cmp = parseHours(String(a[field] ?? "")) - parseHours(String(b[field] ?? ""));
          } else {
            cmp = String(a[field] ?? "").localeCompare(String(b[field] ?? ""), undefined, { numeric: true, sensitivity: "base" });
          }
          if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
        }
        return 0;
      });
    }
    return filtered;
  }, [data, activeTab, tabState, search, fieldTypes, effectiveConfig, conditions, filterMode, sort]);

  const columnCounts = useMemo(() =>
    effectiveConfig.columns.values.reduce((acc, col) => {
      acc[col] = tabData.filter(d => d[effectiveConfig.columns.field] === col).length;
      return acc;
    }, {}),
    [tabData, effectiveConfig]
  );

  // Count per tab — each tab uses its own stored conditions so badges are independent
  const tabCounts = useMemo(() => {
    if (!data) return {};
    return effectiveConfig.tabs.values.reduce((acc, tab) => {
      const ts = tabState[tab] || {};
      const tabConditions = ts.conditions || [];
      const tabFilterMode = ts.filterMode || "and";
      acc[tab] = data.filter(d => {
        if (d[effectiveConfig.tabs.field] !== tab) return false;
        if (search && !Object.values(d).some(v => String(v).toLowerCase().includes(search.toLowerCase()))) return false;
        if (tabConditions.length === 0) return true;
        const results = tabConditions.map(c => matchesCondition(d, c));
        return tabFilterMode === "or" ? results.some(Boolean) : results.every(Boolean);
      }).length;
      return acc;
    }, {});
  }, [data, effectiveConfig, search, tabState]);

  if (loadError) return React.createElement("div", { style: { padding: 40, color: "#c62828", fontFamily: "inherit" } }, `Failed to load data.json: ${loadError}`);
  if (!data)     return React.createElement("div", { style: { padding: 40, color: "#aaa", fontFamily: "inherit" } }, "Loading…");

  const t = theme;

  // Per-tab setters (update only the active tab's slice of tabState)
  function setConditions(c) { setTabState(s => ({ ...s, [activeTab]: { ...tabCurrent, conditions: c } })); }
  function setFilterMode(m) { setTabState(s => ({ ...s, [activeTab]: { ...tabCurrent, filterMode: m } })); }
  function setSort(f) {
    const next = typeof f === "function" ? f(sort) : f;
    setTabState(s => ({ ...s, [activeTab]: { ...tabCurrent, sort: next } }));
  }
  function saveFilterView(name) {
    if (!name.trim()) return;
    const entry = { name: name.trim(), conditions, filterMode, sort };
    setSavedFilters(prev => {
      const next = [...prev.filter(sv => sv.name !== name.trim()), entry];
      localStorage.setItem("kanban_saved_filters", JSON.stringify(next));
      return next;
    });
  }
  function deleteSavedFilter(name) {
    setSavedFilters(prev => {
      const next = prev.filter(sv => sv.name !== name);
      localStorage.setItem("kanban_saved_filters", JSON.stringify(next));
      return next;
    });
  }
  function applyFilterView(saved) {
    setTabState(s => ({
      ...s,
      [activeTab]: { conditions: saved.conditions || [], filterMode: saved.filterMode || "and", sort: saved.sort || [] }
    }));
  }

  function buildNarrative() {
    if (!data) return "";
    const tabTotal = data.filter(d => d[effectiveConfig.tabs.field] === activeTab).length;
    const shown = tabData.length;
    let text = `Showing ${shown}${shown !== tabTotal ? ` of ${tabTotal}` : ""} ${activeTab.toLowerCase()} items`;
    const fc = conditions.length;
    if (fc > 0) text += ` · ${fc} filter${fc !== 1 ? "s" : ""} active`;
    if (sort.length > 0) text += ` · sorted by ${sort.map(r => `${label(r.field)} ${r.dir === "asc" ? "↑" : "↓"}`).join(", ")}`;
    return text;
  }

  function handleConfigChange(newConfig) {
    setConfig(newConfig);
    if (!newConfig.tabs.values.includes(activeTab)) {
      setActiveTab(newConfig.tabs.values[0] || "");
    }
  }

  async function loadProfile(name) {
    try {
      const r = await fetch(`/profiles/${encodeURIComponent(name)}.json`);
      if (!r.ok) return;
      const c = await r.json();
      handleConfigChange(c);
      setTabState({});
      setActiveProfile(name);
      localStorage.setItem(LAST_PROFILE_KEY, name);
    } catch(e) {}
  }

  async function saveProfile(name, configData) {
    try {
      const r = await fetch(`/profiles/${encodeURIComponent(name)}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });
      if (!r.ok) { alert(`Could not save profile "${name}" (server returned ${r.status})`); return; }
      setProfiles(prev => [...new Set([...(prev || []), name])].sort());
      setActiveProfile(name);
      localStorage.setItem(LAST_PROFILE_KEY, name);
    } catch(e) { alert(`Could not save profile "${name}": ${e.message}`); }
  }

  async function deleteProfile(name) {
    try {
      await fetch(`/profiles/${encodeURIComponent(name)}.json`, { method: "DELETE" });
      setProfiles(prev => (prev || []).filter(p => p !== name));
      if (activeProfile === name) {
        setActiveProfile(null);
        localStorage.removeItem(LAST_PROFILE_KEY);
        setConfig(CONFIG);
        setActiveTab(CONFIG.tabs.values[0]);
        setTabState({});
        setView("board");
      }
    } catch(e) {}
  }

  async function renameProfile(oldName, newName, configData) {
    try {
      const r = await fetch(`/profiles/${encodeURIComponent(newName)}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });
      if (!r.ok) { alert(`Could not rename profile (server returned ${r.status})`); return; }
      await fetch(`/profiles/${encodeURIComponent(oldName)}.json`, { method: "DELETE" });
      setProfiles(prev => [...new Set([...(prev || []).filter(p => p !== oldName), newName])].sort());
      setActiveProfile(newName);
      localStorage.setItem(LAST_PROFILE_KEY, newName);
    } catch(e) { alert(`Could not rename profile: ${e.message}`); }
  }

  // ── Data page ──
  if (view === "data") {
    return React.createElement(ThemeCtx.Provider, { value: t },
      React.createElement(DataPage, { data, onBack: () => setView("board") })
    );
  }

  // ── Config page ──
  if (view === "config") {
    return React.createElement(ThemeCtx.Provider, { value: t },
      React.createElement(ConfigPage, {
        config, data, allFields,
        onChange: handleConfigChange,
        onBack: () => setView("board"),
        profiles,
        activeProfile,
        onSaveProfile: saveProfile,
        onDeleteProfile: deleteProfile,
        onRenameProfile: renameProfile,
      })
    );
  }

  // ── Board ──
  return React.createElement(ThemeCtx.Provider, { value: t },
    React.createElement("div", { style: { minHeight: "100vh", background: t.bg } },

      // Header
      React.createElement("div", { style: { background: t.headerBg, borderBottom: `1px solid ${t.headerBorder}`, padding: "0 32px" } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, paddingBottom: 12 } },
          React.createElement("h1", { style: { fontSize: 20, fontWeight: 700, color: t.text, letterSpacing: "-0.02em" } }, config.app.title),
          React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
            React.createElement("button", {
              onClick: () => setDark(d => !d),
              title: dark ? "Switch to light mode" : "Switch to dark mode",
              style: { fontSize: 15, background: "none", border: `1px solid ${t.inputBorder}`, borderRadius: 8, cursor: "pointer", padding: "5px 10px", color: t.textMid, lineHeight: 1 }
            }, dark ? "☀" : "☾"),
            profiles !== null && React.createElement("select", {
              value: activeProfile || "",
              onChange: e => { if (e.target.value) loadProfile(e.target.value); },
              style: { fontSize: 12, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "7px 12px", color: activeProfile ? t.text : t.textLight, background: t.inputBg, cursor: "pointer" }
            },
              React.createElement("option", { value: "" }, profiles.length === 0 ? "No profiles" : "Profile…"),
              profiles.map(p => React.createElement("option", { key: p, value: p }, p))
            ),
            React.createElement("button", {
              onClick: () => setView("data"),
              style: { fontSize: 12, padding: "7px 14px", borderRadius: 8, cursor: "pointer", border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.textMid }
            }, "Data"),
            React.createElement("button", {
              onClick: () => setView("config"),
              style: { fontSize: 12, padding: "7px 14px", borderRadius: 8, cursor: "pointer", border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.textMid }
            }, "Configure"),
            React.createElement("input", {
              value: search,
              onChange: e => setSearch(e.target.value),
              placeholder: "Search…",
              style: { fontSize: 13, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: "8px 14px", width: 220, outline: "none", color: t.text, background: t.searchBg }
            })
          )
        ),

        // Tabs
        React.createElement("div", { style: { display: "flex" } },
          ...effectiveConfig.tabs.values.map(tab => {
            const active = tab === activeTab;
            return React.createElement("button", {
              key: tab,
              onClick: () => setActiveTab(tab),
              style: {
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? t.tabActive : t.tabInactive,
                background: "none", border: "none",
                borderBottom: active ? `2px solid ${t.tabBorder}` : "2px solid transparent",
                padding: "10px 16px", cursor: "pointer", marginBottom: -1,
                display: "flex", alignItems: "center", gap: 7,
              }
            },
              tab,
              React.createElement("span", {
                style: {
                  fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "2px 9px",
                  background: t.colBadgeBg, color: t.colBadgeText,
                }
              }, tabCounts[tab] ?? "")
            );
          })
        )
      ),

      // Filter panel
      React.createElement(FilterPanel, {
        data,
        filterFields: effectiveConfig.filterFields,
        sortFields: effectiveConfig.sortFields,
        fieldTypes,
        conditions,
        onConditionsChange: setConditions,
        filterMode,
        onFilterModeChange: setFilterMode,
        sort,
        onSortChange: setSort,
        savedFilters,
        onSaveFilter: saveFilterView,
        onDeleteSavedFilter: deleteSavedFilter,
        onApplyFilter: applyFilterView,
      }),
      // ── Narrative bar ──
      React.createElement("div", {
        style: { padding: "6px 32px", fontSize: 11, color: t.textLight, background: t.bg, borderBottom: `1px solid ${t.filterBorder}` }
      }, buildNarrative()),

      // Board columns
      React.createElement("div", { style: { display: "flex", gap: 16, padding: "20px 24px", overflowX: "auto" } },
        ...effectiveConfig.columns.values.map(col => {
          const cards = tabData.filter(d => d[effectiveConfig.columns.field] === col);
          return React.createElement("div", { key: col, style: { flex: "0 0 300px", display: "flex", flexDirection: "column" } },
            // Column header
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 10px 4px" } },
              React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: t.textMid, textTransform: "uppercase", letterSpacing: "0.08em" } }, col),
              React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: t.colBadgeText, background: t.colBadgeBg, borderRadius: 20, padding: "2px 9px" } }, columnCounts[col])
            ),
            // Scrollable card list
            React.createElement("div", {
              style: {
                borderRadius: 12, overflowY: "auto",
                maxHeight: "calc(100vh - 260px)",
                minHeight: 80,
                background: t.emptyColBg,
                border: `1.5px solid ${t.emptyColBorder}`,
                padding: cards.length === 0 ? "24px 16px" : "10px",
                display: "flex", flexDirection: "column", gap: 8,
                alignItems: cards.length === 0 ? "center" : "stretch",
                justifyContent: cards.length === 0 ? "center" : "flex-start",
              }
            },
              cards.length === 0
                ? React.createElement("span", { style: { fontSize: 12, color: t.textFaint } }, "No requests")
                : cards.map(item => React.createElement(KanbanCard, { key: item.id, item, config: effectiveConfig }))
            )
          );
        })
      )
    )
  );
}

export default App;
