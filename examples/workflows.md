# Workflow Catalog

## general

- enabled: true
- purpose: open discussion, explanation, quick investigation, or lightweight help that does not need structured task session setup
- required structured questions: none
- required input fields: none
- optional context fields: context; open notes
- readiness/start gate: can start immediately after the user confirms the brief
- post-run actions: load/use skill `wf-general`, then run `/deepwork` after session confirmation

## pr-review

- enabled: true
- purpose: review an existing pull request or merge request
- required structured questions: PR URL; review mode list (`review-only`, `review-and-fix`, `review-plan-and-fix`, `review-and-comment`, `review-and-merge`); review angles list (`general`, `source/scope`, `code/regression`, `validation/ops`); source task/card/work-item link or explicit none; target branch unless defaulted from project defaults; review scope (full PR or focused review free text); files to review; additional files to include; merge expectation unless defaulted; external update expectation unless defaulted
- required input fields: none
- optional context fields: source system; known risks; validation expectations; open notes
- readiness/start gate: can start review when PR URL is present, source link is present or marked none, review mode is selected (default to `review-only` unless user requested fixes/comments/merge), review scope is selected as full PR or focused text, and review angles are selected (or defaulted per scope) and gate defaults are applied
- post-run actions: load/use skill `wf-pr_review`, then run `/deepwork` after session confirmation

## new-task

- enabled: true
- purpose: plan or implement a new task, feature, bug fix, investigation, or documentation change
- required structured questions: source task/card/work-item link or explicit none; source system; fresh default branch from remote unless continuing current branch is explicitly selected; implementation expectation; plan approval gate; review depth/pass; completion/merge gate; external update expectation
- required input fields: goal; milestones; scope boundaries; validation expectations; open notes
- optional context fields: constraints; known risks; implementation notes; open notes
- readiness/start gate: can start implementation after goal, milestones, scope, implementation expectation, plan-approval gate, review depth/pass, completion/merge gate, and external update expectation are answered or explicitly marked unknown/skip by the user
- post-run actions: load/use skill `wf-new_task`, then run `/deepwork` after session confirmation
