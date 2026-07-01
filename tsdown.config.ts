import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {defineConfig} from '@sanity/tsdown-config'
import type {UserConfig} from 'tsdown'

import {annotateBarrelDts, readIconExportMetas} from './scripts/annotate-barrel-dts.ts'

const ROOT_PATH = path.dirname(fileURLToPath(import.meta.url))

const base = defineConfig({
  tsconfig: './tsconfig.dist.json',
  // The root barrel plus one entry point per icon. The object-with-glob form maps
  // e.g. `src/exports/AccessDenied.tsx` → `@sanity/icons/AccessDenied`; the matched
  // filename replaces the `*` in the key, which is what drives the generated
  // `package.json` `exports` subpaths. Keeping these as separate entries lets
  // consumers import a single icon (or `React.lazy()` it) without pulling in the set.
  //
  // `icon` and `icons` are entries too, but only so the `Icon` component and the
  // `icons` map are emitted as their own chunks. That keeps the root barrel
  // (`dist/index.js`) free of inline declarations, i.e. nothing but imports and
  // re-exports, which is the shape Next.js needs to statically analyze the barrel
  // for `experimental.optimizePackageImports`. They are kept out of the public
  // `exports` map via `exports.exclude` below — the barrel references them by
  // relative path, so they don't need their own subpaths.
  entry: [
    './src/index.ts',
    {
      'icon': './src/icon.tsx',
      'icons': './src/icons.ts',
      '*': './src/exports/*.tsx',
    },
  ],
})

// The explicit `UserConfig` annotation gives the default export a portable type
// name (via the direct `tsdown` dependency); without it `declaration` emit fails
// with TS2883 because `@sanity/tsdown-config` returns `tsdown`'s `UserConfig`.
const config: UserConfig = {
  ...base,
  exports: {
    ...(base.exports as Extract<UserConfig['exports'], object>),
    exclude: ['icon', 'icons'],
  },
  hooks: {
    // Rolldown merges the barrel's re-exports into a single `export { ... }` statement in
    // `dist/index.d.ts`, dropping the per-specifier `@deprecated` TSDoc tags authored in
    // `src/index.ts`. Re-attach them so published barrel imports are marked deprecated
    // (subpath imports are untouched and stay non-deprecated).
    'build:done': async () => {
      const barrelDtsPath = path.join(ROOT_PATH, 'dist/index.d.ts')
      const icons = await readIconExportMetas(path.join(ROOT_PATH, 'src/exports'))
      const source = await readFile(barrelDtsPath, 'utf8')
      await writeFile(barrelDtsPath, annotateBarrelDts(source, icons))
    },
  },
}

export default config
