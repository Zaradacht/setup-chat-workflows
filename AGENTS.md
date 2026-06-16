# AGENTS

## Purpose

This repository contains an OpenCode plugin that injects workflow-aware chatbot commands:

- `/setup-chat-workflows`
- `/new-session`

The plugin is meant to be shareable on `awesome-opencode` and installable as a normal npm package.

## Workflow model

The plugin supports any number of user-defined workflows. The repository ships generic starter examples for:

- `general`: no required subset of questions by default.
- `pr-review`: requires PR/source/review context before starting.
- `new-task`: requires source/goal/milestones/gates before starting.

These are examples, not hardcoded requirements. Workflows may define post-intake actions / skills, such as planning or review commands, which `/new-session` should run or suggest only after the workflow brief is confirmed.

Lineage:

```text
.opencode/workflow-intake/project.md
.opencode/workflow-intake/workflows.md
.opencode/workflow-intake/actions.md
  -> injected into /setup-chat-workflows as editable setup parts
  -> used to generate /new-session workflow intake
```

## Key files

- `index.js`: plugin entrypoint and command-template injection
- `examples/project.md`: safe example project defaults
- `examples/workflows.md`: safe example workflow catalog
- `examples/actions.md`: safe example post-intake actions
- `README.md`: user-facing docs
- `package.json`: npm and OpenCode plugin metadata

## Design rules

- Keep the plugin dependency-free.
- Do not store secrets in examples or workflow configs.
- Keep command behavior portable: no user-specific paths, client names, or Devkit assumptions.
- Commands should remain chatbot-style prompts, not a custom UI.
- Existing user commands should not be overwritten unless the `overwrite` option is true.

## Compatibility

- Preserve `export const id`.
- Preserve the default plugin function returning a `config` hook.
- Preserve `oc-plugin` metadata in `package.json`.

## Validation

Minimum checks after edits:

```bash
node --check index.js
node -e "import('./index.js').then(m => console.log(m.id))"
npm pack --dry-run
```
