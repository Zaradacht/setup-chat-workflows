# Publishing

## Status

Repository not created yet.

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
- `examples/actions.md`
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
- `opencode-task-intake`

## 3. Submit to awesome-opencode

Repository:

- `https://github.com/awesome-opencode/awesome-opencode`

Suggested entry:

```markdown
- [setup-chat-workflows](https://github.com/Zaradacht/setup-chat-workflows) - Adds modular workflow-aware `/setup-chat-workflows` and `/new-session` commands backed by plug-and-play project, workflow, and post-intake action files.
```

## 4. Suggested first release tag

```bash
git tag v0.1.0
git push origin v0.1.0
```
