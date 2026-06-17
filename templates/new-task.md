---
template: new-task
name: New Task
description: Plan or implement a new task with focused defaults.
variables:
  - workflow_name
  - project_label
  - workflow_post_actions
  - source_system
---

## {{workflow_name}}

- enabled: true
- purpose: Plan or implement a new task, feature, bug fix, investigation, or documentation change for {{project_label}}.
- required structured questions: source link/none; task goal; expected outcome
- required input fields: none
- optional context fields: scope boundaries; constraints; milestones; validation expectation; known risks
- readiness/start gate: can start once source choice, goal, and expected outcome are provided (or defaulted)
- post-run actions: {{workflow_post_actions}}
