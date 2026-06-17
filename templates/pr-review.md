---
template: pr-review
name: PR Review
description: Review an existing pull request with focused gates.
variables:
  - workflow_name
  - project_label
  - source_system
  - default_review_mode
  - workflow_post_actions
---

## {{workflow_name}}

- enabled: true
- purpose: Review a pull request for {{project_label}} with scoped checks.
- required structured questions: PR URL; review mode (`review-only`, `review-and-fix`, `review-and-comment`)
- required input fields: none
- optional context fields: source system; review scope; review angles; merge expectation; validation expectation; known risks
- readiness/start gate: can start when PR URL is present and review mode is selected (or defaulted)
- post-run actions: {{workflow_post_actions}}

### {{workflow_name}}/focused-review

- enabled: true
- parent workflow: {{workflow_name}}
- purpose: Conduct a focused PR review where the user has a limited scope.
- inherited fields: all
- required structured questions: PR URL; review mode (`review-and-fix`, `review-only`); focused file list
- required input fields: none
- optional context fields: review scope; validation expectation
- readiness/start gate: proceed when PR URL, mode, and focused file list are provided
- post-run actions: {{workflow_post_actions}}
