---
template: incident
name: Incident
description: Coordinate incident response from signal to mitigation planning.
variables:
  - workflow_name
  - incident_id
  - workflow_post_actions
  - affected_component
---

## {{workflow_name}}

- enabled: true
- purpose: Drive structured incident response for {{affected_component}} incidents.
- required structured questions: incident identifier; severity; impact summary; mitigation state
- required input fields: none
- optional context fields: owner; communications channel; rollback option; stakeholders; known root cause clues
- readiness/start gate: can start once identifier, severity, impact, and mitigation state are provided (or defaulted)
- post-run actions: {{workflow_post_actions}}
