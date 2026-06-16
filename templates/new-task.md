---
template: new-task
name: New Task
description: Plan or implement a new task with explicit scope and gates.
variables:
  - workflow_name
  - project_label
  - source_system
  - workflow_post_actions
---

## {{workflow_name}}

- enabled: true
- purpose: Plan or implement a new task, feature, bug fix, investigation, or documentation change for {{project_label}}
- required structured questions: source task/card/work-item link or explicit none; source system; fresh default branch from remote unless continuing current branch is explicitly selected; implementation expectation; plan approval gate; review depth/pass; completion/merge gate; external update expectation
- required input fields: goal; milestones; scope boundaries; validation expectations; open notes
- optional context fields: constraints; known risks; implementation notes; open notes
- readiness/start gate: can start after goal, milestones, scope, implementation expectation, plan-approval gate, review depth/pass, completion/merge gate, and external update expectation are answered or explicitly marked unknown/skip by the user
- post-run actions: {{workflow_post_actions}}
