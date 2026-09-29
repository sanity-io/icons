# sanity-icons-studio

The Sanity Studio for the `ppsg7ml5` project (dataset `icons`), hosted at
[icons.sanity.studio](https://icons.sanity.studio). It edits the `icon`
documents behind the semantic search on [icons.sanity.dev](https://icons.sanity.dev)
(`apps/icons`): one per SVG in `packages/icons/export/`, seeded by
`pnpm --filter @sanity/icons seed:icons` and enriched with a `description` and
search `tags` by the `enrich-icon` Sanity Function (`apps/blueprints/docs`).

## Development

```sh
pnpm dev:studio
```

This starts the studio dev server on http://localhost:3333.

## Deployment

`.github/workflows/deploy-studio.yml` deploys the studio (and its schema) on
pushes to `main` that touch `apps/studio`. To deploy manually:

```sh
pnpm --filter sanity-icons-studio run deploy
```

The app id in `sanity.cli.ts` keeps deploys pointed at the existing hosted
studio.

## Schema deployment

The `enrich-icon` Sanity Function resolves the deployed schema of the studio's
`default` workspace (`_.schemas.default`), so the schema has to be deployed for
its Agent Actions to work:

```sh
pnpm --filter sanity-icons-studio schema:deploy
```

## Semantic search

The icon search queries the dataset's embeddings index (the
`text::semanticSimilarity()` GROQ function), which is already enabled on the
`icons` dataset. The `embeddings:enable` script is the command that sets it up,
projecting the fields the index embeds:

```sh
pnpm --filter sanity-icons-studio embeddings:enable
```
