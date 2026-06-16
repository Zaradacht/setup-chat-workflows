---
template: general
name: General
description: Lightweight workflow for open-ended requests and quick investigations.
variables:
  - workflow_name
  - project_label
  - workflow_post_actions
  - external_update_tone
---

## {{workflow_name}}

- enabled: true
- purpose: Handle quick investigation, discussion, or lightweight execution for {{project_label}}.
- required structured questions: none
- required input fields: none
- optional context fields: context; constraints; known risks; open notes
- readiness/start gate: can start immediately after user confirms the brief
- post-run actions: {{workflow_post_actions}}
