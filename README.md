# @sanity/icons

The Sanity icons. Browse and search the full set at
**[icons.sanity.dev](https://icons.sanity.dev)**, and see the
[`@sanity/icons` README](packages/icons#readme) for installation and usage.

This repository is a pnpm workspace: the published package lives under
`packages/`, and the Storybook, the icon showcase, its Sanity Studio and its
serverless functions live under `apps/`.

## Packages

| Package                           | Description                   |
| --------------------------------- | ----------------------------- |
| [`@sanity/icons`](packages/icons) | Icon components (SVG → React) |

## Apps

| App                                            | Description                                                                                    |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [`apps/storybook`](apps/storybook)             | Icon Storybook ([localhost:6006](http://localhost:6006) via `pnpm dev`)                        |
| [`apps/icons`](apps/icons)                     | [icons.sanity.dev](https://icons.sanity.dev) searchable icon catalog                           |
| [`apps/studio`](apps/studio)                   | Sanity Studio for the icon search dataset ([icons.sanity.studio](https://icons.sanity.studio)) |
| [`apps/blueprints/docs`](apps/blueprints/docs) | Sanity Blueprint (serverless icon-enrichment function)                                         |

## Requirements

- Node.js `>=22.13`
- [pnpm](https://pnpm.io) `12` (pinned via `packageManager` in `package.json`)

## Getting started

```sh
pnpm install
pnpm build
pnpm test
```

### Development

```sh
pnpm dev          # Storybook at http://localhost:6006
pnpm dev:icons    # Icon showcase at http://localhost:5173
pnpm dev:studio   # Sanity Studio at http://localhost:3333
```

In the workspace, `@sanity/icons` resolves to its TypeScript source through the
package `exports`, so Storybook and the apps hot-reload package edits without a
rebuild.

### Common scripts

| Script              | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `pnpm build`        | Build `@sanity/icons`                             |
| `pnpm test`         | Unit tests (`@sanity/icons`)                      |
| `pnpm test:browser` | Storybook browser tests (Chromium via Playwright) |
| `pnpm lint`         | Lint + type-check (oxlint)                        |
| `pnpm format`       | Format with oxfmt                                 |
| `pnpm knip`         | Unused files / dependencies / exports             |
| `pnpm changeset`    | Add a changeset for a release                     |

## Contributing & releasing

See [CONTRIBUTING.md](CONTRIBUTING.md). Releases use
[Changesets](https://github.com/changesets/changesets): add a changeset on your
PR; merging to `main` opens a “Version Packages” PR that publishes to npm when
merged.

## License

MIT — see [LICENSE](LICENSE).
