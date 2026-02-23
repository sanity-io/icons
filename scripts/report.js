// oxlint-disable no-console

const fs = require('fs')
const path = require('path')

const ROOT_PATH = path.resolve(__dirname, '..')
const EXPORT_PATH = path.resolve(ROOT_PATH, 'export')
const OPTIMIZED_PATH = path.resolve(ROOT_PATH, 'optimized')

/**
 * Count DOM element nodes in an SVG string.
 * Matches every opening/self-closing tag (e.g. `<svg`, `<path`, `<g`)
 * but not closing tags (`</svg>`) or XML declarations (`<?xml`).
 */
function countNodes(svg) {
  return (svg.match(/<[a-zA-Z]/g) || []).length
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function pct(before, after) {
  if (before === 0) return '  0.0%'
  const p = (((before - after) / before) * 100).toFixed(1)
  return `${p}%`
}

function padStart(str, len) {
  return String(str).padStart(len)
}

function padEnd(str, len) {
  return String(str).padEnd(len)
}

function report() {
  if (!fs.existsSync(OPTIMIZED_PATH)) {
    console.error('The optimized/ directory does not exist. Run the pipeline first.')
    process.exit(1)
  }

  const exportFiles = fs
    .readdirSync(EXPORT_PATH)
    .filter((f) => f.endsWith('.svg'))
    .sort()

  const newFiles = new Set(fs.readdirSync(OPTIMIZED_PATH).filter((f) => f.endsWith('.svg')))

  // Collect per-file stats
  const rows = []
  let totalExportSize = 0
  let totalNewSize = 0
  let totalExportNodes = 0
  let totalNewNodes = 0

  for (const file of exportFiles) {
    if (!newFiles.has(file)) continue

    const exportSvg = fs.readFileSync(path.join(EXPORT_PATH, file), 'utf-8')
    const newSvg = fs.readFileSync(path.join(OPTIMIZED_PATH, file), 'utf-8')

    const exportSize = Buffer.byteLength(exportSvg, 'utf-8')
    const newSize = Buffer.byteLength(newSvg, 'utf-8')
    const exportNodes = countNodes(exportSvg)
    const newNodes = countNodes(newSvg)

    totalExportSize += exportSize
    totalNewSize += newSize
    totalExportNodes += exportNodes
    totalNewNodes += newNodes

    rows.push({file, exportSize, newSize, exportNodes, newNodes})
  }

  // Column widths
  const nameW = Math.max('File'.length, ...rows.map((r) => r.file.length))
  const sizeW = 10
  const nodeW = 6
  const pctW = 7

  const sep = '-'.repeat(nameW + sizeW * 2 + pctW + nodeW * 2 + pctW + 12)

  // Header
  console.log()
  console.log(
    `${padEnd('File', nameW)}  ${padStart('Size(old)', sizeW)} ${padStart('Size(new)', sizeW)} ${padStart('Δ Size', pctW)}  ${padStart('N(old)', nodeW)} ${padStart('N(new)', nodeW)} ${padStart('Δ Nodes', pctW)}`,
  )
  console.log(sep)

  // Per-file rows
  for (const r of rows) {
    const sizeDelta = pct(r.exportSize, r.newSize)
    const nodeDelta = pct(r.exportNodes, r.newNodes)

    console.log(
      `${padEnd(r.file, nameW)}  ${padStart(formatBytes(r.exportSize), sizeW)} ${padStart(formatBytes(r.newSize), sizeW)} ${padStart(sizeDelta, pctW)}  ${padStart(r.exportNodes, nodeW)} ${padStart(r.newNodes, nodeW)} ${padStart(nodeDelta, pctW)}`,
    )
  }

  // Totals
  console.log(sep)
  console.log(
    `${padEnd('TOTAL', nameW)}  ${padStart(formatBytes(totalExportSize), sizeW)} ${padStart(formatBytes(totalNewSize), sizeW)} ${padStart(pct(totalExportSize, totalNewSize), pctW)}  ${padStart(totalExportNodes, nodeW)} ${padStart(totalNewNodes, nodeW)} ${padStart(pct(totalExportNodes, totalNewNodes), pctW)}`,
  )
  console.log()

  // Summary
  console.log(`Files compared:   ${rows.length}`)
  console.log(
    `Total size:       ${formatBytes(totalExportSize)} → ${formatBytes(totalNewSize)} (−${pct(totalExportSize, totalNewSize)})`,
  )
  console.log(
    `Total DOM nodes:  ${totalExportNodes} → ${totalNewNodes} (−${pct(totalExportNodes, totalNewNodes)})`,
  )
  console.log()
}

report()
