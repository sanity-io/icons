// oxlint-disable no-console

const fs = require('fs')
const path = require('path')

const ROOT_PATH = path.resolve(__dirname, '..')
const OPTIMIZED_PATH = path.resolve(ROOT_PATH, 'optimized')

// Maximum deviation in units between the original curve and the flattened
// approximation. Lower values produce more accurate (but more verbose) output.
// For a 25×25 viewBox, 0.5 is a good balance of fidelity and simplicity.
const DEFAULT_FLATNESS = 0.5

function shapesToPaths(paper, item) {
  if (item.children) {
    const children = [...item.children]
    for (const child of children) {
      shapesToPaths(paper, child)
    }
  }

  // Convert Shape (circle, rect, ellipse) to Path so it can be flattened.
  // Skip shapes that serve as clip masks — those are structural, not content.
  if (item instanceof paper.Shape && !item.clipMask) {
    const converted = item.toPath(false)
    item.parent.addChild(converted)
    item.remove()
  }
}

function flattenPaths(paper, item, flatness) {
  if (item.children) {
    const children = [...item.children]
    for (const child of children) {
      flattenPaths(paper, child, flatness)
    }
  }

  // Only flatten actual Path items, and skip clip masks
  if (item instanceof paper.Path && !item.clipMask) {
    item.flatten(flatness)
  }
}

function processFile(paper, file, flatness) {
  const filePath = path.join(OPTIMIZED_PATH, file)

  const svgContent = fs.readFileSync(filePath, 'utf-8')

  // Clear the project for each file
  paper.project.clear()

  const item = paper.project.importSVG(svgContent)

  // First pass: convert Shape objects (circle, rect, ellipse) into Paths
  shapesToPaths(paper, item)

  // Second pass: flatten all curves to line segments
  flattenPaths(paper, item, flatness)

  const outputSvg = paper.project.exportSVG({asString: true})
  fs.writeFileSync(filePath, outputSvg)
}

function flatten() {
  const paper = require('paper')

  // Accept an optional flatness value from the command line, e.g.
  //   node scripts/flatten.js 0.25
  const flatness = parseFloat(process.argv[2]) || DEFAULT_FLATNESS

  paper.setup(new paper.Size(25, 25))

  if (!fs.existsSync(OPTIMIZED_PATH)) {
    console.error('The optimized/ directory does not exist. Run the merge script first.')
    process.exit(1)
  }

  const files = fs
    .readdirSync(OPTIMIZED_PATH)
    .filter((file) => path.extname(file).toLowerCase() === '.svg')

  if (files.length === 0) {
    console.log('No SVG files found in optimized/')
    return
  }

  console.log(`Flatness tolerance: ${flatness}\n`)

  let succeeded = 0
  let failed = 0

  for (const file of files) {
    try {
      processFile(paper, file, flatness)
      console.log(`  ✔ ${file}`)
      succeeded++
    } catch (err) {
      console.error(`  ✘ ${file}: ${err.message}`)
      failed++
    }
  }

  console.log(
    `\nFlattened ${succeeded} SVGs in-place → ${path.relative(ROOT_PATH, OPTIMIZED_PATH)}/`,
  )
  if (failed > 0) {
    console.log(`Failed: ${failed}`)
  }
}

flatten()
