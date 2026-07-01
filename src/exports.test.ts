import {readdirSync, readFileSync} from 'node:fs'
import path from 'node:path'
import {icons} from './icons'

const ROOT_PATH = path.join(__dirname, '..')
const EXPORTS_DIR = path.join(ROOT_PATH, 'src/exports')

const packageJson = JSON.parse(readFileSync(path.join(ROOT_PATH, 'package.json'), 'utf8')) as {
  exports: Record<string, unknown>
}

const exportComponentNames = readdirSync(EXPORTS_DIR)
  .filter((file) => file.endsWith('.ts'))
  .map((file) => file.replace(/\.ts$/, ''))
  .sort()

describe('per-icon export paths', () => {
  test('every icon gets its own export file', () => {
    expect(exportComponentNames.length).toBe(Object.keys(icons).length)
  })

  test.each(exportComponentNames)(
    '"%s" re-exports the matching component from `./icons`',
    (componentName) => {
      const source = readFileSync(path.join(EXPORTS_DIR, `${componentName}.ts`), 'utf8')
      const match = source.match(/export \{(\w+)\} from '\.\.\/icons\/(\w+)'/)

      expect(match).not.toBeNull()
      const [, exportedName, basename] = match as RegExpMatchArray
      expect(exportedName).toBe(componentName)

      const exportModule = require(`./exports/${componentName}`)
      const iconModule = require(`./icons/${basename}`)

      expect(exportModule[componentName]).toBeDefined()
      expect(exportModule[componentName]).toBe(iconModule[componentName])
      expect(Object.values(icons)).toContain(exportModule[componentName])
    },
  )

  test.each(exportComponentNames)(
    '"%s" has a matching `exports` entry in package.json',
    (componentName) => {
      expect(packageJson.exports[`./${componentName}`]).toMatchObject({
        source: `./src/exports/${componentName}.ts`,
        import: `./dist/exports/${componentName}.js`,
        require: `./dist/exports/${componentName}.cjs`,
        default: `./dist/exports/${componentName}.js`,
      })
    },
  )

  test('package.json does not contain stale icon export entries', () => {
    const expectedKeys = new Set(exportComponentNames.map((componentName) => `./${componentName}`))
    const actualIconKeys = Object.keys(packageJson.exports).filter(
      (exportPath) => exportPath !== '.' && exportPath !== './package.json',
    )

    expect(new Set(actualIconKeys)).toEqual(expectedKeys)
  })
})
