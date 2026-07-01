// oxlint-disable no-console, no-await-in-loop

import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {Resvg} from '@resvg/resvg-js'
import {createClient} from '@sanity/client'
import {globby} from 'globby'

const ROOT_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMPORT_PATH = path.resolve(ROOT_PATH, 'export')

const projectId = process.env['SANITY_PROJECT_ID'] || 'ppsg7ml5'
const dataset = process.env['SANITY_DATASET'] || 'icons'
const token =
  process.env['SANITY_API_WRITE_TOKEN'] ||
  process.env['SANITY_WRITE_TOKEN'] ||
  process.env['SANITY_AUTH_TOKEN']

if (!token) {
  console.error(
    'Missing SANITY_API_WRITE_TOKEN (or SANITY_WRITE_TOKEN / SANITY_AUTH_TOKEN) environment variable',
  )
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-19',
  token,
  useCdn: false,
})

function ucfirst(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

function toTitle(name: string) {
  return name.split('-').map(ucfirst).join(' ')
}

// Mirrors the name derivation in scripts/generate.ts so the doc `name`
// matches the exported `IconSymbol` key rendered by the workshop.
function iconNameFromPath(filePath: string) {
  const relativePath = path.relative(IMPORT_PATH, filePath)
  const nameSegments = relativePath.split(path.sep)
  const filename = nameSegments.pop()

  if (!filename) throw new Error('no filename')

  nameSegments.push(...filename.split('.').slice(0, -1))

  return nameSegments.join('-')
}

function rasterize(svg: string) {
  const resvg = new Resvg(svg, {
    fitTo: {mode: 'width', value: 512},
    background: 'white',
  })

  return Buffer.from(resvg.render().asPng())
}

async function main() {
  const filePaths = (await globby(path.join(IMPORT_PATH, '**/*.svg'))).toSorted()
  console.log(`Found ${filePaths.length} SVGs in ${IMPORT_PATH}`)

  const existing: {_id: string; svgHash?: string}[] = await client.fetch(
    `*[_type == "icon"]{_id, svgHash}`,
  )
  const existingHash = new Map(existing.map((doc) => [doc._id, doc.svgHash]))

  let upserted = 0
  let skipped = 0

  for (const filePath of filePaths) {
    const name = iconNameFromPath(filePath)
    const _id = `icon.${name}`
    const svg = await readFile(filePath, 'utf8')
    const svgHash = createHash('sha1').update(svg).digest('hex')

    // Nothing changed since the last sync – leave the doc (and its embeddings /
    // AI description) untouched so no update event fires.
    if (existingHash.get(_id) === svgHash) {
      skipped++
      continue
    }

    const png = rasterize(svg)
    const asset = await client.assets.upload('image', png, {
      filename: `${name}.png`,
      contentType: 'image/png',
    })

    // `description` is intentionally omitted. Replacing the document drops any
    // previous description, which makes the `enrich-icon` function re-run for
    // this (new or changed) icon only.
    await client.createOrReplace({
      _id,
      _type: 'icon',
      name,
      title: toTitle(name),
      svgHash,
      image: {
        _type: 'image',
        asset: {_type: 'reference', _ref: asset._id},
      },
    })

    upserted++
    console.log(`Upserted ${name}`)
  }

  console.log(`Done: ${upserted} upserted, ${skipped} unchanged`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
