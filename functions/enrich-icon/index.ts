// oxlint-disable no-console

import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'

interface IconEvent {
  _id: string
  name?: string
}

export const handler = documentEventHandler<IconEvent>(async ({context, event}) => {
  const {_id, name} = event.data

  const client = createClient({
    ...context.clientOptions,
    apiVersion: 'vX',
    useCdn: false,
  })

  const label = name ?? _id.replace(/^icon\./, '')

  // Uses Sanity's native vision model (Agent Actions) to look at the rasterized
  // icon and write a search-friendly description that dataset embeddings index.
  await client.agent.action.transform({
    schemaId: '_.schemas.default',
    documentId: _id,
    instruction: [
      `This is a minimal, monochrome line UI icon named "${label}".`,
      'Write a short, search-friendly description of what it depicts,',
      'then list the concepts, actions, objects and synonyms a person might',
      'type to find it (for example, a clock should mention "time").',
      'Do not mention colors, the word "icon", or that it is an SVG.',
    ].join(' '),
    target: [
      {
        path: ['description'],
        operation: {type: 'image-description', sourcePath: ['image']},
      },
    ],
  })

  console.log(`Enriched ${_id}`)
})
