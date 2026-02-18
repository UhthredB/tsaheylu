# Contributing to Tsaheylu

## Development Setup

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install all workspace dependencies
pnpm install

# Run all packages in dev mode
pnpm dev
```

## Monorepo Structure

- `agents/` — OpenClaw agent configs (markdown-driven)
- `packages/vault/` — Express API (TypeScript)
- `packages/dashboard/` — Next.js UI (TypeScript)
- `packages/shared/` — Shared library (TypeScript)
- `packages/contracts/` — Solidity smart contracts

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(vault): add new strategy endpoint
fix(dashboard): resolve chat API timeout
chore(agents): update Kxetse SKILL.md
docs: update deployment guide
```

**Scopes:** `vault`, `dashboard`, `shared`, `agents`, `contracts`, `docs`

## Code Style

- Run `pnpm lint` before committing
- Run `pnpm format` to auto-format
- TypeScript strict mode enabled
- ESLint + Prettier configured at root

## Branching

- `main` — Production-ready
- `dev` — Integration branch
- `feat/*` — Feature branches
- `fix/*` — Bug fix branches

## Deployment

| Package | Platform | Command |
|---|---|---|
| Agents | Hostinger VPS | Native OpenClaw instances |
| Vault | Railway | `scripts/deploy-vault.sh` |
| Dashboard | Vercel | `scripts/deploy-dashboard.sh` |

## Security

- **Never commit `.env` files**
- **Never expose vault API keys in frontend code**
- All Moltbook content must pass through `packages/shared/src/security/content-filter.ts`
- Report security issues privately
