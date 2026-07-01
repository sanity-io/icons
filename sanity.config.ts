import {defineConfig} from 'sanity'
import {media} from 'sanity-plugin-media'
import {structureTool} from 'sanity/structure'

import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'default',
  title: '@sanity/icons',
  projectId: 'ppsg7ml5',
  dataset: 'icons',
  plugins: [structureTool(), media()],
  schema: {
    types: schemaTypes,
  },
})
