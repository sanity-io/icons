import {defineConfig} from '@sanity/tsdown-config'

export default defineConfig({
  tsconfig: 'tsconfig.dist.json',
  // target: ['chrome109', 'edge131', 'firefox115', 'ios15.6', 'opera114', 'safari16.6', 'node20.18'],
  format: ['esm', 'cjs'],
})
