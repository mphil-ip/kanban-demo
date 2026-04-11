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
