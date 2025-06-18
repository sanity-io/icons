import {defineConfig} from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  tsconfig: 'tsconfig.dist.json',
  target: ['chrome109', 'edge131', 'firefox115', 'ios15.6', 'opera114', 'safari16.6', 'node20.18'],
  format: ['esm', 'cjs'],
  sourcemap: true,
  platform: 'neutral',
  inputOptions: {
    experimental: {
      attachDebugInfo: false,
    },
  },
})
