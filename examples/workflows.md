# Workflow Catalog

## general

- enabled: true
- purpose: open discussion, explanation, quick investigation, or lightweight help that does not need structured task intake
- required structured questions: none
- required input fields: none
- optional context fields: context; open notes
- readiness/start gate: can start immediately after the user confirms the brief

## pr-review

- enabled: true
- purpose: review an existing pull request or merge request
- required structured questions: PR URL; source task/card/work-item link or explicit none; target branch unless defaulted; full PR checkbox; review scope free text; merge expectation unless defaulted; external update expectation unless defaulted
- required input fields: none
- optional context fields: review focus; known risks; validation expectations; open notes
- review scope fields: full PR checkbox -> wf-pr_review_scope_full_pr when selected; review scope free text -> required when full PR is not selected or when the user wants to narrow the review
- readiness/start gate: can start review when PR URL, source link or explicit none, target branch if not defaulted, either full PR is selected or review scope free text is provided, merge expectation if not defaulted, and external update expectation if not defaulted are answered or explicitly marked unknown/skip by the user

## new-task

- enabled: true
- purpose: plan or implement a new task, feature, bug fix, investigation, or documentation change
- required structured questions: source task/card link or explicit none; source system; implementation expectation; plan approval gate; review depth/pass; completion/merge gate; external update expectation
- required input fields: goal; milestones to confirm; scope boundaries; validation expectations; open notes
- readiness/start gate: do not start implementation until goal, milestones, scope, and gates are answered or explicitly marked unknown/skip by the user
