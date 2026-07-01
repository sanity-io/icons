import {readdir} from 'node:fs/promises'

export interface IconExportMeta {
  /** Named export of the icon component, e.g. `AccessDeniedIcon`. */
  componentName: string
  /** Subpath the icon is published on (no `Icon` suffix), e.g. `AccessDenied`. */
  exportName: string
}

/** Derives the icon export metadata from the generated `src/exports` directory. */
export async function readIconExportMetas(exportsDir: string): Promise<IconExportMeta[]> {
  const files = await readdir(exportsDir)

  return files
    .filter((file) => file.endsWith('.tsx'))
    .map((file) => {
      const exportName = file.slice(0, -'.tsx'.length)
      return {componentName: `${exportName}Icon`, exportName}
    })
}

function deprecationMessage(icon: IconExportMeta): string {
  return `Use \`import {${icon.componentName}} from '@sanity/icons/${icon.exportName}'\` instead, to avoid barrel file performance issues.`
}

/**
 * Restores the per-icon `@deprecated` TSDoc tags in the bundled barrel declaration file.
 *
 * The generated `src/index.ts` carries an `@deprecated` tag on every icon re-export specifier,
 * which deprecates barrel imports (`import {XIcon} from '@sanity/icons'`) without deprecating the
 * subpath imports (`import {XIcon} from '@sanity/icons/X'`). When rolldown bundles declarations it
 * merges all re-exports of `dist/index.d.ts` into a single `export { ... }` statement and drops
 * those comments, so this function rewrites that merged statement with the tags re-attached to
 * each icon specifier. Non-icon specifiers (`Icon`, `icons`, types) are left untouched.
 */
export function annotateBarrelDts(source: string, icons: IconExportMeta[]): string {
  const lines = source.split('\n')

  let statementLine = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i]?.startsWith('export { ') && lines[i]?.endsWith('};')) {
      statementLine = i
      break
    }
  }

  if (statementLine === -1) {
    // Already rewritten into the annotated multi-line form (idempotency for repeated builds).
    if (source.includes('barrel file performance issues')) return source

    throw new Error('annotate-barrel-dts: could not find the merged `export { ... }` statement')
  }

  const statement = lines[statementLine] as string
  const specifiers = statement.slice('export { '.length, -' };'.length).split(', ')

  const subpathByComponent = new Map(icons.map((icon) => [icon.componentName, icon]))
  const annotated = new Set<string>()

  const rewritten = specifiers.map((specifier) => {
    const icon = subpathByComponent.get(specifier)
    if (!icon) return `  ${specifier},`

    annotated.add(specifier)
    return [
      `  /**`,
      `   * @deprecated ${deprecationMessage(icon)}`,
      `   */`,
      `  ${specifier},`,
    ].join('\n')
  })

  if (annotated.size !== icons.length) {
    const missing = icons
      .filter((icon) => !annotated.has(icon.componentName))
      .map((icon) => icon.componentName)
    throw new Error(
      `annotate-barrel-dts: icons missing from the barrel export statement: ${missing.join(', ')}`,
    )
  }

  lines[statementLine] = `export {\n${rewritten.join('\n')}\n};`

  return lines.join('\n')
}
