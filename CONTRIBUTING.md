# Contributing guidelines

This repository is a pnpm monorepo. The published `@sanity/icons` package lives
in [`packages/icons`](packages/icons), the Storybook lives in
[`apps/storybook`](apps/storybook), the [icons.sanity.dev](https://icons.sanity.dev)
icon showcase lives in [`apps/icons`](apps/icons), the Sanity Studio for the
icon search dataset lives in [`apps/studio`](apps/studio), and the Sanity
Blueprint with the icon-enrichment function lives in
[`apps/blueprints/docs`](apps/blueprints/docs).

## Getting started

```sh
pnpm install
pnpm build
pnpm test
```

Run `pnpm dev` to start Storybook (http://localhost:6006). Storybook resolves
`@sanity/icons` from the package source, so edits to `packages/icons/src`
hot-reload without a rebuild.

## Adding or changing icons

The icon components are generated from the SVGs in `packages/icons/export/`.
Add or edit an SVG there, then run `pnpm --filter @sanity/icons generate` (also
run by `pnpm build`), which regenerates `packages/icons/src/exports/*`,
`src/icons.ts` and `src/deprecations.ts`. Commit the generated files along with
the SVGs, and don't edit them by hand.

## Testing

Unit tests are written with [vitest](https://vitest.dev) and live next to the
source in `packages/icons/src`. Run them with `pnpm test` (or `pnpm test:watch`
in the package for watch mode). They run against the package source, so no
build is required.

Browser tests live in the Storybook app (`apps/storybook`) and use
[Storybook's Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon):
every story is rendered as a smoke test in headless Chromium, and interaction
tests are written as story [`play` functions](https://storybook.js.org/docs/writing-stories/play-function).

Install the Playwright-provided browser once with
`pnpm --filter sanity-icons-storybook exec playwright install chromium`, then run
`pnpm test:browser`. While developing, `pnpm dev` exposes the same tests
interactively through the testing panel in the Storybook UI.

## Releasing

Releases are managed with [Changesets](https://github.com/changesets/changesets).

When you make a change that should be released, add a changeset to your pull
request:

```sh
pnpm changeset
```

Once pull requests with changesets are merged into `main`, a "Version Packages"
pull request is opened (and kept up to date) that bumps the package version and
updates its changelog. Merging that pull request publishes the package to npm
through the
[`Release` workflow](https://github.com/sanity-io/icons/actions/workflows/release.yml),
which uses npm [Trusted Publishing](https://docs.npmjs.com/trusted-publishers)
(OIDC). Releases from `main` are published under the `latest` dist-tag.
