# Project Defaults

- project label: Example Project
- source systems: GitHub; issue tracker; project documentation
- issue tracker relationship: primary source tracking or ask each time
- issue tracker projects: none configured by default
- external updates: draft only unless explicitly approved
- external update language/tone: English; concise, clear, professional
- validation expectations: agent should propose the smallest relevant checks unless commands are provided
- external posting: never post external comments or status updates without explicit approval
- branch/policy bypass: never bypass unless explicitly requested for a specific PR in the current turn
- component project-selector: concerned repository/project selector; choices: `repo-a`; `repo-b`; include cross-project: true; include free text: true
- component review: PR review orchestration; skills/actions: wf-pr_review, pr-review-all; default mode: review-only; modes: review-only, review-and-fix, review-and-comment
- component cleanup: end-session repository cleanup; when git used or PR merged: fetch/pull latest default branch and leave repository on default branch; applies to: selected project-selector value; skip dirty repos unless user approves stash/commit/discard
- component achievement: end-session achievement capture; fields: ticket/source link, PR link, repo/project, ownership, status, validation, cleanup, impact, next action
- component message: reusable wrap-up metadata line; format: Metadata: ticket/source: <link or none>; PR: <link or none>; repo/project: <value or unknown>; status: <status>; validation: <evidence or not run>; cleanup: <status>; next: <next action or none known>
