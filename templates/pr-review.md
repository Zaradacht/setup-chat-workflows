---
template: pr-review
name: PR Review
description: Review an existing pull request or merge request with structured gates.
variables:
  - workflow_name
  - project_label
  - source_system
  - default_target_branch
  - default_review_mode
  - workflow_post_actions
---

## {{workflow_name}}

- enabled: true
- purpose: Review a pull request for {{project_label}} with scoped checks.
- required structured questions: PR URL; review mode list (`review-only`, `review-and-fix`, `review-plan-and-fix`, `review-and-comment`, `review-and-merge`); review angles list (`general`, `source/scope`, `code/regression`, `validation/ops`); source task/card/work-item link or explicit none; target branch unless defaulted from project defaults (default: {{default_target_branch}}); review scope (full PR or focused review text); files to review; additional files to include; merge expectation unless defaulted; external update expectation unless defaulted
- required input fields: none
- optional context fields: source system; {{source_system}}; known risks; validation expectations; open notes
- readiness/start gate: can start review when PR URL is present, source link is present or marked none, review mode is selected, review scope is selected as full PR or focused text, and review angles are selected (or defaulted per scope)
- post-run actions: {{workflow_post_actions}}

### {{workflow_name}}/focused-review

- enabled: true
- parent workflow: {{workflow_name}}
- purpose: Conduct a focused PR review where the user has a limited scope
- inherited fields: all
- required structured questions: PR URL; review mode list (`review-and-fix`, `review-only`); review angles list (`code/regression`, `validation/ops`); focused file list; review scope; merge expectation
- optional context fields: source task/card/work-item link; source system; validation expectations
- readiness/start gate: proceed when review scope and focused file list are provided
- post-run actions: {{workflow_post_actions}}
