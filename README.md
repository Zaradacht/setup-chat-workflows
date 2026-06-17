# opencode-chat-workflow-setup

Structured chat sessions, shipped as an **OpenCode plugin**.

`opencode-chat-workflow-setup` lets teams define how a session should be started before any heavy lifting happens. A session workflow asks for the right context first, then hands off to existing actions/skills only when the session is confirmed.

Package/plugin name is `opencode-chat-workflow-setup`; the user-facing setup command remains `/setup-chat-workflows` for continuity.

It is a **public, generic plugin**. It does not depend on private Devkit infrastructure.

## Why this plugin exists

Different tasks need different setup before work can begin:

- A general question often needs only a brief context.
- A PR review needs PR links, review mode, and angle selection.
- A task plan often needs milestones, gate decisions, and validation expectations.

`opencode-chat-workflow-setup` encodes those requirements in `workflows.md` so each project can control what gets asked and when.

## Commands (v0.3.4)

This plugin registers:

- `/setup-chat-workflows` — guided setup and editing of project workflow files.
- `/start-session` — interactive startup: choose a workflow, answer its focused questions, confirm, then continue.
- `/workflow-template` — create, list, explain, import, export, create/update, and seed reusable markdown templates.

## What the flow looks like

1. **Install plugin** in `opencode.json` (or local file path for development).
2. **Restart OpenCode**.
3. Run `/setup-chat-workflows` to define:
   - project defaults (`project.md`)
   - workflow catalog (`workflows.md`)
   - optional project templates (`templates/`)
4. Confirm generated files, then **restart OpenCode**.
5. Start work with `/start-session ...`.
6. If needed, manage template packs with `/workflow-template` (including seeding built-ins into your local `templates/` directory).

For fast setup flow, `/start-session` applies matching project defaults automatically and only asks required fields that are still missing.

## Quickstart

Install plugin:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-chat-workflow-setup"]
}
```

Run setup:

```text
/setup-chat-workflows
```

Then start a flow:

```text
/start-session Review https://github.com/example/repo/pull/123
```

```text
/start-session Implement the ticket https://tracker.example.com/TICKET-123
```

## Core idea: workflows before skills

Skills are execution playbooks ("how to do X").

Workflows are intake questions ("what is needed before doing X").

This plugin keeps that boundary clean:

- `/start-session` asks required fields first; optional context is requested only when needed.
- Project defaults from `project.md` are pre-applied. Required fields already satisfied by defaults are shown under a concise `defaults applied` section instead of being re-asked.
- It renders a concise workflow brief.
- It confirms with the user once (`Start this workflow?`).
- Only then does it proceed to configured post-run actions (for example `wf-pr_review`, `/deepwork`), or to actions declared by referenced components.
- Lifecycle commands can also use components. `/start-session` can use a `repo-refresh` component for clean repository bootstrapping, and `/end-session` can use a `cleanup` component.

## Built-in vs project template packs

Two template sources are supported:

- **Built-in templates** (public defaults shipped with package):
  - `general`
  - `pr-review`
  - `new-task`
  - `incident`
  - `release`
  - `design-review`
- **Project templates** (your team-owned overrides/packs):
  - defaults to `<partsDir>/templates`
  - default `partsDir` is `projects/.opencode/chat-workflows` in managed workspaces,
    or `.opencode/chat-workflows` otherwise.

Template variable syntax is `{{variable_name}}` (for example `{{project_label}}`, `{{workflow_name}}`).

## `/workflow-template`: local-first template management

Available operations:

- `list` — inspect available built-in and project templates.
- `create` / `create-update` — create or update templates.
- `explain` — show metadata, detected variables, and full template content.
- `import` — load from local path or pasted text (remote imports only after explicit approval).
- `export` — dump built-in, project, or both templates to a local markdown pack.
- `seed` — copy built-in templates into project `templates/` as editable local copies.

Template behavior:

- Built-in package templates are always available, even before seeding.
- Seeding renders a preview before writing, then asks for confirmation.
- Project templates are optional; teams can skip seeding and keep package defaults as references only.

Safety and behavior rules:

- **Local-first**: reads/writes are file-first; no remote fetching unless the user explicitly approves.
- **Template replacement**:
  - Prompt for missing values.
  - Show a rendered preview before writing.
  - Keep unknown placeholders by default unless user explicitly requests removal.
- **No external posting by default** and no automatic remote source fetch.

### Concise workflow/template snippet

```markdown
template: quick-review
name: Quick Review
description: Fast PR review starter with focused defaults.
variables:
  - workflow_name
  - workflow_components
  - review_mode

## {{workflow_name}}

- enabled: true
- purpose: Run a scoped review before implementation proceeds.
- required structured questions: PR URL; review mode (`review-only`, `review-and-fix`, `review-and-comment`); review scope
- required input fields: goal; changed files
- optional context fields: risk notes; validation expectations
- readiness/start gate: can start once PR URL, review mode, and scope are provided
- post-run actions: wf-pr_review, then /deepwork
```

## PR modes and review angles

The built-in `pr-review` template now stays minimal and references review components for executable behavior:

- Set `components:` to `project-selector; review; repo-refresh` (or a custom selector/review/repo-refresh component set).
- `review` component values (modes, default mode, and actions) are configured in `project.md`.
- `workflows.md` then delegates hard-coded behavior to components.

Default-aware behavior stays controlled per project while keeping workflow files reusable.

## Workflow components (first-class)

Components make project defaults and workflow behavior reusable.

In `project.md`, components are declared once and can be reused by any workflow:

```text
- component project-selector: concerned repository/project selector; choices: `repo-a`; `repo-b`; include cross-project: true; include free text: true
- component review: PR review orchestration; skills/actions: wf-pr_review, pr-review-all; default mode: review-only; modes: review-only, review-and-fix, review-and-comment
- component repo-refresh: start-session repository refresh; after start confirmation: require clean git status, switch to detected/default branch, fetch/pull latest default branch; default branch: main; applies to: selected project-selector value or current repository; skip dirty repos unless user approves stash/commit/discard
- component cleanup: end-session repository cleanup; when git used or PR merged: fetch/pull latest default branch and leave repository on default branch; applies to: selected project-selector value; skip dirty repos unless user approves stash/commit/discard
- component achievement: end-session achievement capture; fields: ticket/source link, PR link, repo/project, ownership, status, validation, cleanup, impact, next action
- component message: reusable wrap-up metadata line; format: Metadata: ticket/source: <link or none>; PR: <link or none>; repo/project: <value or unknown>; status: <status>; validation: <evidence or not run>; cleanup: <status>; next: <next action or none known>
```

In `workflows.md`, reference components instead of repeating lists:

```text
- components: project-selector; review; repo-refresh
```

The `/start-session` template resolves `components:` first, then applies project defaults and asks only missing fields. A `repo-refresh` component runs after Start confirmation, before workflow and component post-run actions.

Lifecycle commands can resolve the same component registry. A `/end-session` workflow should use `component cleanup` when present: if git was used, commits were pushed, or a PR was merged/completed, each touched repository should be returned to the default branch and updated from remote before the session closes. Dirty working trees must not be discarded silently.

`component achievement` and `component message` let end-session capture enough reusable source material for daily wrapups: source/ticket link, PR link, repo/project, ownership, status, validation, cleanup, impact, and concrete next action. The metadata line is internal source material; daily-wrapup can decide whether to include or omit links in the final audience-facing text.

## What gets created

On first run, `/setup-chat-workflows` generates:

```text
projects/.opencode/chat-workflows/project.md
projects/.opencode/chat-workflows/workflows.md
```

and optional templates in:

```text
projects/.opencode/chat-workflows/templates/
```

### Typical `workflows.md` shape

```text
## <workflow-name>
- enabled: true
- required structured questions: ...
- required input fields: ...
- optional context fields: ...
- readiness/start gate: ...
- post-run actions: /deepwork
### <workflow-name>/<subworkflow-name> (optional)
- inherited fields: ...
```

Nested subworkflows are supported via `### parent/subworkflow` sections.

## Post-run actions

Actions are workflow-local and optional.

- Defined in each workflow block via `post-run actions`.
- Applied only for the selected workflow/subworkflow.
- Expected default is to run configured actions (commonly ending with `/deepwork`) after confirmation.
- No action runs before explicit workflow confirmation.

## Options

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    [
      "opencode-chat-workflow-setup",
      {
        "partsDir": "projects/.opencode/chat-workflows",
        "projectPath": "projects/.opencode/chat-workflows/project.md",
        "workflowsPath": "projects/.opencode/chat-workflows/workflows.md",
        "templatesDir": "projects/.opencode/chat-workflows/templates",
        "builtInTemplatesDir": "./templates",
        "templateCommand": "workflow-template",
        "startSessionCommand": "start-session",
        "setupCommand": "setup-chat-workflows",
        "overwrite": false
      }
    ]
  ]
}
```

Option notes:

- `partsDir`: project relative root for workflow files (`project.md` + `workflows.md`).
- `projectPath`: custom path for project defaults file.
- `workflowsPath`: custom path for workflow catalog.
- `templatesDir`: directory for project template markdown packs.
- `builtInTemplatesDir`: directory for built-in templates (defaults to package `templates/`).
- `templateCommand`: name of template command (defaults to `workflow-template`).
- `startSessionCommand`: command name for session startup (defaults to `start-session`).
- `setupCommand`: command name for setup command (defaults to `setup-chat-workflows`).
- `overwrite`: keep `false` to preserve existing command mappings.

## Requirements

- OpenCode must allow `question` + file read/write/edit.
- Project directory (at least `projects/.opencode/`) must be writable.
- No external API keys are required.

## Package contents

- `index.js` (plugin entrypoint)
- `examples/project.md` (starter project defaults)
- `examples/workflows.md` (starter workflow catalog)
- `templates/` (built-in templates)
- `README.md`

Maintainer files such as `AGENTS.md` and `PUBLISHING.md` are excluded from npm packaging.

## Publishing notes

1. Confirm package metadata.
2. Run `npm pack --dry-run`.
3. Publish to npm.
4. Submit plugin to `https://github.com/awesome-opencode/awesome-opencode`.

Suggested registry description:

> Adds `/setup-chat-workflows`, `/start-session`, and `/workflow-template` for local-first workflow setup with reusable markdown templates (`{{variable_name}}` placeholders), default-aware intake, configurable post-session actions, and generic public defaults.
