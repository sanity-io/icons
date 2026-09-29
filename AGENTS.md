# AGENTS.md

## Cursor Cloud specific instructions

This is the `@sanity/icons` React icon library, structured as a pnpm monorepo
set up like [sanity-io/ui](https://github.com/sanity-io/ui) (same Node and pnpm
versions, dependency versions, lint/format/build/test tooling, CI and release
setup): the published `@sanity/icons` package lives in `packages/icons`, the
Storybook in `apps/storybook`, the icons.sanity.dev icon showcase (a Vite SPA)
in `apps/icons`, the Sanity Studio for the icon search dataset in `apps/studio`,
and a Sanity Blueprint (serverless functions for the icon enrichment) in
`apps/blueprints/docs` (`pnpm-workspace.yaml`). The root `package.json` is a
private workspace root whose scripts orchestrate via pnpm filters. Package
manager is pnpm (`packageManager` pin in `package.json`); developing in this
repo requires Node `>=22.13`, while the published `@sanity/icons` package
supports `>=20.19 <22 || >=22.12` (see `packages/icons/package.json` engines).
`@sanity/ui` is developed in sanity-io/ui and comes from npm (the `catalog:`
entry in `pnpm-workspace.yaml`); when bumping shared dependencies, keep the
catalog ranges in step with sanity-io/ui's.

Standard scripts live in the root `package.json` (`lint`, `test`, `build`,
`dev`). Notes that are not obvious from the scripts:

- Linting uses [oxlint](https://oxc.rs/docs/guide/usage/linter.html) with a
  root `.oxlintrc.json` (type-aware via `oxlint-tsgolint`). TypeScript type
  checking is included in `pnpm lint` via the `typeCheck` option — there is no
  separate `tsc` command. Run `pnpm lint:fix` to auto-fix issues when possible.
  Suppressions use `oxlint-disable-next-line` comments. Storybook-specific
  rules come from `eslint-plugin-storybook`, loaded through oxlint's
  [JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) support
  (`jsPlugins` in `.oxlintrc.json`). Formatting uses oxfmt (`pnpm format`);
  there is no pre-commit hook, the `format-if-needed` workflow formats `main`.
- `pnpm knip` runs [knip](https://knip.dev) (config in `knip.jsonc`, also a CI
  job) to detect unused files, dependencies and exports. Anything that is only
  used within its own module should not be exported. The script passes
  `--treat-config-hints-as-errors`, so stale knip config also fails the run.
- `packages/icons` is built with [tsdown](https://tsdown.dev) via
  `@sanity/tsdown-config` (`pnpm build`). The build regenerates the
  package.json `exports` (dev exports), which resolve directly to TypeScript
  source for every tool (tsc, oxlint's type checker, vitest, vite, Storybook),
  so there are no tsconfig `paths` or vite aliases. The publishable `exports`
  (dist) live under `publishConfig` and are applied by `pnpm pack`/`publish`.
- The icon components are generated from the SVG sources in
  `packages/icons/export/`: `pnpm --filter @sanity/icons generate` (also run
  via `prebuild`) deletes and regenerates `src/exports/*`, `src/icons.ts` and
  `src/deprecations.ts`. These generated files are committed — edit the SVGs or
  `scripts/generate.ts` instead of the generated output.
- `pnpm test` runs the unit tests with vitest (`packages/icons/vitest.config.ts`,
  jsdom) against the package source, so no build is required first.
- `pnpm dev` starts Storybook (`apps/storybook`) on http://localhost:6006.
  `pnpm test:browser` runs every story as a browser test in headless Chromium
  via `@storybook/addon-vitest`, executing story `play` interactions. The
  Playwright-provided browser must be installed once via
  `pnpm --filter sanity-icons-storybook exec playwright install chromium`.
  Stories opt out of being tested with the `!test` tag. `apps/storybook/vercel.json`
  (sanity-io/ui's, unchanged) is the Vercel config for the hosted Storybook.
  Each app keeps its `vercel.json` in its own folder; the repo root has none.
- `pnpm dev:icons` starts the icons.sanity.dev showcase (`apps/icons`) on
  http://localhost:5173. It is a plain Vite app; its sources keep this repo's
  historical `src/__workshop__` folder name, which predates replacing
  `@sanity/ui-workshop` with Vite. Its icon search queries the public `icon` documents in
  Sanity project `ppsg7ml5`, dataset `icons` (override with
  `VITE_SANITY_API_PROJECT_ID`/`VITE_SANITY_API_DATASET`), with semantic search
  through the dataset's embeddings index, and falls back to local substring
  filtering when the remote query fails. CORS on the project allows the
  showcase, Storybook and studio localhost ports. `apps/icons/vercel.json` is
  the Vercel config for icons.sanity.dev.
- `pnpm dev:studio` runs the Sanity Studio (`apps/studio`, project `ppsg7ml5`,
  dataset `icons`) on http://localhost:3333. Its workspace name (`default`) is
  part of the deployed schema id (`_.schemas.default`) that the `enrich-icon`
  function uses, so don't rename it. The `deploy-studio` workflow deploys it
  to icons.sanity.studio on pushes to `main`. `pnpm deploy` is a built-in pnpm
  command, so run the studio's deploy script as
  `pnpm --filter sanity-icons-studio run deploy`.
- The icon documents are (re)seeded with `pnpm --filter @sanity/icons seed:icons`
  (needs `SANITY_API_WRITE_TOKEN` or `SANITY_AUTH_TOKEN`), which the
  `seed-icons` workflow runs for every `@sanity/icons@*` release tag. It uploads
  rasterized previews and clears `description`/`tags` of changed icons so the
  `enrich-icon` Sanity Function (`apps/blueprints/docs`) re-enriches them via
  Agent Actions. `.github/workflows/sanity-blueprint-docs.yml` runs
  `blueprints doctor`/`plan` on PRs and `blueprints deploy` on pushes to
  `main`, using the `SANITY_DEPLOY_TOKEN` secret and the
  `SANITY_BLUEPRINT_STACK_ID` repository variable.
- Releases are managed with Changesets, configured exactly like sanity-io/ui:
  run `pnpm changeset` to add a changeset to a PR that should trigger a
  release. Merging to `main` opens/updates a "Version Packages" PR, and merging
  that publishes to npm from `.github/workflows/release.yml` via npm trusted
  publishing (OIDC). The trusted publisher is pinned to that workflow file name,
  so don't rename it.
