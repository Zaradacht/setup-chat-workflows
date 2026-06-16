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
- required structured questions: design doc location; scope of decision; stakeholders; risk of backwards compatibility; security review required; performance impact; accessibility impact; timeline constraints
- required input fields: problem statement; alternatives considered; acceptance criteria; unknowns
- optional context fields: diagrams/attachments; previous implementation history; implementation notes
- readiness/start gate: require design doc location, scope, at least one stakeholder, and acceptance criteria
- post-run actions: {{workflow_post_actions}}
