# Publishing

## Status

Repository exists.

Suggested repository:

- GitHub: `https://github.com/Zaradacht/setup-chat-workflows`

## 1. Final package review

Run:

```bash
npm pack --dry-run
```

Check that the tarball includes:

- `index.js`
- `examples/project.md`
- `examples/workflows.md`
- workflow-local post-run actions in `examples/workflows.md`
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

- `@zaradacht/setup-chat-workflows`
- `opencode-structured-workflows`
- `opencode-task-session setup`

## 3. Submit to awesome-opencode

Repository:

- `https://github.com/awesome-opencode/awesome-opencode`

Suggested entry:

```markdown
- [setup-chat-workflows](https://github.com/Zaradacht/setup-chat-workflows) - Adds modular workflow-aware `/setup-chat-workflows` and `/start-session` commands backed by plug-and-play project and workflow files with workflow-local post-run actions.
```

## 4. Release tags

Initial release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Current snapshot:

```bash
git tag v0.2.0
git push origin v0.2.0
```
