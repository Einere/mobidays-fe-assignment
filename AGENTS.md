# Repository Guidelines

## Project Structure & Module Organization
This project is a React 19 + TypeScript + Vite dashboard with a simplified FSD layout under `src/`.

- `src/app`: app-level providers and global configuration
- `src/widgets`: independent UI blocks such as charts, filters, and tables
- `src/entities`: domain models, API access, and derived business logic
- `src/shared`: reusable UI, hooks, utils, types, store, and API helpers
- `src/assets` and `public`: static assets
- `src/test`: shared test setup (`setup.ts`)
- `docs/tech-decisions.md`: architecture and stack decisions

Use the `@/` alias for imports from `src` (example: `@/shared/ui/button`).

## Build, Test, and Development Commands
- `npm run dev`: start the Vite dev server
- `npm run build`: run TypeScript project build and create a production bundle
- `npm run preview`: preview the built app locally
- `npm run test`: start Vitest in watch mode
- `npm run test:run`: run tests once for CI or pre-PR checks
- `npm run lint`: run Biome checks across the repository
- `npm run lint:fix`: apply safe Biome fixes
- `npm run format`: format the codebase with Biome

## Coding Style & Naming Conventions
TypeScript and TSX use tabs for indentation, double quotes, and organized imports via Biome. Follow the existing FSD boundaries: keep cross-cutting utilities in `shared`, domain logic in `entities`, and composed screen blocks in `widgets`. Prefer PascalCase for React components, camelCase for functions and variables, and kebab-case only where tooling requires it.

## Testing Guidelines
Vitest runs in `jsdom` with Testing Library and `src/test/setup.ts`. Add unit tests for new behavior and keep tests close to the code they cover or in a nearby `__tests__` folder. Name test files `*.test.ts` or `*.test.tsx`. Before opening a PR, run `npm run test:run` and `npm run lint`.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit prefixes such as `feat:`, `chore:`, and `docs:`. Keep messages short and scoped to one change. PRs should include a clear summary, linked issue or task, test results, and screenshots or short recordings for visible UI changes. If architecture or stack choices change, update `docs/tech-decisions.md` in the same PR.
