import fs from "node:fs/promises";
import path from "node:path";

export const id = "setup-chat-workflows";

const DEFAULT_PARTS_DIR = ".opencode/chat-workflows";
const MANAGED_WORKSPACE_PARTS_DIR = "projects/.opencode/chat-workflows";
const START_SESSION_COMMAND = "start-session";
const SETUP_COMMAND = "setup-chat-workflows";

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

async function pathExists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function defaultPartsDir(root) {
  if (await pathExists(resolvePath(root, "projects/.opencode"))) return MANAGED_WORKSPACE_PARTS_DIR;
  return DEFAULT_PARTS_DIR;
}

async function readParts(root, paths) {
  const entries = await Promise.all(Object.entries({
    project: paths.project,
    workflows: paths.workflows,
  }).map(async ([key, relativePath]) => {
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
  ].join("\n\n---\n\n");
}

function setupTree(paths) {
  return `Setup tree:

\`\`\`text
${paths.dir}/
├── project.md
│   ├── project label
│   ├── source systems
│   ├── issue tracker / mirror behavior
│   ├── external update defaults
│   ├── validation defaults
│   └── safety / posting / bypass rules
│
└── workflows.md
    ├── workflow sections
    ├── optional nested subworkflow sections
    ├── readiness/start gates
    └── workflow-local post-run actions, usually ending with /deepwork
\`\`\`

Files this command writes:

- \`${paths.project}\`
- \`${paths.workflows}\``;
}

function setupTemplate(paths, parts) {
  return `# Setup Chat Workflows

Considering optional prefill input:

$ARGUMENTS

Set up this project's structured chat workflows. Project defaults live in \`project.md\`; workflow definitions, subworkflows, readiness gates, and post-run actions live in \`workflows.md\`.

${setupTree(paths)}

Current injected setup files at OpenCode startup:

${injectedParts(parts)}

Rules:

- There is no separate actions file. Put post-run actions directly in each workflow or subworkflow as \`post-run actions:\`.
- Workflows may contain nested subworkflows using \`### <parent>/<subworkflow>\` sections or a \`subworkflows:\` field.
- Every workflow should normally include \`/deepwork\` as the final post-run action unless explicitly disabled.
- Do not assume workflows are named general/pr-review/new-task. Those are examples only.
- Do not post external comments or status updates. This command only writes local chat-workflows files.

First-run behavior:

1. State which of the two files are missing.
2. Ask one compact questionnaire using the \`question\` tool for what to create/update and all project/workflow/subworkflow details.
3. Render proposed markdown for both files.
4. Ask for confirmation before writing.
5. On confirmation, create \`${paths.dir}\`, write both files, validate they exist, and tell the user to restart OpenCode so \`/start-session\` is regenerated from the updated files.

The first questionnaire field must ask what the user wants to create or update:

- Full setup: project defaults + workflows/subworkflows
- Project defaults only
- Workflow definitions only
- Review current setup without writing

The questionnaire should include workflow names, optional subworkflows, required structured questions, required input fields, optional context fields, readiness/start gates, and post-run actions for each workflow/subworkflow.

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
- required input fields: <semicolon-separated list>
- optional context fields: <semicolon-separated list>
- subworkflows: <none | list of nested choices>
- post-run actions: <skill/command list, usually ending with /deepwork>
- readiness/start gate: <when this workflow is ready to start>

### <workflow-name>/<subworkflow-name>

- enabled: true
- parent workflow: <workflow-name>
- purpose: <when to use this subworkflow>
- inherited fields: <all | list>
- post-run actions: <subworkflow-specific actions, usually ending with /deepwork>
\`\`\`

Then ask with the \`question\` tool: "Write these chat workflows files?" Options: "Write files", "Edit fields", "Cancel".`;
}

function startSessionTemplate(paths, parts) {
  return `# Start Session Chat Workflows

Considering optional prefill input:

$ARGUMENTS

Start a structured chat workflow using the project chat-workflows files.

Lineage:

\`\`\`text
${paths.project}
${paths.workflows}
  -> injected into /setup-chat-workflows as editable setup files
  -> used to generate /start-session chat workflows
\`\`\`

Chat-workflows files injected at OpenCode startup:

${injectedParts(parts)}

Step 1: choose the workflow first.

- Use workflow names from \`${paths.workflows}\`.
- Include enabled top-level workflows and enabled nested subworkflows declared as \`### <parent>/<subworkflow>\` or via a workflow's \`subworkflows:\` field.
- Always start with a workflow picker using the \`question\` tool unless $ARGUMENTS unambiguously names exactly one configured workflow or subworkflow.

Step 2: ask the selected workflow or subworkflow questionnaire.

- Subworkflows inherit parent workflow requirements unless they explicitly override or narrow them.
- Ask one workflow-specific questionnaire using required structured questions, required input fields, useful optional context fields, readiness/start gate, inherited parent fields, and relevant project defaults.
- Use the \`question\` tool, not a plain console/text fill-in block.
- Omit questions already answered by $ARGUMENTS or project defaults unless confirmation is explicitly required.
- Include omitted default-derived values in the rendered workflow brief under \`defaults applied\`.

Step 3: include workflow-defined post-run actions.

- Read post-run actions from the selected workflow/subworkflow in \`${paths.workflows}\`; there is no separate actions file.
- Do not run actions before confirmation.
- Do not ask for a second confirmation after the user selects \`Confirm and start\`; the workflow brief confirmation is the only action confirmation.
- If an action names a skill such as \`wf-pr_review\`, load/use that skill after confirmation.
- If an action is \`/deepwork\`, load/use the \`deepwork\` skill or follow \`/deepwork\` behavior after the workflow-specific skill handoff. Every configured workflow should end with \`/deepwork\` unless explicitly disabled.
- If full PR is selected, include \`pr-review-full-pr\` in post-run actions and load/use it after the main workflow skill and before \`/deepwork\`.

Render a concise workflow brief with workflow, subworkflow, readiness, source links, focus, gates, validation, defaults applied, external updates, post-run actions, and open notes.

Then ask with the \`question\` tool: "Confirm this workflow brief and start?" Options: "Confirm and start", "Edit fields", "Cancel".

If confirmed and ready to start is yes, run configured post-run actions without any extra action-confirmation prompt, then continue the normal scheduler workflow.`;
}

export default async function opencodeWorkflowSessionSetup(input = {}, options = {}) {
  const root = projectRoot(input);
  const partsDir = stringOption(options, "partsDir", await defaultPartsDir(root));
  const paths = {
    dir: partsDir,
    project: stringOption(options, "projectPath", `${partsDir}/project.md`),
    workflows: stringOption(options, "workflowsPath", `${partsDir}/workflows.md`),
  };
  const startSessionCommand = stringOption(options, "startSessionCommand", START_SESSION_COMMAND);
  const setupCommand = stringOption(options, "setupCommand", SETUP_COMMAND);
  const overwrite = booleanOption(options, "overwrite", false);
  const parts = await readParts(root, paths);

  return {
    config: (config) => {
      config.command ??= {};

      if (overwrite || !config.command[startSessionCommand]) {
        config.command[startSessionCommand] = {
          description: "Start chat-workflow session setup",
          template: startSessionTemplate(paths, parts),
        };
      }

      if (overwrite || !config.command[setupCommand]) {
        config.command[setupCommand] = {
          description: "Configure project chat workflows",
          template: setupTemplate(paths, parts),
        };
      }
    },
  };
}
