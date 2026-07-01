import {defineField, defineType} from 'sanity'

export const iconType = defineType({
  name: 'icon',
  title: 'Icon',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      description: 'The kebab-case icon key, matching the exported SVG filename.',
      type: 'string',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      description: 'Humanized name, e.g. "Add User".',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Raster preview',
      description: 'PNG rasterization of the SVG, used as the vision source for enrichment.',
      type: 'image',
    }),
    defineField({
      name: 'svgHash',
      title: 'SVG hash',
      description: 'sha1 of the source SVG. Used to skip work when an icon has not changed.',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'AI-generated, search-friendly description. Embedded for semantic search.',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'name', media: 'image'},
  },
})
