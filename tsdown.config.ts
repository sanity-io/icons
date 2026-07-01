import {defineConfig} from '@sanity/tsdown-config'

export default defineConfig({
  tsconfig: './tsconfig.dist.json',
  entry: './src/index.ts',
})
