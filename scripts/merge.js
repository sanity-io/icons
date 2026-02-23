// oxlint-disable no-console

const fs = require('fs')
const path = require('path')

const ROOT_PATH = path.resolve(__dirname, '..')
const EXPORT_PATH = path.resolve(ROOT_PATH, 'export')
const OUTPUT_PATH = path.resolve(ROOT_PATH, 'optimized')

// Attributes excluded from the merge key:
// - `d`         — the path data we are concatenating
// - `clip-rule` — only meaningful inside <clipPath>, never applies here
// - `fill-rule` — may differ between simple shapes (default "nonzero") and
//                 Figma exports ("evenodd"); handled separately after merging
const IGNORED_ATTRS = new Set(['d', 'clip-rule', 'fill-rule'])

/**
 * Build a key from every attribute on a <path> element except those in
 * IGNORED_ATTRS.  Paths that produce the same key are safe to merge.
 */
function attrKey(node) {
  return Object.entries(node.attributes)
    .filter(([k]) => !IGNORED_ATTRS.has(k))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(';')
}

/**
 * Custom SVGO plugin that merges sibling <path> elements sharing
 * identical attributes (everything except `d`) by concatenating
 * their `d` values with a space.
 */
const mergeStrokedPaths = {
  name: 'mergeStrokedPaths',
  fn: () => ({
    element: {
      exit: (node) => {
        if (node.name !== 'svg' && node.name !== 'g') return
        if (!node.children || node.children.length < 2) return

        // Group direct <path> children by their attribute signature
        const groups = new Map()
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i]
          if (child.type !== 'element' || child.name !== 'path' || !child.attributes.d) continue

          const key = attrKey(child)
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key).push({index: i, node: child})
        }

        const indicesToRemove = new Set()

        for (const paths of groups.values()) {
          if (paths.length < 2) continue

          // Concatenate all d values into the first path
          paths[0].node.attributes.d = paths.map((p) => p.node.attributes.d).join(' ')

          // If any source path used fill-rule="evenodd", apply it to the
          // merged result.  "evenodd" is safe for simple non-overlapping
          // shapes and required for shapes with cut-outs (e.g. letter glyphs).
          const needsEvenOdd = paths.some((p) => p.node.attributes['fill-rule'] === 'evenodd')
          if (needsEvenOdd) {
            paths[0].node.attributes['fill-rule'] = 'evenodd'
          } else {
            delete paths[0].node.attributes['fill-rule']
          }

          // Drop clip-rule — meaningless outside <clipPath>
          delete paths[0].node.attributes['clip-rule']

          // Mark the rest for removal
          for (let i = 1; i < paths.length; i++) {
            indicesToRemove.add(paths[i].index)
          }
        }

        if (indicesToRemove.size > 0) {
          node.children = node.children.filter((_, i) => !indicesToRemove.has(i))
        }
      },
    },
  }),
}

async function merge() {
  const {optimize} = await import('svgo')

  fs.mkdirSync(OUTPUT_PATH, {recursive: true})

  const files = fs
    .readdirSync(EXPORT_PATH)
    .filter((file) => path.extname(file).toLowerCase() === '.svg')

  if (files.length === 0) {
    console.log('No SVG files found in export/')
    return
  }

  let merged = 0
  let unchanged = 0

  for (const file of files) {
    const inputPath = path.join(EXPORT_PATH, file)
    const outputPath = path.join(OUTPUT_PATH, file)

    const svg = fs.readFileSync(inputPath, 'utf-8')

    const pathCount = (svg.match(/<path /g) || []).length

    const result = optimize(svg, {
      path: inputPath,
      plugins: [mergeStrokedPaths],
    })

    fs.writeFileSync(outputPath, result.data)

    const newPathCount = (result.data.match(/<path /g) || []).length

    if (newPathCount < pathCount) {
      console.log(`  ✔ ${file} (${pathCount} → ${newPathCount} paths)`)
      merged++
    } else {
      console.log(`  – ${file}`)
      unchanged++
    }
  }

  console.log(
    `\nMerged paths in ${merged} SVGs (${unchanged} unchanged) → ${path.relative(ROOT_PATH, OUTPUT_PATH)}/`,
  )
}

merge().catch((err) => {
  console.error(err)
  process.exit(1)
})
