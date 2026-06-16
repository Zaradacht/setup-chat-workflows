# Workflow Catalog

## general

- enabled: true
- purpose: open discussion, explanation, quick investigation, or lightweight help that does not need structured task intake
- required structured questions: none
- required free-text fields: optional context; open notes
- readiness/start gate: can start immediately after the user confirms the brief

## pr-review

- enabled: true
- purpose: review an existing pull request or merge request
- required structured questions: PR URL; source task/card link or explicit none; source system; target branch; review depth/pass; merge expectation; external update expectation
- required free-text fields: review focus; known risks; validation expectations; open notes
- readiness/start gate: do not start review until required PR review context is answered or explicitly marked unknown/skip by the user

## new-task

- enabled: true
- purpose: plan or implement a new task, feature, bug fix, investigation, or documentation change
- required structured questions: source task/card link or explicit none; source system; implementation expectation; plan approval gate; review depth/pass; completion/merge gate; external update expectation
- required free-text fields: goal; milestones to confirm; scope boundaries; validation expectations; open notes
- readiness/start gate: do not start implementation until goal, milestones, scope, and gates are answered or explicitly marked unknown/skip by the user
