---
template: design-review
name: Design Review
description: Review architecture or UI/UX design changes before implementation.
variables:
  - workflow_name
  - project_label
  - design_area
  - workflow_post_actions
---

## {{workflow_name}}

- enabled: true
- purpose: Review design or architecture decisions for {{project_label}} in {{design_area}}.
- required structured questions: design doc location; scope decision; acceptance criteria
- required input fields: none
- optional context fields: stakeholders; compatibility risk; performance/security notes; accessibility impact
- readiness/start gate: can start once design doc, scope decision, and acceptance criteria are provided (or defaulted)
- post-run actions: {{workflow_post_actions}}
