---
template: release
name: Release
description: Prepare and execute a release with concise gates.
variables:
  - workflow_name
  - project_label
  - release_version
  - workflow_post_actions
---

## {{workflow_name}}

- enabled: true
- purpose: Run a structured release workflow for {{project_label}} version {{release_version}}.
- required structured questions: release version; release owner; release branch
- required input fields: none
- optional context fields: freeze status; validation checks; rollback plan; deployment plan; communication plan
- readiness/start gate: can start once version, owner, and branch are provided (or defaulted)
- post-run actions: {{workflow_post_actions}}
