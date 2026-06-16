# opencode-workflow-intake

OpenCode plugin that adds workflow-aware chatbot commands for a structured way of working. It ships generic starter examples for:

- `general`
- `pr-review`
- `new-task`

but these are only defaults. Teams can create any number of workflows such as `incident`, `release`, `design-review`, `support`, or anything else.

The plugin installs:

- `/setup-workflows` — walks the user through configuring the project's workflow tree.
- `/new-session` — chooses or infers a workflow, asks only that workflow's required subset of questions, and starts only after the required intake is satisfied or explicitly skipped.

## Core lineage

```text
.opencode/workflow-intake/project.md
.opencode/workflow-intake/workflows.md
.opencode/workflow-intake/actions.md
  -> injected into /setup-workflows as editable setup parts
  -> used to generate /new-session workflow intake
```

OpenCode loads plugins at startup, so after `/setup-workflows` writes a new config, restart OpenCode to regenerate `/new-session` from the updated workflow tree.

## Why

Most coding sessions are not the same. A general question should not require PR-review metadata. A PR review should require a PR link and source task/card context. A new task should require a goal, milestones, and approval/review gates.

This plugin lets a project define the required intake subset per workflow. The workflow list is plug-and-play: edit `workflows.md` to add, remove, or rename workflows.

## Quickstart

Install in `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-workflow-intake"]
}
```

For local development:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["file:///absolute/path/to/opencode-workflow-intake"]
}
```

Restart OpenCode, then run:

```text
/setup-workflows
```

That creates:

```text
.opencode/workflow-intake/project.md
.opencode/workflow-intake/workflows.md
.opencode/workflow-intake/actions.md
```

Restart OpenCode again, then start work with:

```text
/new-session Review https://github.com/acme/app/pull/123
```

or:

```text
/new-session Implement the Trello card https://trello.com/c/abc123
```

## Workflow tree

```text
project workflow setup
├── .opencode/workflow-intake/project.md
│   ├── project label
│   ├── source systems
│   ├── issue tracker / mirror behavior
│   ├── external update destination
│   ├── external update language/tone
│   └── default approval/safety rules
│
├── .opencode/workflow-intake/workflows.md
│   ├── any number of workflow sections
│   ├── each workflow defines required structured questions
│   ├── each workflow defines required free-text fields
│   └── each workflow defines readiness/start gates
│
├── .opencode/workflow-intake/actions.md
│   ├── default action policy
│   ├── workflow-specific post-intake actions
│   └── optional commands or skills after confirmation
│
└── output
    ├── write the three workflow-intake files
    ├── restart OpenCode
    └── /new-session is generated from those parts
```

The example files included in this package define `general`, `pr-review`, and `new-task`, but the plugin itself does not require those names.

## What `/setup-workflows` asks

It uses chatbot-style prompting, not a custom UI.

### 1. One batched question form

It asks structured choices such as:

- project source systems
- issue tracker relationship
- external update default
- default language
- starter workflow set: blank/custom, general+pr-review+new-task, incident/release, other
- default start gate
- post-intake action policy

### 2. One free-text fill-in block

It asks fields such as:

```text
project label:
default source systems / source URL guidance:
default issue tracker project names or IDs:
external update destination and tone:
general workflow notes:
pr-review required source links:
pr-review required review passes:
new-task required source links:
new-task required goal/milestone format:
other workflow names and required fields:
default validation expectations:
post-intake actions or skill calls for general:
post-intake actions or skill calls for pr-review:
post-intake actions or skill calls for new-task:
post-intake actions or skill calls for other workflows:
approval / merge / completion rules:
external posting rule:
branch or policy bypass rule:
extra project-specific workflow notes:
```

### 3. Rendered proposed markdown

It renders the proposed three files so the user can inspect them:

```text
.opencode/workflow-intake/project.md
.opencode/workflow-intake/workflows.md
.opencode/workflow-intake/actions.md
```

### 4. Confirmation before writing

It asks:

```text
Write this workflow intake config?
- Write config
- Edit fields
- Cancel
```

It writes only after confirmation.

## If no config exists

No existing config is required.

If one or more workflow-intake files do not exist, `/setup-workflows` treats the missing files as first-run setup and walks the user through creating them from scratch.

Requirements:

- OpenCode must allow `question`.
- OpenCode must allow file read/write/edit.
- The project directory, or at least `.opencode/`, must be writable.
- No external API keys or services are required.

## What `/new-session` asks

`/new-session` first chooses or infers workflow type from `.opencode/workflow-intake/workflows.md`.

The package examples include these starter workflows:

### general

- no required subset by default
- can start after brief confirmation

### pr-review

Asks PR-review-specific subset:

- PR URL
- source task/card link
- source system
- target branch
- review depth/pass
- merge expectation
- external update expectation
- review focus / risks / validation notes

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

You can add more workflows by adding more `## <workflow-name>` sections to `workflows.md` and matching action sections in `actions.md`.

## Post-intake actions / skills

Each workflow can define post-intake actions, such as slash commands or skills to run after the user confirms the workflow brief.

Examples:

```markdown
- post-intake action policy: run after confirmation
- post-intake actions / skills: /your-planning-command after intake confirmation
```

Rules:

- `/new-session` includes these actions in the rendered workflow brief.
- It does not run them before confirmation.
- If policy is `suggest only`, it asks whether to run them.
- If policy is `run after confirmation`, it runs them only after the user selects `Confirm and start`.

### Example: planning action for new-task

For a project that should suggest a planning command for new tasks:

```markdown
### new-task

- enabled: true
- required structured questions: source task/card link; source system; implementation expectation; plan approval gate; review depth/pass; completion/merge gate; external update expectation
- required free-text fields: goal; milestones to confirm; scope boundaries; validation expectations; open notes
- default review depth/pass: strong/4-pass for risky work
- start gate: do not start implementation until goal, milestones, and gates are answered or explicitly marked unknown/skip by the user
- post-intake actions / skills: /your-planning-command after intake confirmation
```

## Options

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    [
      "opencode-workflow-intake",
      {
        "projectPath": ".opencode/workflow-intake/project.md",
        "workflowsPath": ".opencode/workflow-intake/workflows.md",
        "actionsPath": ".opencode/workflow-intake/actions.md",
        "newSessionCommand": "new-session",
        "setupCommand": "setup-workflows",
        "overwrite": false
      }
    ]
  ]
}
```

Options:

- `projectPath`: project-relative project defaults file.
- `workflowsPath`: project-relative workflow catalog file.
- `actionsPath`: project-relative post-intake actions file.
- `newSessionCommand`: command name for workflow-aware intake.
- `setupCommand`: command name for workflow setup.
- `overwrite`: when `false`, existing commands are preserved.

## Sharing with a team

Commit `.opencode/workflow-intake/*.md` if the workflow defaults are safe and useful for everyone on the project.

Do not put secrets, raw tokens, or private credentials in the workflow config.

## Package contents

- `index.js`: OpenCode plugin entrypoint
- `examples/project.md`: example project defaults
- `examples/workflows.md`: example workflow catalog using generic `general`, `pr-review`, and `new-task` starters
- `examples/actions.md`: example post-intake actions
- `README.md`: user docs

Source-only maintainer files such as `AGENTS.md` and `PUBLISHING.md` are intentionally not included in the npm package.

## Publish

1. Confirm the package name.
2. Run `npm pack --dry-run`.
3. Publish to npm.
4. Submit to `https://github.com/awesome-opencode/awesome-opencode`.

Suggested awesome-opencode description:

> Adds workflow-aware `/setup-workflows` and `/new-session` commands for general, PR-review, and new-task intake, backed by a per-project workflow tree.
>
> Alternative generic wording: Adds modular workflow-aware `/setup-workflows` and `/new-session` commands backed by plug-and-play project, workflow, and post-intake action files.
