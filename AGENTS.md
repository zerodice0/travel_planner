# Repository Guidelines

## Project Structure & Module Organization

The monorepo uses pnpm workspaces. App-specific code lives under `apps`: `apps/web/src` hosts the React client (pages in `pages`, UI in `components`, shared hooks and utilities in `hooks` and `lib`), while `apps/api/src` contains the NestJS backend (feature modules per domain, Prisma access under `prisma`). Shared docs and operational notes stay in `docs`, and workspace-level configs such as `turbo.json` and `.prettierrc` live at the root. Generated build artifacts (Vite, Nest) sit in each app’s `dist` directory.

## Build, Test, and Development Commands

Run `pnpm install` once per clone. Use `pnpm dev` to start both apps via Turbo. Target a single surface with `pnpm --filter @travel-planner/web dev` for the Vite dev server or `pnpm --filter @travel-planner/api dev` for the Nest watch server. Ship-ready builds use `pnpm build`, while `pnpm --filter ... build` narrows scope. Keep linters clean with `pnpm lint`, ensure types with `pnpm typecheck`, and manage database migrations through `pnpm --filter @travel-planner/api prisma:migrate` followed by `prisma:generate` when the schema changes.

## Coding Style & Naming Conventions

TypeScript is required across the workspace. Prettier enforces two-space indentation, semicolons, 100-character lines, and single quotes; run it before committing or via IDE formatting on save. Follow ESLint rules defined in each app (`eslint.config.js`), keeping React components PascalCase, hooks prefixed with `use`, and Nest modules/services named `<Feature>Module` and `<Feature>Service`. Co-locate component styles using Tailwind utility classes, and avoid untyped `any` unless a TODO explains the rationale.

## Testing Guidelines

Add backend unit and integration specs with Jest and `@nestjs/testing`, organizing files as `*.spec.ts` beside the code under `apps/api/src`. Frontend interaction tests should rely on Vitest plus React Testing Library once introduced; place them under `apps/web/src/__tests__`. Seed data through `pnpm --filter @travel-planner/api prisma:seed` before running integration suites. Treat high-risk changes as requiring both automated coverage and manual map flow verification.

## Commit & Pull Request Guidelines

Match the conventional short prefix used in the history (e.g., `feat:`, `fix:`, `chore:`) followed by a concise, imperative summary; include localized context when helpful. Before opening a PR, run lint, typecheck, and relevant tests, and attach screenshots or screencasts for UI changes. Reference related issues with `Closes #id`, highlight any schema or config migrations, and request review from domain owners when touching shared modules.
