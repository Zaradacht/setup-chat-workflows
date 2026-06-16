import fs from "node:fs/promises";
import path from "node:path";

export const id = "opencode-workflow-intake";

const PARTS_DIR = ".opencode/workflow-intake";
const PROJECT_FILE = `${PARTS_DIR}/project.md`;
const WORKFLOWS_FILE = `${PARTS_DIR}/workflows.md`;
const ACTIONS_FILE = `${PARTS_DIR}/actions.md`;
const NEW_SESSION_COMMAND = "new-session";
const SETUP_COMMAND = "setup-workflows";

function stringOption(options, key, fallback) {
  const value = options?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function booleanOption(options, key, fallback) {
  const value = options?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function projectRoot(input) {
  for (const value of [input?.directory, input?.project?.directory, input?.project?.root, process.cwd()]) {
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return process.cwd();
}

function resolvePath(root, filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
}

async function readText(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return content.trim().length > 0 ? content.trim() : null;
  } catch {
    return null;
  }
}

async function readParts(root, paths) {
  const entries = await Promise.all(Object.entries(paths).map(async ([key, relativePath]) => {
    const absolutePath = resolvePath(root, relativePath);
    const content = await readText(absolutePath);
    return [key, { relativePath, absolutePath, content }];
  }));
  return Object.fromEntries(entries);
}

function partBlock(title, part, fallback) {
  return `## ${title}

Path: \`${part.relativePath}\`

Resolved path at startup: \`${part.absolutePath}\`

${part.content ?? fallback}`;
}

function injectedParts(parts) {
  return [
    partBlock("Project defaults", parts.project, "_No project defaults file exists yet._"),
    partBlock("Workflow catalog", parts.workflows, "_No workflow catalog file exists yet._"),
    partBlock("Post-intake actions / skills", parts.actions, "_No actions file exists yet._"),
  ].join("\n\n---\n\n");
}

function setupTree(paths) {
  return `Plug-and-play setup tree:

\`\`\`text
${PARTS_DIR}/
├── project.md
│   ├── project label
│   ├── source systems
│   ├── issue tracker / mirror behavior
│   ├── external update defaults
│   ├── validation defaults
│   └── safety / posting / bypass rules
│
├── workflows.md
│   ├── any number of workflow sections
│   ├── each workflow defines required structured questions
│   ├── each workflow defines required free-text fields
│   ├── each workflow defines start/readiness gates
│   └── examples could be general, pr-review, new-task, incident, release, design-review, etc.
│
└── actions.md
    ├── post-intake action policy
    ├── workflow-specific commands or skills
    ├── suggest-only actions
    └── run-after-confirmation actions
\`\`\`

Files this command writes:

- \`${paths.project}\`
- \`${paths.workflows}\`
- \`${paths.actions}\``;
}

function setupTemplate(paths, parts) {
  return `# Setup Workflow Intake

Considering optional prefill input:

$ARGUMENTS

Set up this project's structured workflow intake. The setup is modular and upgradable: project defaults, workflow definitions, and post-intake actions live in separate plug-and-play files.

${setupTree(paths)}

Current injected setup parts at OpenCode startup:

${injectedParts(parts)}

Requirements:

- OpenCode must allow \`question\`, file read, and file edit/write.
- The current project directory must be writable, or at least \`${PARTS_DIR}\` must be creatable/writable.
- No existing files are required. If any of the three files are missing, this is first-run setup for that part.
- No external services, API keys, issue trackers, or project IDs are required.
- Do not post external comments or status updates. This command only writes local workflow-intake files.

Important generic rule:

- Do not assume the workflows are named general/pr-review/new-task. Those are valid examples, not required names.
- Let the user define as many workflows as they want; this setup supports any number of workflows.
- Each workflow should declare the subset of questions required before that workflow is considered ready to start.

First-run behavior:

1. State which of the three files are missing.
2. Ask one batched \`question\` form for high-level setup choices.
3. Ask one compact free-text fill-in block for project/workflow/action details.
4. Render proposed markdown for all three files.
5. Ask for confirmation before writing.
6. On confirmation, create \`${PARTS_DIR}\`, write all three files, validate they exist, and tell the user to restart OpenCode so \`/new-session\` is regenerated from the updated parts.

One batched \`question\` form should ask:

- starter workflow set: blank/custom, general+pr-review+new-task, incident/release, other
- source systems: Trello, Notion, Azure DevOps, Linear, GitHub, Bitbucket, mixed, none/unknown
- issue tracker relationship: primary source tracking, private mirror only, no tracker, ask each time
- external update default: draft only, post after approval, no external updates, ask each time
- default external update language: English, French, ask each time, other
- post-intake action policy: none, suggest only, run after confirmation
- default readiness rule: require all fields, allow explicit unknown/skip, ask each time

One compact free-text fill-in block should ask:

\`\`\`text
project label:
project defaults and safety rules:
workflow names to create:
for each workflow, required structured questions:
for each workflow, required free-text fields:
for each workflow, readiness/start gate:
for each workflow, post-intake actions or skills:
default validation expectations:
external update destination and tone:
extra project-specific workflow notes:
\`\`\`

Render proposed files using this shape:

\`\`\`markdown
// ${paths.project}
# Project Defaults

- project label: <label>
- source systems: <...>
- issue tracker relationship: <...>
- issue tracker projects: <...>
- external updates: <...>
- external update language/tone: <...>
- validation expectations: <...>
- external posting: never post external comments or status updates without explicit approval
- branch/policy bypass: never bypass unless explicitly requested for a specific PR in the current turn

// ${paths.workflows}
# Workflow Catalog

## <workflow-name>

- enabled: true
- purpose: <when to use this workflow>
- required structured questions: <semicolon-separated list>
- required free-text fields: <semicolon-separated list>
- readiness/start gate: <when this workflow is ready to start>

// ${paths.actions}
# Post-Intake Actions / Skills

- default action policy: <none | suggest only | run after confirmation>

## <workflow-name>

- post-intake actions / skills: <none | command/skill list>
\`\`\`

Then ask with the \`question\` tool: "Write these workflow intake files?" Options: "Write files", "Edit fields", "Cancel".

If confirmed, write all three files. If writing is denied, show the three markdown blocks so the user can save them manually.`;
}

function newSessionTemplate(paths, parts) {
  return `# New Session Workflow Intake

Considering optional prefill input:

$ARGUMENTS

Start a structured workflow using the project workflow-intake parts.

Lineage:

\`\`\`text
${paths.project}
${paths.workflows}
${paths.actions}
  -> injected into /setup-workflows as editable setup parts
  -> used to generate /new-session workflow intake
\`\`\`

Workflow-intake parts injected at OpenCode startup:

${injectedParts(parts)}

If the user says the workflow files changed during this OpenCode session, read the three files again before asking questions.

If no workflow catalog exists, use a minimal fallback:

- Ask what workflow the user wants to start.
- Ask what fields are required before starting.
- Recommend running \`/setup-workflows\` once.

Step 1: infer or ask for workflow type using one \`question\` tool call.

- Use the workflow names from \`${paths.workflows}\`.
- Do not assume fixed workflow names.
- If $ARGUMENTS clearly matches a workflow's purpose, preselect that workflow.
- Otherwise ask the user to choose from configured workflows, plus "other/custom".

Step 2: ask only the selected workflow's required subset.

- Read the selected workflow's "required structured questions" and ask those in one batched \`question\` tool call.
- Read the selected workflow's "required free-text fields" and ask those in one compact fill-in block.
- Always allow unknown, TBD, none, or skip when the workflow allows explicit unknown/skip.
- A workflow is ready to start only when its configured required subset has answers or the user explicitly marks missing items unknown/skip.

Step 3: include post-intake actions / skills.

- Read \`${paths.actions}\` for workflow-specific actions.
- Include relevant actions in the workflow brief under "post-intake actions".
- Do not run actions before confirmation.
- If policy is "suggest only", ask whether to run them.
- If policy is "run after confirmation", run them only after the user selects "Confirm and start".
- If an action is a slash command such as \`/your-planning-command\`, call that command or follow its equivalent loaded skill behavior after confirmation.

After collecting the selected workflow's required subset, render a concise workflow brief:

\`\`\`text
workflow: <configured workflow name>
ready to start: <yes | no, missing fields: ...>

source / links:
- <relevant source links>

goal / focus:
<workflow-specific goal or focus>

gates:
- <workflow-specific gates>

validation:
- <...>

external updates:
- <...>

post-intake actions:
- <skills or slash commands to run/suggest after confirmation, or none>

open notes:
- <...>
\`\`\`

Then ask with the \`question\` tool: "Confirm this workflow brief and start?" Options: "Confirm and start", "Edit fields", "Cancel".

If confirmed and ready to start is yes, run/suggest configured post-intake actions as specified, then begin the normal scheduler workflow. If not ready, ask for missing required fields. If edit, ask which fields to edit. If cancel, stop.`;
}

export default async function opencodeWorkflowIntake(input = {}, options = {}) {
  const paths = {
    project: stringOption(options, "projectPath", PROJECT_FILE),
    workflows: stringOption(options, "workflowsPath", WORKFLOWS_FILE),
    actions: stringOption(options, "actionsPath", ACTIONS_FILE),
  };
  const newSessionCommand = stringOption(options, "newSessionCommand", NEW_SESSION_COMMAND);
  const setupCommand = stringOption(options, "setupCommand", SETUP_COMMAND);
  const overwrite = booleanOption(options, "overwrite", false);
  const root = projectRoot(input);
  const parts = await readParts(root, paths);

  return {
    config: (config) => {
      config.command ??= {};

      if (overwrite || !config.command[newSessionCommand]) {
        config.command[newSessionCommand] = {
          description: "Start workflow-aware task intake",
          template: newSessionTemplate(paths, parts),
        };
      }

      if (overwrite || !config.command[setupCommand]) {
        config.command[setupCommand] = {
          description: "Configure project workflow intake",
          template: setupTemplate(paths, parts),
        };
      }
    },
  };
}
