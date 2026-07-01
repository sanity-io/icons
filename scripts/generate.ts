// oxlint-disable no-console

import {readFile, writeFile} from 'fs/promises'
import path from 'path'
import prettierConfig from '@sanity/prettier-config'
import {transform} from '@svgr/core'
import camelCase from 'camelcase'
import {globby} from 'globby'
import {mkdirp} from 'mkdirp'
import {format} from 'prettier'

const ROOT_PATH = path.resolve(__dirname, '..')
const IMPORT_PATH = path.resolve(ROOT_PATH, 'export')
const SRC_ICONS_PATH = path.resolve(ROOT_PATH, 'src/icons')
const SRC_EXPORTS_PATH = path.resolve(ROOT_PATH, 'src/exports')
const PACKAGE_JSON_PATH = path.resolve(ROOT_PATH, 'package.json')

const GENERATED_BANNER = `/* THIS FILE IS AUTO-GENERATED – DO NOT EDIT */`

// Marks entries in `package.json`'s `exports` map that were generated for an individual
// icon, so they can be told apart from hand-authored entries (like `.`) on the next run.
const EXPORT_SOURCE_DIR = './src/exports/'

const __EXPORT_TEMPLATE__ = `/* THIS FILE IS AUTO-GENERATED – DO NOT EDIT */

export {__NAME__} from '../icons/__BASENAME__'
`

const __TEMPLATE__ = `/* THIS FILE IS AUTO-GENERATED – DO NOT EDIT */

import {forwardRef, type ForwardRefExoticComponent, type RefAttributes, type SVGProps} from 'react'

/**
 * @public
 */
export const __NAME__: ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, "ref"> & RefAttributes<SVGSVGElement>
> = /* @__PURE__ */ forwardRef(function __NAME__(props, ref) {
  return (
    __JSX__
  )
});
`

async function readIcon(filePath: string) {
  const relativePath = path.relative(IMPORT_PATH, filePath)
  const nameSegments = relativePath.split('/')
  const filename = nameSegments.pop()

  if (!filename) throw new Error('no filename')

  // Add name to segments
  nameSegments.push(...filename.split('.').slice(0, -1))

  const name = nameSegments.join('-')
  const componentName = camelCase(`${name}-icon`, {pascalCase: true})
  const basename = camelCase(name) + 'Icon'
  const targetPath = path.resolve(SRC_ICONS_PATH, `${basename}.tsx`)

  // Read SVG markup
  const svgMarkupBuf = await readFile(filePath)

  let code = await transform(
    svgMarkupBuf.toString(),
    {icon: true, ref: true, typescript: true},
    {componentName},
  )

  code = __TEMPLATE__.replace(/__JSX__/g, code)

  code = code.replace(/__NAME__/g, componentName)

  code = code.replace(
    /xmlns="http:\/\/www.w3.org\/2000\/svg"/g,
    ' xmlns="http://www.w3.org/2000/svg" {...props} ref={ref}',
  )

  code = code.replace(/width="25"/g, `width="1em"`)
  code = code.replace(/height="25"/g, `height="1em"`)

  code = code.replace(/stroke-width=/g, `strokeWidth=`)
  code = code.replace(/stroke-linecap=/g, `strokeLinecap=`)
  code = code.replace(/stroke-linejoin=/g, `strokeLinejoin=`)
  code = code.replace(/clip-rule=/g, `clipRule=`)
  code = code.replace(/fill-rule=/g, `fillRule=`)

  // replace `="0.5"` with `={0.5}`
  code = code.replace(/="(\d+(?:\.\d+)?)"/g, '={$1}')

  // Replace hex values with `currentColor`
  code = code
    .replace(/"#([0-9a-fA-F]{6})"/g, '"currentColor"')
    .replace('<svg ', `<svg data-sanity-icon="${name}" `)

  code = await format(code, {...prettierConfig, filepath: targetPath})

  return {
    basename,
    code,
    componentName,
    name,
    relativePath,
    sourcePath: filePath,
    targetPath,
  }
}

async function writeIcon(file: {code: string; targetPath: string}) {
  await writeFile(file.targetPath, file.code)
}

interface IconExportFile {
  basename: string
  componentName: string
}

/**
 * In addition to the `./icons/<basename>` module used by the main `@sanity/icons` entry point,
 * every icon gets a thin re-export module of its own under `src/exports`. These are registered
 * as individual `exports` entries in `package.json`, so that consumers can opt in to importing
 * a single icon directly, e.g. `import {RocketIcon} from '@sanity/icons/RocketIcon'`, without
 * pulling in the full icon set.
 *
 * The re-export lives in its own file (rather than pointing `exports` straight at
 * `./icons/<basename>`) because that file is also imported by the `./icons` barrel. Rollup
 * doesn't allow the same module to be treated as both external (as required for a standalone
 * entry point) and bundled (as part of the barrel) within a single build.
 */
async function getExportFile(file: {
  basename: string
  componentName: string
}): Promise<IconExportFile & {code: string; targetPath: string}> {
  const targetPath = path.resolve(SRC_EXPORTS_PATH, `${file.componentName}.ts`)

  const code = await format(
    __EXPORT_TEMPLATE__
      .replace(/__NAME__/g, file.componentName)
      .replace(/__BASENAME__/g, file.basename),
    {...prettierConfig, filepath: targetPath},
  )

  return {basename: file.basename, code, componentName: file.componentName, targetPath}
}

async function writeExportFile(file: {code: string; targetPath: string}) {
  await writeFile(file.targetPath, file.code)
}

function isGeneratedIconExport(value: unknown): value is {source: string} {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as {source?: unknown}).source === 'string' &&
    (value as {source: string}).source.startsWith(EXPORT_SOURCE_DIR)
  )
}

async function updatePackageExports(files: IconExportFile[]) {
  const pkg = JSON.parse(await readFile(PACKAGE_JSON_PATH, 'utf8')) as {
    exports?: Record<string, unknown>
  }

  const staticExports: Record<string, unknown> = {}
  for (const [exportPath, value] of Object.entries(pkg.exports ?? {})) {
    if (!isGeneratedIconExport(value)) {
      staticExports[exportPath] = value
    }
  }

  // Keep `./package.json` last, matching the convention used elsewhere in the ecosystem.
  const {'./package.json': packageJsonExport, ...otherExports} = staticExports

  const iconExportEntries = Object.fromEntries(
    files.map((file) => [
      `./${file.componentName}`,
      {
        source: `${EXPORT_SOURCE_DIR}${file.componentName}.ts`,
        import: `./dist/exports/${file.componentName}.js`,
        require: `./dist/exports/${file.componentName}.cjs`,
        default: `./dist/exports/${file.componentName}.js`,
      },
    ]),
  )

  pkg.exports = {
    ...otherExports,
    ...iconExportEntries,
    ...(packageJsonExport === undefined ? {} : {'./package.json': packageJsonExport}),
  }

  await writeFile(PACKAGE_JSON_PATH, `${JSON.stringify(pkg, null, 2)}\n`)
}

async function generate() {
  await mkdirp(SRC_ICONS_PATH)
  await mkdirp(SRC_EXPORTS_PATH)

  const filePaths = await globby(path.join(IMPORT_PATH, '**/*.svg'))
  const files = await Promise.all(filePaths.map(readIcon))

  files.sort((a, b) => {
    if (a.componentName < b.componentName) {
      return -1
    }

    if (a.componentName > b.componentName) {
      return 1
    }

    return 0
  })

  await Promise.all(files.map(writeIcon))

  const exportFiles = await Promise.all(files.map(getExportFile))
  await Promise.all(exportFiles.map(writeExportFile))
  await updatePackageExports(exportFiles)

  const importTypes = `import type {IconComponent} from '../types'`

  const iconImports = files
    .map((f) => `import {${f.componentName}} from './${f.basename}';`)
    .join('\n')

  const typesExports = `/**\n * @public\n */\nexport type IconSymbol = \n${files
    .map((f) => `| '${f.name}'`)
    .join('\n')};`

  const iconExports = `export {${files.map((f) => f.componentName).join(',')}}`

  const iconMapInterface = `/**\n * @public\n */\nexport interface IconMap {${files
    .map((f) => `'${f.name}': IconComponent`)
    .join(',')}}`

  const iconsExport = `/**\n * @public\n */\nexport const icons: IconMap = {${files
    .map((f) => `'${f.name}': ${f.componentName}`)
    .join(',')}}`

  // const getIconsMap = `const getIcons: () => IconMap = () => ({${files
  //   .map((f) => `'${f.name}': ${f.componentName}`)
  //   .join(',')}})`

  // const iconsExport = `/**\n * @public\n */\nexport const icons: IconMap = /* @__PURE__ */ getIcons();`

  const indexPath = path.resolve(SRC_ICONS_PATH, `index.ts`)

  const indexTsCode = await format(
    [
      GENERATED_BANNER,
      importTypes,
      iconImports,
      typesExports,
      iconExports,
      iconMapInterface,
      // getIconsMap,
      iconsExport,
    ].join('\n\n'),
    {
      ...prettierConfig,
      filepath: indexPath,
    },
  )

  await writeFile(indexPath, indexTsCode)

  console.log(`generated ${files.length} icons:`, files.map((f) => f.name).join(', '))
}

generate().catch((err) => {
  console.error(err)
  process.exit(1)
})
