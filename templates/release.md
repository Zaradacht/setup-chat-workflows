---
template: release
name: Release
description: Prepare, review, and execute a release with checklist gates.
variables:
  - workflow_name
  - project_label
  - release_version
  - workflow_post_actions
---

## {{workflow_name}}

- enabled: true
- purpose: Run a structured release workflow for {{project_label}} version {{release_version}}.
- required structured questions: release version; freeze status; release branch; release owner; release type (patch/minor/major); changelog readiness; validation gate list; rollback plan; external update expectation
- required input fields: release summary; impacted modules; test evidence; deployment plan
- optional context fields: pre-release checks; migration plan; documentation updates; communication plan
- readiness/start gate: can start only after version, freeze status, deployment plan, and validation gates are provided
- post-run actions: {{workflow_post_actions}}
