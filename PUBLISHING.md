# Publishing

## Status

Repository exists.

Suggested repository:

- GitHub: `https://github.com/Zaradacht/opencode-chat-workflow-setup`

## 1. Final package review

Run:

```bash
npm pack --dry-run
```

Check that the tarball includes:

- `index.js`
- `examples/project.md`
- `examples/workflows.md`
- `templates/`
- `README.md`
- `LICENSE`

## 2. Publish

Authenticate if needed:

```bash
npm adduser
npm whoami
```

Publish:

```bash
npm publish
```

If the package name is taken, suggested alternatives:

- `@zaradacht/opencode-chat-workflow-setup`
- `opencode-structured-workflows`
- `opencode-task-session setup`

## 3. Submit to awesome-opencode

Repository:

- `https://github.com/awesome-opencode/awesome-opencode`

Suggested entry:

```markdown
- [opencode-chat-workflow-setup](https://github.com/Zaradacht/opencode-chat-workflow-setup) - Adds modular `/setup-chat-workflows`, `/start-session`, and `/workflow-template` commands for local-first workflow and template management.
```

## 4. Release tags

Initial release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Current snapshot for v0.3.2:

```bash
git tag v0.3.2
git push origin v0.3.2
```
