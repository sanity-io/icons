// oxlint-disable no-console

const fs = require('fs')
const path = require('path')

const ROOT_PATH = path.resolve(__dirname, '..')
const OPTIMIZED_PATH = path.resolve(ROOT_PATH, 'optimized')

// Attributes Paper.js adds with useless default or invalid values.
// These are safe to remove when they appear with the exact listed value.
const JUNK_ATTRS = {
  'fill-rule': 'nonzero',
  'font-family': 'none',
  'font-size': 'none',
  'font-weight': 'none',
  'stroke-dasharray': '',
  'stroke-dashoffset': '0',
  'stroke-linecap': 'butt',
  'stroke-linejoin': 'none',
  'stroke-miterlimit': '10',
  'stroke-width': 'none',
  'text-anchor': 'none',
}

/**
 * Custom SVGO plugin that strips artifacts introduced by Paper.js:
 *
 * 1. A `<clipPath>` in `<defs>` whose single child is a rect/path matching the
 *    full SVG viewBox — this clip is redundant because the viewport already
 *    clips to the same bounds.
 * 2. `clip-path="url(#…)"` references that point to the removed clipPath.
 * 3. Presentational attributes set to their default or invalid ("none") values.
 * 4. `style="mix-blend-mode: normal"` (the default compositing mode).
 * 5. The unused `xmlns:xlink` namespace.
 */
const removePaperjsArtifacts = {
  name: 'removePaperjsArtifacts',
  fn: (root) => {
    // Determine the viewBox dimensions from the root <svg> element so we can
    // detect clipPaths that simply clip to the full canvas.
    let vbWidth = 0
    let vbHeight = 0

    const svgNode = root.children.find((c) => c.type === 'element' && c.name === 'svg')
    if (svgNode) {
      const vb = svgNode.attributes.viewBox
      if (vb) {
        const parts = vb.split(/[\s,]+/)
        vbWidth = parseFloat(parts[2])
        vbHeight = parseFloat(parts[3])
      }

      // Remove xmlns:xlink — not needed in SVG 1.1+ and Paper.js adds it
      delete svgNode.attributes['xmlns:xlink']

      // Remove version attribute (Paper.js adds version="1.1")
      delete svgNode.attributes['version']
    }

    const redundantClipIds = new Set()

    return {
      element: {
        enter: (node) => {
          // --- Detect redundant clipPaths that match the viewBox ---
          if (node.name === 'clipPath' && node.attributes.id && vbWidth > 0 && vbHeight > 0) {
            const children = node.children.filter((c) => c.type === 'element')

            if (children.length === 1) {
              const child = children[0]
              let isFullViewBox = false

              if (child.name === 'rect') {
                isFullViewBox =
                  parseFloat(child.attributes.x || 0) === 0 &&
                  parseFloat(child.attributes.y || 0) === 0 &&
                  parseFloat(child.attributes.width) === vbWidth &&
                  parseFloat(child.attributes.height) === vbHeight
              }

              if (child.name === 'path' && child.attributes.d) {
                // Paper.js generates paths like "M0 0h25v25H0z" or with commas.
                // Normalise separators and check common rect-path patterns.
                const d = child.attributes.d.replace(/,/g, ' ').trim()
                const w = vbWidth
                const h = vbHeight
                const patterns = [
                  `M0 0h${w}v${h}H0z`,
                  `M0 0H${w}V${h}H0z`,
                  `M0 0h${w}v${h}H0Z`,
                  `M0 0H${w}V${h}H0Z`,
                ]
                isFullViewBox = patterns.includes(d)
              }

              if (isFullViewBox) {
                redundantClipIds.add(node.attributes.id)
              }
            }
          }

          // --- Remove clip-path references pointing to a redundant clipPath ---
          if (node.attributes['clip-path']) {
            const match = node.attributes['clip-path'].match(/url\(#(.+?)\)/)
            if (match && redundantClipIds.has(match[1])) {
              delete node.attributes['clip-path']
            }
          }

          // --- Remove junk attributes set to default / invalid values ---
          for (const [attr, value] of Object.entries(JUNK_ATTRS)) {
            if (node.attributes[attr] === value) {
              delete node.attributes[attr]
            }
          }

          // --- Remove default mix-blend-mode style ---
          if (node.attributes.style) {
            const cleaned = node.attributes.style
              .replace(/mix-blend-mode:\s*normal;?\s*/g, '')
              .trim()
            if (cleaned === '') {
              delete node.attributes.style
            } else {
              node.attributes.style = cleaned
            }
          }
        },
      },
    }
  },
}

async function minify() {
  const {optimize} = await import('svgo')

  if (!fs.existsSync(OPTIMIZED_PATH)) {
    console.error(
      'The optimized/ directory does not exist. Run the flatten or outline script first.',
    )
    process.exit(1)
  }

  const files = fs
    .readdirSync(OPTIMIZED_PATH)
    .filter((file) => path.extname(file).toLowerCase() === '.svg')

  if (files.length === 0) {
    console.log('No SVG files found in optimized/')
    return
  }

  let totalOriginal = 0
  let totalMinified = 0

  for (const file of files) {
    const filePath = path.join(OPTIMIZED_PATH, file)

    const svg = fs.readFileSync(filePath, 'utf-8')
    const result = optimize(svg, {
      path: filePath,
      multipass: true,
      plugins: [
        // Run custom cleanup first so that preset-default can then collapse
        // the empty <defs>, unreferenced clipPaths, and attributeless <g> wrappers.
        removePaperjsArtifacts,
        'preset-default',
      ],
    })

    fs.writeFileSync(filePath, result.data)

    const originalSize = Buffer.byteLength(svg, 'utf-8')
    const minifiedSize = Buffer.byteLength(result.data, 'utf-8')
    totalOriginal += originalSize
    totalMinified += minifiedSize

    const savings = (((originalSize - minifiedSize) / originalSize) * 100).toFixed(1)
    console.log(`  ${file}: ${originalSize}B → ${minifiedSize}B (−${savings}%)`)
  }

  const totalSavings = (((totalOriginal - totalMinified) / totalOriginal) * 100).toFixed(1)
  console.log(
    `\nMinified ${files.length} SVGs in-place: ${totalOriginal}B → ${totalMinified}B (−${totalSavings}%)`,
  )
  console.log(`Output: ${path.relative(ROOT_PATH, OPTIMIZED_PATH)}/`)
}

minify().catch((err) => {
  console.error(err)
  process.exit(1)
})
