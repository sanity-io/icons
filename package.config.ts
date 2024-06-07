import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  babel: {
    reactCompiler: true,
  },
  extract: {
    rules: {
      'ae-internal-missing-underscore': 'off',
    },
  },
  tsconfig: 'tsconfig.dist.json',
})
