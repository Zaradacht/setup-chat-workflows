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
- components: project-selector; review
- required structured questions: PR URL; review mode from review component unless inferable; optional source link; optional review focus
- required input fields: none
- optional context fields: source system; known risks; validation expectations; open notes
- readiness/start gate: can start review when PR URL and project selector choice are present, and review mode from component is selected (or defaulted); then run workflow component actions
- post-run actions: run component actions

## new-task

- enabled: true
- purpose: plan or implement a new task, feature, bug fix, investigation, or documentation change
- components: project-selector
- required structured questions: source link or explicit none; task goal; expected outcome
- required input fields: goal; milestones; scope boundaries; validation expectations; open notes
- optional context fields: constraints; known risks; implementation notes; open notes
- readiness/start gate: can start once source choice, goal, expected outcome, and project selector choice are known (or inferred); branch and implementation safety gates are owned by workflow implementation steps
- post-run actions: use workflow-local actions
