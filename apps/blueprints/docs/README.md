# blueprints-docs

[Sanity Blueprint](https://www.sanity.io/docs/compute-and-ai/blueprints) for the
icon search on [icons.sanity.dev](https://icons.sanity.dev) (Sanity project
`ppsg7ml5`).

## Functions

### `enrich-icon`

Listens for created/updated `icon` documents on the `ppsg7ml5.icons` dataset
that don't have a `description` yet (see
`packages/icons/scripts/seed-icons-dataset.ts`, which clears it when an icon
changes) and uses [Agent Actions](https://www.sanity.io/docs/agent-actions)
to look at the rasterized icon preview and write a search-friendly
`description` plus search `tags`, which power the semantic icon search on
[icons.sanity.dev](https://icons.sanity.dev) (`apps/icons`).

It resolves the schema as `_.schemas.default`, so the studio schema
must be deployed (`pnpm --filter sanity-icons-studio schema:deploy`)
for the agent actions to work.

## Deploys

`.github/workflows/sanity-blueprint-docs.yml` runs
`blueprints doctor` + `blueprints plan` on pull requests and
`blueprints deploy` on pushes to `main`, via `@sanity/runtime-cli`. It uses the
`SANITY_DEPLOY_TOKEN` repository secret (a token with deploy permissions
on project `ppsg7ml5`) and the stack id in the `SANITY_BLUEPRINT_STACK_ID`
repository variable.

## Local development

```sh
# Validate the blueprint
pnpm dlx @sanity/runtime-cli@latest blueprints doctor

# Diff against the deployed stack
pnpm dlx @sanity/runtime-cli@latest blueprints plan

# Tail function logs
pnpm dlx @sanity/runtime-cli@latest functions logs enrich-icon
```

All commands expect `SANITY_AUTH_TOKEN`, `SANITY_PROJECT_ID=ppsg7ml5` and
`SANITY_BLUEPRINT_STACK_ID` in the environment (or a `.sanity/blueprint.config.json`
from a previous `blueprints deploy`).
