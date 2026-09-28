# @sanity/icons Storybook

## Storybook guidelines

- All stories must export either a named `Default` or `Basic` story.
- Avoid creating custom titles for stories - these should be inferred via folder structure alone.
- Where possible, stories should be kept as simple as possible with minimal custom / presentational props.
- Prefer setting component values via storybook [args](https://storybook.js.org/docs/react/writing-stories/args) instead of passing them manually in props.

## Things to note

- `@sanity/icons` resolves to the `packages/icons` TypeScript source through the package's dev `exports`, so edits to the package hot-reload without a rebuild. `@sanity/ui` comes from npm, and its stylesheet (`@sanity/ui/styles.css`) is imported once in `.storybook/preview.tsx`.
- All stories are wrapped with a [common decorator](https://storybook.js.org/docs/react/writing-stories/decorators#story-decorators) which wraps stories in both a `<ThemeProvider>` but also a `<Card>` with padding. Stories that depend on exact viewport dimensions can opt out with the `padding: 0` parameter.
- Interaction tests are written as story `play` functions and run in a real browser with the [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon) (`pnpm test:browser`). The `catalog/AllIcons` story's `play` function checks that every icon in the lazy `icons` map loads and draws, so keep it rendering the full set by default.
