# Contributing to Veintiuno

First off, thank you for considering contributing to Veintiuno! It's people like you that make digital democracy a reality.

## Our Philosophy
We believe in a "Zero-Error Build" environment. This project is built on top of the robust atproto/bsky stack, and we maintain high standards for type safety and performance.

## How Can I Contribute?

### Reporting Bugs
- Use GitHub Issues to report bugs.
- Provide a clear description and steps to reproduce.
- Check if the bug has already been reported.

### Suggesting Enhancements
- Open a GitHub Issue to discuss your idea before implementing it.
- Explain how the feature benefits digital participation.

### Pull Requests
1. **Fork the repo** and create your branch from `main`.
2. **Type Safety**: Ensure your code passes all type checks. Run `pnpm --filter @atproto/bsky exec tsc --build tsconfig.build.json`.
3. **Tests**: Add tests for new features. We use `jest` and `vitest`.
4. **Lexicons**: If you modify a Lexicon (`lexicons/com/para/...`), ensure you run the `codegen` script and verify the sync.
5. **Coding Style**: Follow the existing style (we use Prettier and ESLint). Run `pnpm run format` before committing.

## Development Environment
- **Node**: >= 22 (check `.nvmrc`)
- **Package Manager**: `pnpm`
- **Docker**: Required for local Postgres and Redis.

## Code of Conduct
Please be respectful and professional. We are building a platform for pluralistic participation, and our community should reflect those values.

## Security
If you find a security vulnerability, please do NOT open a public issue. Email us at security@para.com (or the project maintainers).

---
*By contributing to Veintiuno, you agree that your contributions will be licensed under the project's MIT and Apache 2.0 licenses.*
