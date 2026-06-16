---
template: incident
name: Incident
description: Coordinate incident response from signal, triage, and fix planning.
variables:
  - workflow_name
  - incident_id
  - severity
  - affected_component
  - workflow_post_actions
---

## {{workflow_name}}

- enabled: true
- purpose: Drive structured incident response for {{affected_component}} incidents.
- required structured questions: incident identifier; severity; impact summary; affected component; active mitigation in place; rollback option; communication channel; incident owner; required output format
- required input fields: goal; affected systems; open alerts/signals; validation expectation
- optional context fields: timeline; temporary workaround; known contributing factors; stakeholders; root-cause hypotheses; open notes
- readiness/start gate: require incident identifier, severity, impact summary, mitigation state, and communications channel before moving to execution
- post-run actions: {{workflow_post_actions}}
