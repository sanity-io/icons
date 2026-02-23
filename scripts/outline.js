// oxlint-disable no-console

const fs = require('fs')
const path = require('path')

const ROOT_PATH = path.resolve(__dirname, '..')
const EXPORT_PATH = path.resolve(ROOT_PATH, 'export')
const OUTPUT_PATH = path.resolve(ROOT_PATH, 'optimized')

function outlineStrokes(paper, PaperOffset, item) {
  if (item.children) {
    const children = [...item.children]
    for (const child of children) {
      outlineStrokes(paper, PaperOffset, child)
    }
  }

  const isPath = item instanceof paper.Path || item instanceof paper.CompoundPath
  if (!isPath || !item.strokeColor || item.strokeWidth <= 0) return

  const strokeColor = item.strokeColor
  const strokeWidth = item.strokeWidth
  const strokeJoin = item.strokeJoin || 'miter'
  const strokeCap = item.strokeCap || 'butt'
  const hasFill = item.fillColor !== null && item.fillColor !== undefined

  try {
    const outlined = PaperOffset.offsetStroke(item, strokeWidth / 2, {
      join: strokeJoin,
      cap: strokeCap,
    })

    if (!outlined) return

    outlined.fillColor = strokeColor
    outlined.strokeColor = null
    outlined.strokeWidth = 0

    if (hasFill) {
      // Path has both fill and stroke — unite the filled shape with the outlined stroke
      const filled = item.clone()
      filled.strokeColor = null
      filled.strokeWidth = 0

      const united = filled.unite(outlined)
      united.fillColor = item.fillColor
      united.strokeColor = null
      united.strokeWidth = 0

      item.replaceWith(united)
      filled.remove()
      outlined.remove()
    } else {
      item.replaceWith(outlined)
    }
  } catch (err) {
    console.warn(`    ⚠ Could not outline a path: ${err.message}`)
  }
}

function processFile(paper, PaperOffset, file) {
  const inputPath = path.join(EXPORT_PATH, file)
  const outputPath = path.join(OUTPUT_PATH, file)

  const svgContent = fs.readFileSync(inputPath, 'utf-8')

  // Clear the project for each file
  paper.project.clear()

  const item = paper.project.importSVG(svgContent)

  outlineStrokes(paper, PaperOffset, item)

  const outputSvg = paper.project.exportSVG({asString: true})
  fs.writeFileSync(outputPath, outputSvg)
}

function outline() {
  const paper = require('paper')
  const {PaperOffset} = require('paperjs-offset')

  paper.setup(new paper.Size(25, 25))

  fs.mkdirSync(OUTPUT_PATH, {recursive: true})

  const files = fs
    .readdirSync(EXPORT_PATH)
    .filter((file) => path.extname(file).toLowerCase() === '.svg')

  if (files.length === 0) {
    console.log('No SVG files found in export/')
    return
  }

  let succeeded = 0
  let failed = 0

  for (const file of files) {
    try {
      processFile(paper, PaperOffset, file)
      console.log(`  ✔ ${file}`)
      succeeded++
    } catch (err) {
      console.error(`  ✘ ${file}: ${err.message}`)
      failed++
    }
  }

  console.log(`\nOutlined ${succeeded} SVGs → ${path.relative(ROOT_PATH, OUTPUT_PATH)}/`)
  if (failed > 0) {
    console.log(`Failed: ${failed}`)
  }
}

outline()
