import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {media} from 'sanity-plugin-media'
import {structureTool} from 'sanity/structure'

import {schema} from './schemas'

export default defineConfig({
  // The workspace name is part of the deployed schema id (`_.schemas.default`)
  // that the enrich-icon function passes to Agent Actions
  name: 'default',
  title: '@sanity/icons',
  projectId: 'ppsg7ml5',
  dataset: 'icons',
  plugins: [
    structureTool(),
    visionTool(),
    // Browse the uploaded image assets, e.g. the rasterized icon previews
    // that `packages/icons/scripts/seed-icons-dataset.ts` uploads.
    media(),
  ],
  schema,

  // Disabling a bunch of stuff
  announcements: {enabled: false},
  apps: {canvas: {enabled: false}},
  beta: {create: {startInCreateEnabled: false}},
  document: {comments: {enabled: false}},
  mediaLibrary: {enabled: false},
  releases: {enabled: false},
  scheduledDrafts: {enabled: false},
  scheduledPublishing: {enabled: false},
  tasks: {enabled: false},
})
