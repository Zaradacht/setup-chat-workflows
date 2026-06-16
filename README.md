# setup-chat-workflows

OpenCode plugin that adds workflow-aware chatbot commands for a structured way of working. It ships generic starter examples for:

- `general`
- `pr-review`
- `new-task`

but these are only defaults. Teams can create any number of workflows such as `incident`, `release`, `design-review`, `support`, or anything else.

The plugin installs:

- `/setup-chat-workflows` — walks the user through configuring the project's workflow tree.
- `/start-session` — chooses or infers a workflow, asks only that workflow's required subset of questions, and starts only after the required session setup is satisfied or explicitly skipped.

## Human TL;DR

1. Install the plugin.
2. Restart OpenCode.
3. Run `/setup-chat-workflows` once.
4. Choose what to set up: project defaults, workflows, post-confirmation actions, or all of them.
5. Restart OpenCode.
6. Use `/start-session <what you want to do>`.

`/start-session` first asks the user to choose one configured workflow, then asks that selected workflow's own questionnaire, shows a brief, and starts after confirmation.

Post-session setup actions are optional follow-ups for the selected workflow only. The bundled examples use workflow skill names such as `wf-general`, `wf-pr_review`, and `wf-new_task`.

## Agent TL;DR

- `/setup-chat-workflows` owns configuration. In managed workspaces it creates or updates `projects/.opencode/chat-workflows/project.md` and `workflows.md`.
- Always ask what the user wants to edit first: full setup, project defaults only, workflow definitions only, workflow-local post-run actions, or review current setup.
- `/start-session` owns runtime session setup. It reads the configured workflow tree, asks a workflow-picker questionnaire first, then asks the selected workflow's own compact questionnaire, renders a brief, and waits for confirmation.
- Do not combine workflow selection and workflow-specific questions into one form. After workflow selection, compact required structured questions, required text fields, optional context, and gates into that workflow's questionnaire. Do not print console fill-in blocks unless the `question` tool is unavailable or fails.
- Post-session setup actions are scoped to the selected workflow. Apply the default action policy plus the matching `## <workflow-name>` section only. Never run all actions globally.
- Do not run post-confirmation actions before the user confirms the workflow brief, and do not ask for a second action-confirmation prompt after the brief is confirmed.

## Core lineage

```text
projects/.opencode/chat-workflows/project.md
projects/.opencode/chat-workflows/workflows.md
  -> injected into /setup-chat-workflows as editable setup parts
  -> used to generate /start-session chat workflows
```

OpenCode loads plugins at startup, so after `/setup-chat-workflows` writes a new config, restart OpenCode to regenerate `/start-session` from the updated workflow tree.

## Why

Most coding sessions are not the same. A general question should not require PR-review metadata. A PR review should require a PR link and source task/card context. A new task should require a goal, milestones, and approval/review gates.

This plugin lets a project define the required session setup subset per workflow. The workflow list is plug-and-play: edit `workflows.md` to add, remove, or rename workflows.

## Quickstart

Install in `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["setup-chat-workflows"]
}
```

For local development:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["file:///absolute/path/to/setup-chat-workflows"]
}
```

Restart OpenCode, then run:

```text
/setup-chat-workflows
```

That creates:

```text
projects/.opencode/chat-workflows/project.md
projects/.opencode/chat-workflows/workflows.md
```

Restart OpenCode again, then start work with:

```text
/start-session Review https://github.com/acme/app/pull/123
```

or:

```text
/start-session Implement the Trello card https://trello.com/c/abc123
```

## Workflow tree

```text
project workflow setup
├── projects/.opencode/chat-workflows/project.md
│   ├── project label
│   ├── source systems
│   ├── issue tracker / mirror behavior
│   ├── external update destination
│   ├── external update language/tone
│   └── default approval/safety rules
│
├── projects/.opencode/chat-workflows/workflows.md
│   ├── any number of workflow sections
│   ├── each workflow defines required structured questions
│   ├── each workflow defines required input fields
│   ├── each workflow defines readiness/start gates
│   ├── optional nested subworkflow sections
│   └── workflow-local post-run actions
│
└── output
    ├── write the chat-workflows files
    ├── restart OpenCode
    └── /start-session is generated from those parts
```

The example files included in this package define `general`, `pr-review`, and `new-task`, but the plugin itself does not require those names.

## What `/setup-chat-workflows` asks

It uses chatbot-style prompting, not a custom UI.

It should first ask what you want to create or update:

- full setup: project defaults + workflows + post-confirmation actions
- project defaults only
- workflow definitions only
- workflow-local post-run actions
- review current setup without writing

### 1. One setup form

It asks one compact setup form. The first field is what you want to create or update:

- full setup: project defaults + workflows + post-confirmation actions
- project defaults only
- workflow definitions only
- workflow-local post-run actions
- review current setup without writing

The same form includes fields such as:

- project source systems
- issue tracker relationship
- external update default
- default language
- starter workflow set: blank/custom, general+pr-review+new-task, incident/release, other
- default start gate
- workflow-local post-run action policy
- project label
- default source systems / source URL guidance
- default issue tracker project names or IDs
- external update destination and tone
- workflow names and required fields
- workflow-local post-run actions or skill calls
- approval / merge / completion rules
- external posting and branch/policy bypass rules

### 2. Rendered proposed markdown

It renders the proposed three files so the user can inspect them:

```text
projects/.opencode/chat-workflows/project.md
projects/.opencode/chat-workflows/workflows.md
```

### 3. Confirmation before writing

It asks:

```text
Write this chat workflows config?
- Write config
- Edit fields
- Cancel
```

It writes only after confirmation.

## If no config exists

No existing config is required.

If one or more chat-workflows files do not exist, `/setup-chat-workflows` treats the missing files as first-run setup and walks the user through creating them from scratch.

Requirements:

- OpenCode must allow `question`.
- OpenCode must allow file read/write/edit.
- The project directory, or at least `projects/.opencode/`, must be writable.
- No external API keys or services are required.

## What `/start-session` asks

`/start-session` first chooses or infers workflow type from `projects/.opencode/chat-workflows/workflows.md`.

It should ask a workflow picker first, then ask exactly one compact session questionnaire for the selected workflow. Required text fields, optional notes, and gate choices should be compacted into the selected workflow's questionnaire.

The package examples include these starter workflows:

### general

- no required subset by default
- can start after brief confirmation

### pr-review

Asks the minimal PR-review-specific required subset:

- PR URL
- source task/card link
- source system
- target branch
- PR scope, such as full PR, PBI only, Dataform only, recipient alignment only, notification/email behavior only, pipeline dependency only, docs/config only, or other
- review depth/pass
- merge expectation
- external update expectation

Optional context such as review focus, known risks, validation notes, and open notes should not trigger a second prompt unless the workflow explicitly marks those fields as required.

### new-task

Asks new-task-specific subset:

- source task/card link
- source system
- goal
- milestones to confirm
- implementation expectation
- plan approval gate
- review depth/pass
- completion/merge gate
- validation expectations

You can add more workflows by adding more `## <workflow-name>` sections to `workflows.md`. Put workflow-local post-run actions directly in each workflow or subworkflow.

## Post-run actions / skills

Each workflow can define post-run actions directly in `workflows.md`: optional next steps that `/start-session` runs after the user confirms the workflow brief. The brief confirmation is the only confirmation; do not add a second “confirm actions” prompt. Workflows can also contain nested subworkflows using `### <parent>/<subworkflow>` sections.

They are not setup-time actions. They are workflow-specific handoffs such as:

- for `general`: load/use the `wf-general` skill, then run `/deepwork` after session confirmation
- for `new-task`: load/use the `wf-new_task` skill, then run `/deepwork` after session confirmation
- for `pr-review`: load/use the `wf-pr_review` skill, then run `/deepwork` after session confirmation
- for `incident`: suggest an incident-debugging checklist after session confirmation

Examples:

```markdown
- workflow-local post-run action policy: run after confirmation
- post-run actions: /your-planning-command, then /deepwork after session confirmation
```

Rules:

- `/start-session` includes these actions in the rendered workflow brief.
- It does not run them before confirmation.
- If policy is `suggest only`, it asks whether to run them.
- If policy is `run after confirmation`, it runs them only after the user selects `Confirm and start`.

### Example: planning action for new-task

For a project that should suggest a planning command for new tasks:

```markdown
### new-task

- enabled: true
- required structured questions: source task/card link; source system; implementation expectation; plan approval gate; review depth/pass; completion/merge gate; external update expectation
- required input fields: goal; milestones to confirm; scope boundaries; validation expectations; open notes
- default review depth/pass: strong/4-pass for risky work
- start gate: do not start implementation until goal, milestones, and gates are answered or explicitly marked unknown/skip by the user
- post-run actions: /your-planning-command, then /deepwork after session confirmation
```

## Options

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    [
      "setup-chat-workflows",
      {
        "partsDir": "projects/.opencode/chat-workflows",
        "projectPath": "projects/.opencode/chat-workflows/project.md",
        "workflowsPath": "projects/.opencode/chat-workflows/workflows.md",
        "startSessionCommand": "start-session",
        "setupCommand": "setup-chat-workflows",
        "overwrite": false
      }
    ]
  ]
}
```

Options:

- `partsDir`: project-relative chat workflows directory. Defaults to `projects/.opencode/chat-workflows` when `projects/.opencode` exists, otherwise `.opencode/chat-workflows`.
- `projectPath`: project-relative project defaults file.
- `workflowsPath`: project-relative workflow catalog file.
- `startSessionCommand`: command name for chat-workflow session setup.
- `setupCommand`: command name for workflow setup.
- `overwrite`: when `false`, existing commands are preserved.

## Sharing with a team

Commit `projects/.opencode/chat-workflows/*.md` if the workflow defaults are safe and useful for everyone on the project.

Do not put secrets, raw tokens, or private credentials in the workflow config.

## Package contents

- `index.js`: OpenCode plugin entrypoint
- `examples/project.md`: example project defaults
- `examples/workflows.md`: example workflow catalog using generic `general`, `pr-review`, and `new-task` starters
- `README.md`: user docs

Source-only maintainer files such as `AGENTS.md` and `PUBLISHING.md` are intentionally not included in the npm package.

## Publish

1. Confirm the package name.
2. Run `npm pack --dry-run`.
3. Publish to npm.
4. Submit to `https://github.com/awesome-opencode/awesome-opencode`.

Suggested awesome-opencode description:

> Adds workflow-aware `/setup-chat-workflows` and `/start-session` commands for general, PR-review, and new-task session setup, backed by a per-project workflow tree.
>
> Alternative generic wording: Adds modular workflow-aware `/setup-chat-workflows` and `/start-session` commands backed by plug-and-play project and workflow files with workflow-local post-run actions.
