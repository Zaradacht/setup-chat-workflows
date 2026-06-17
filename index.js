import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const id = "opencode-chat-workflow-setup";

const DEFAULT_PARTS_DIR = ".opencode/chat-workflows";
const MANAGED_WORKSPACE_PARTS_DIR = "projects/.opencode/chat-workflows";
const DEFAULT_TEMPLATE_DIR_NAME = "templates";
const START_SESSION_COMMAND = "start-session";
const SETUP_COMMAND = "setup-chat-workflows";
const TEMPLATE_COMMAND = "workflow-template";
const TEMPLATE_FILE_EXT = ".md";
const DEFAULT_BUILT_IN_TEMPLATES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "templates");

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

function uniqueStrings(values) {
  const set = new Set();
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) set.add(trimmed);
    }
  }
  return [...set];
}

function templateMetadataFromYamlLikeBlock(content) {
  const match = content.match(/^\s*---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};

  const metadata = {};
  const lines = match[1].split(/\r?\n/);
  let currentKey = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const listMatch = line.match(/^[-*]\s+(.+)/);
    if (listMatch && currentKey) {
      const value = listMatch[1].trim();
      if (value) {
        metadata[currentKey] = metadata[currentKey] || [];
        metadata[currentKey].push(value);
      }
      continue;
    }

    const fieldMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!fieldMatch) continue;

    const key = fieldMatch[1].trim();
    const value = fieldMatch[2].trim();
    if (value.length > 0) {
      metadata[key] = value;
      currentKey = null;
    } else {
      metadata[key] = [];
      currentKey = key;
    }
  }

  return metadata;
}

function extractTemplateVariables(content) {
  const variablePattern = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  const matches = new Set();
  let match;
  while ((match = variablePattern.exec(content)) !== null) {
    if (match[1]) matches.add(match[1]);
  }
  return [...matches];
}

function templateRecord(source, relativePath, absolutePath, content) {
  const metadata = templateMetadataFromYamlLikeBlock(content);
  const fallbackName = path.basename(relativePath, TEMPLATE_FILE_EXT);
  const metadataName =
    typeof metadata.template === "string" && metadata.template.trim().length > 0
      ? metadata.template.trim()
      : typeof metadata.name === "string" && metadata.name.trim().length > 0
        ? metadata.name.trim()
        : fallbackName;

  const metadataDesc =
    typeof metadata.description === "string" && metadata.description.trim().length > 0
      ? metadata.description.trim()
      : "Reusable workflow template";

  const metadataVariables = uniqueStrings(Array.isArray(metadata.variables) ? metadata.variables : []);
  const variables =
    metadataVariables.length > 0
      ? metadataVariables
      : extractTemplateVariables(content).filter((name) => !["workflow_name"].includes(name));

  return {
    id: relativePath,
    name: metadataName,
    description: metadataDesc,
    source,
    relativePath,
    absolutePath,
    content,
    variables: uniqueStrings(variables),
    postRunActions: Array.isArray(metadata.post_run_actions)
      ? uniqueStrings(metadata.post_run_actions)
      : typeof metadata.post_run_actions === "string"
        ? uniqueStrings(metadata.post_run_actions.split(",").map((value) => value.trim()))
        : [],
  };
}

async function collectMarkdownTemplatesFromDir(absoluteDir, source) {
  const templates = [];
  try {
    const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(absoluteDir, entry.name);
      if (entry.isDirectory()) {
        templates.push(...await collectMarkdownTemplatesFromDir(next, source));
        continue;
      }

      if (entry.isFile() && path.extname(entry.name) === TEMPLATE_FILE_EXT) {
        const content = await readText(next);
        if (content) {
          const relativePath = path.relative(absoluteDir, next);
          templates.push(templateRecord(source, relativePath, next, content));
        }
      }
    }
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    return [];
  }

  return templates;
}

async function readTemplateSources(root, paths) {
  const builtIn = await collectMarkdownTemplatesFromDir(paths.builtInTemplates, "built-in");
  const project = await collectMarkdownTemplatesFromDir(resolvePath(root, paths.templates), "project");

  return {
    builtIn,
    project,
  };
}

function formatTemplateSummaryLine(template) {
  const vars = template.variables.length > 0 ? template.variables.join(", ") : "no variables";
  return `- ${template.name} (${template.source}): ${template.description}\n  - id: ${template.id}\n  - variables: ${vars}`;
}

function templateCatalogBlock(templates) {
  const builtIn = templates.builtIn.map(formatTemplateSummaryLine);
  const project = templates.project.map(formatTemplateSummaryLine);

  if (builtIn.length === 0 && project.length === 0) {
    return "_No workflow templates found in built-in or project template packs._";
  }

  const lines = ["## Available workflow templates"];
  if (builtIn.length > 0) lines.push("", "Built-in package templates:", ...builtIn.map((line) => `  - ${line}`));
  if (project.length > 0) lines.push("", "Project templates:", ...project.map((line) => `  - ${line}`));
  return lines.join("\n");
}

function templateDirectoryBlock(paths) {
  return [
    "Template directories at startup:",
    "",
    `- built-in templates: ${paths.builtInTemplates}`,
    `- project template pack: ${paths.templates}`,
  ].join("\n");
}

function setupTree(paths) {
  return [
    "Setup tree:",
    "",
    "~~~text",
    `${paths.dir}/`,
    "├── project.md",
    "│   ├── project defaults",
    "│   ├── source systems",
    "│   ├── issue tracker / mirror behavior",
    "│   ├── external update defaults",
    "│   ├── validation defaults",
    "│   └── safety / posting / bypass rules",
    "│",
    "├── workflows.md",
    "│   ├── workflow sections",
    "│   ├── required structured questions",
    "│   ├── required input fields",
    "│   ├── optional context fields",
    "│   ├── readiness/start gates",
    "│   ├── optional nested subworkflows",
    "│   └── workflow-local post-run actions (default to /deepwork)",
    `└── ${paths.templates.replace(`${paths.dir}/`, "")}/`,
    "    └── reusable markdown templates",
    "~~~",
    "",
    "Files this command writes:",
    "",
    `- \`${paths.project}\``,
    `- \`${paths.workflows}\``,
  ].join("\n");
}

function partBlock(title, part, fallback) {
  return `## ${title}\n\nPath: \`${part.relativePath}\`\n\nResolved path at startup: \`${part.absolutePath}\`\n\n${part.content ?? fallback}`;
}

function injectedParts(parts) {
  return [
    partBlock("Project defaults", parts.project, "_No project defaults file exists yet._"),
    partBlock("Workflow catalog", parts.workflows, "_No workflow catalog file exists yet._"),
  ].join("\n\n---\n\n");
}

function setupTemplate(paths, parts, templates, templateCommand) {
  return `# Setup Chat Workflows\n\nConsidering optional prefill input:\n\n$ARGUMENTS\n\nSet up this project\'s structured chat workflows. The setup is modular and upgradeable: project defaults live in \`project.md\`; workflow definitions, nested subworkflows, readiness/start gates, and workflow-local post-run actions live in \`workflows.md\`.\n\n${setupTree(paths)}\n\n${templateDirectoryBlock(paths)}\n\nCurrent injected setup files at OpenCode startup:\n\n${injectedParts(parts)}\n\n${templateCatalogBlock(templates)}\n\nRules:\n\n- There is no separate actions file. Put post-run actions directly in each workflow or subworkflow as \`post-run actions:\`.\n- Workflows may contain nested subworkflows using \`### <parent>/<subworkflow>\` sections or a \`subworkflows:\` field.\n- Every workflow should normally include \`/deepwork\` as the final post-run action unless explicitly disabled (\`post-run actions: none\`).\n- Template files are markdown files that can be reused by /${templateCommand}.\n- Templates use \`{{variable_name}}\` placeholders.\n- Do not assume workflows are named general/pr-review/new-task. Those are examples only.\n- Do not post external comments or status updates. This command only writes local chat-workflows files.\n\nFirst-run behavior:\n\n1. State which of the two core files are missing.\n2. Ask one compact questionnaire using the \`question\` tool for what to create/update and workflow details.\n3. Render proposed markdown for both files.\n4. Ask for confirmation before writing.\n5. On confirmation, create \`${paths.dir}\`, write both files, validate they exist, and tell the user to restart OpenCode so \`/start-session\` is regenerated from the updated files.\n\nTemplate flow:\n\n- Mention available project templates and built-in templates before editing.\n- Ask if user wants to seed \`workflows.md\` from a template pack before manual editing.\n- If a template is chosen, render and show a preview for the inserted section before continuing with the normal confirmation flow.\n\nThe first questionnaire field should ask what the user wants to create or update and include a starter workflow set:\n\n- Starter workflow set:\n  - blank/custom\n  - general+pr-review+new-task\n  - incident/release\n  - other\n\n- Project defaults only\n- Workflow definitions only\n- Review current setup without writing\n\nThe questionnaire should include workflow names, optional subworkflows, required structured questions, required input fields, optional context fields, and readiness/start gates for each workflow/subworkflow. Post-run actions and skills should be modeled as a list, and should usually include an action ending in \`/deepwork\` unless explicitly disabled.\n\nTemplate replacement rules for generated snippets:\n\n- Keep all \`{{variable_name}}\` placeholders unless a user provides explicit values.\n- If values are missing, keep placeholders in preview as-is.\n- Preserve unknown placeholders unless user explicitly asks to remove them.\n\nRender proposed files using this shape:\n\n~~~markdown\n// ${paths.project}\n# Project Defaults\n\n- project label: <label>\n- source systems: <...>\n- issue tracker relationship: <...>\n- issue tracker projects: <...>\n- external updates: <...>\n- external update language/tone: <...>\n- validation expectations: <...>\n- external posting: never post external comments or status updates without explicit approval\n- branch/policy bypass: never bypass unless explicitly requested for a specific PR in the current turn\n\n// ${paths.workflows}\n# Workflow Catalog\n\n## <workflow-name>\n\n- enabled: true\n- purpose: <when to use this workflow>\n- required structured questions: <semicolon-separated list>\n- required input fields: <semicolon-separated list>\n- optional context fields: <semicolon-separated list>\n- subworkflows: <none | list>\n- post-run actions: <skill/command list, usually ending with /deepwork>\n- readiness/start gate: <when this workflow is ready to start>\n\n### <workflow-name>/<subworkflow-name>\n\n- enabled: true\n- parent workflow: <workflow-name>\n- purpose: <when to use this subworkflow>\n- inherited fields: <all | list>\n- optional context fields: <semicolon-separated list>\n- readiness/start gate: <when this subworkflow is ready to start>\n- post-run actions: <subworkflow-specific actions, usually ending with /deepwork>\n~~~\n\nThen ask with the \`question\` tool: \"Write these chat workflows files?\" Options: \"Write files\", \"Edit fields\", \"Cancel\".`;
}

function startSessionTemplate(paths, parts) {
  return `# Start Session Chat Workflows\n\nConsidering optional prefill input:\n\n$ARGUMENTS\n\nStart a structured chat workflow using the project chat-workflows files.\n\nLineage:\n\n~~~text\n${paths.project}\n${paths.workflows}\n  -> injected into /setup-chat-workflows as editable setup files\n  -> used to generate /start-session chat workflows\n~~~\n\nChat-workflows files injected at OpenCode startup:\n\n${injectedParts(parts)}\n\nStep 1: choose the workflow first.\n\n- Use workflow names from \`${paths.workflows}\`.\n- Include enabled top-level workflows and enabled nested subworkflows declared as \`### <parent>/<subworkflow>\` or via a workflow\'s \`subworkflows:\` field.\n- Always start with a workflow picker using the \`question\` tool unless $ARGUMENTS unambiguously names exactly one configured workflow or subworkflow.\n\nStep 2: ask the selected workflow or subworkflow questionnaire.\n\n- Subworkflows inherit parent workflow requirements unless they explicitly override or narrow them.\n- Ask one workflow-specific questionnaire using required structured questions, required input fields, useful optional context fields, readiness/start gate, inherited parent fields, and relevant project defaults.\n- Use the \`question\` tool, not a plain console/text fill-in block.\n- Omit questions already answered by $ARGUMENTS or project defaults unless confirmation is explicitly required.\n- Include omitted default-derived values in the rendered workflow brief under \`defaults applied\`.\n\nStep 3: include workflow-defined post-run actions.\n\n- Read post-run actions from the selected workflow/subworkflow in \`${paths.workflows}\`; there is no separate actions file.\n- Do not run actions before confirmation.\n- Do not ask for a second confirmation after the user chooses \"Start\"; the workflow brief confirmation is the only action confirmation.\n- If the workflow declares PR review modes, include these selectable modes and defaults:\n  - review-only\n  - review-and-fix\n  - review-plan-and-fix\n  - review-and-comment\n  - review-and-merge\n\n  If the user asks for fixes/comments/merge, default to the matching mode; otherwise default to \"review-only\".\n\n- If the workflow declares review angles, include add/remove angle handling and suggested defaults:\n  - general\n  - source/scope\n  - code/regression\n  - validation/ops\n\n  Full PR reviews default to all angles; focused reviews should include requested focus plus adjacent necessary angles.\n\n- If an action names a skill such as \`wf-pr_review\`, load/use that skill after confirmation as a quiet handoff, without dumping skill content or long instructions into chat.\n- If an action is \`/deepwork\`, load/use the \`deepwork\` skill or follow \`/deepwork\` behavior after the workflow-specific skill handoff.\n- Workflows are expected to end with \`/deepwork\` unless \`post-run actions: none\` is explicitly configured.\n\nRender a concise workflow brief with workflow, subworkflow, readiness, source links, focus, gates, validation, defaults applied, external updates, post-run actions, and open notes.\n\nThen ask with the \`question\` tool: \"Start this workflow?\" Options: \"Start\", \"Edit fields\", \"Cancel\".\n\nIf confirmed and ready to start is yes, run configured post-run actions without any extra action-confirmation prompt, then continue the normal scheduler workflow.`;
}

function templateManagerTemplate(paths, templates, templateCommand) {
  return `# Workflow Template Manager (${templateCommand})\n\nConsidering optional prefill input:\n\n$ARGUMENTS\n\nManage workflow template packs for this project and this plugin package.\n\nTemplate locations:\n\n${templateDirectoryBlock(paths)}\n\n${templateCatalogBlock(templates)}\n\nTemplate grammar:\n\n- Templates are markdown files from \`${paths.templates}\` and \`${paths.builtInTemplates}\`.\n- Template variables use the exact token format \`{{variable_name}}\` in template bodies.\n- Template content should remain generic and local-only.\n- Never fetch remote URLs automatically. Remote imports require explicit user approval before any fetch action.\n\nSupported operations:\n\n- list\n- create\n- explain\n- import\n- export\n- create-update\n\nCommon flow:\n\n- Start by inferring mode from $ARGUMENTS; otherwise ask one compact \`question\` field for mode.\n- list:\n  - render compact catalog only.\n- explain:\n  - ask for one template ID, then show metadata, variables, and full content.\n- create and create-update:\n  - ask for template ID/path and content source.\n  - prefer pasted markdown content; allow local file path input.\n  - if URL is supplied, ask for explicit permission before importing and only proceed on approval.\n  - extract all placeholders, ask missing values once, render preview, and ask confirmation before writing.\n  - unresolved placeholders remain as \`{{variable_name}}\` unless the user says remove them.\n- import:\n  - accepts local path and pasted text, and delegates to create/update flow.\n  - remote imports are blocked unless user explicitly approves and a fetch tool is available.\n- export:\n  - ask whether to export built-in, project, or both, then destination path (default: ${paths.templates}/templates-export.md).\n  - render combined export pack and confirm before writing.\n\nTemplate replacement behavior for this command:\n\n1. Always ask for required values before writing.\n2. Render a preview with replacements before any file write.\n3. Unknown variables stay in place by default.\n4. Unknown variables are removed only if user explicitly approves removal.\n\nThis command is local-only. Keep all downstream skill handoffs quiet/internal.`;
}

function setupTemplateV032(paths, parts, templates, templateCommand) {
  return `# Setup Chat Workflows (v0.3.2)

Considering optional prefill input:

$ARGUMENTS

Set up this project's structured chat workflows. The setup is modular and upgradeable: project defaults live in project.md; workflow definitions and workflow-local post-run actions live in workflows.md.

${setupTree(paths)}

${templateDirectoryBlock(paths)}

Current injected setup files at OpenCode startup:

${injectedParts(parts)}

${templateCatalogBlock(templates)}

Rules:

- There is no separate actions file. Put post-run actions directly in each workflow or subworkflow.
- Workflows may contain nested subworkflows using ### <parent>/<subworkflow> sections or a subworkflows: field.
- Do not assume workflows are named general/pr-review/new-task. Those are examples only.
- Project templates are optional.
- Built-in package templates are always available and should be seeded only when a project wants editable copies.
- Do not post external comments or status updates. This command only writes local chat-workflow files.

First-run behavior:

1. State which of the two core files are missing.
2. Ask one compact question-based flow for what to create or update.
3. Render proposed markdown for project.md and workflows.md.
4. Ask for confirmation before writing.
5. On confirmation, create ${paths.dir}, write files, verify they exist, and instruct to restart OpenCode.

Template flow:

- Mention available project templates and built-in templates before editing.
- Ask if user wants to seed workflows.md from a template and seed template files into the project templates directory before manual editing.
- If a template is chosen, render and show a preview for inserted sections before continuing.
`;
}

function startSessionTemplateV032(paths, parts) {
  return `# Start Session Chat Workflows (v0.3.2)

Considering optional prefill input:

$ARGUMENTS

Start a structured chat workflow using the project chat-workflows files.

Lineage:

~~~text
${paths.project}
${paths.workflows}
  -> injected into /setup-chat-workflows as editable setup files
  -> used to generate /start-session chat workflows
~~~

Chat-workflows files injected at OpenCode startup:

${injectedParts(parts)}

Step 1: choose the workflow.

- Use workflow names from ${paths.workflows}.
- Include enabled top-level workflows and enabled nested subworkflows.
- Start with a workflow picker using the question tool unless arguments uniquely identify one workflow.

Step 2: apply project defaults first, then ask minimally.

- Read defaults from ${paths.project} and apply matching values to required inputs.
- Do not re-ask required fields already provided by project defaults.
- Include defaults used under a brief section named defaults applied.
- Ask optional context only if it is required to resolve ambiguity.
- Ask only once; keep each required field concise.

Step 3: render workflow brief and confirm.

- Summarize gathered values, required and defaulted, in the workflow brief.
- Ask once to start this workflow.
- Only after this confirmation run workflow-local post-run actions from the selected workflow.
- Do not run any post-run action before confirmation.
- Include PR review modes/options only when the workflow declares them.
`;
}

function templateManagerTemplateV032(paths, templates, templateCommand) {
  return `# Workflow Template Manager (${templateCommand})

Considering optional prefill input:

$ARGUMENTS

Manage workflow template packs for this project and this plugin package.

Template locations:

${templateDirectoryBlock(paths)}

${templateCatalogBlock(templates)}

Template grammar:

- Templates are markdown files from ${paths.templates} (project templates) and ${paths.builtInTemplates} (built-in templates).
- Template variables use {{variable_name}} token syntax.
- Project templates are optional; built-in templates are always available from the package install path.
- Never fetch remote URLs automatically. Remote imports require explicit user approval before any fetch action.

Supported operations:

- list
- create
- explain
- import
- export
- create-update
- seed

Common flow:

- list: render compact catalog only.
- explain: show metadata, detected variables, and full template content.
- create/create-update: ask for template id and source, prefer pasted markdown, allow local file path, require missing values once, preview, then confirm before write.
- import: accepts local path or pasted content; delegates to create/update flow; remote paths stay blocked without explicit user approval.
- export: choose built-in/project/both, default path ${paths.templates}/templates-export.md, render and confirm before writing.
- seed: copy built-in templates into ${paths.templates}, optionally adapting placeholders to project conventions.
  - Render a preview for each copied template first.
  - Ask for confirmation before writing and report whether files are created or overwritten.

Template replacement behavior for this command:

- Ask for required values once.
- Render preview before writing.
- Preserve unknown placeholders unless user asks to remove.
- Keep local-first and approval-gated remote behavior.
`;
}

async function defaultPartsDir(root) {
  if (await pathExists(resolvePath(root, "projects/.opencode"))) return MANAGED_WORKSPACE_PARTS_DIR;
  return DEFAULT_PARTS_DIR;
}

async function readParts(root, paths) {
  const entries = await Promise.all(
    Object.entries({
      project: paths.project,
      workflows: paths.workflows,
    }).map(async ([key, relativePath]) => {
      const absolutePath = resolvePath(root, relativePath);
      const content = await readText(absolutePath);
      return [key, { relativePath, absolutePath, content }];
    }),
  );

  return Object.fromEntries(entries);
}

export default async function opencodeWorkflowSessionSetup(input = {}, options = {}) {
  const root = projectRoot(input);
  const partsDir = stringOption(options, "partsDir", await defaultPartsDir(root));

  const builtInTemplatesOption = stringOption(options, "builtInTemplatesDir", DEFAULT_BUILT_IN_TEMPLATES_DIR);
  const builtInTemplates = path.isAbsolute(builtInTemplatesOption)
    ? builtInTemplatesOption
    : resolvePath(root, builtInTemplatesOption);
  const templatesDir = stringOption(options, "templatesDir", `${partsDir}/${DEFAULT_TEMPLATE_DIR_NAME}`);

  const paths = {
    dir: partsDir,
    project: stringOption(options, "projectPath", `${partsDir}/project.md`),
    workflows: stringOption(options, "workflowsPath", `${partsDir}/workflows.md`),
    templates: templatesDir,
    builtInTemplates,
  };

  const startSessionCommand = stringOption(options, "startSessionCommand", START_SESSION_COMMAND);
  const setupCommand = stringOption(options, "setupCommand", SETUP_COMMAND);
  const templateCommand = stringOption(options, "templateCommand", TEMPLATE_COMMAND);
  const overwrite = booleanOption(options, "overwrite", false);

  const [parts, templates] = await Promise.all([readParts(root, paths), readTemplateSources(root, paths)]);

  return {
    config: (config) => {
      config.command ??= {};

      if (overwrite || !config.command[startSessionCommand]) {
        config.command[startSessionCommand] = {
          description: "Start chat-workflow session setup",
          template: startSessionTemplateV032(paths, parts),
        };
      }

      if (overwrite || !config.command[setupCommand]) {
        config.command[setupCommand] = {
          description: "Configure project chat workflows",
          template: setupTemplateV032(paths, parts, templates, templateCommand),
        };
      }

      if (overwrite || !config.command[templateCommand]) {
        config.command[templateCommand] = {
          description: "Manage workflow templates",
          template: templateManagerTemplateV032(paths, templates, templateCommand),
        };
      }
    },
  };
}
