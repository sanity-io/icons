import {readdirSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import type {FileSystem} from 'typescript/unstable/fs'
import {API, DiagnosticCategory} from 'typescript/unstable/sync'
import {afterAll, describe, expect, test} from 'vitest'

const SRC_PATH = path.dirname(fileURLToPath(import.meta.url))
const TSCONFIG_PATH = path.resolve(SRC_PATH, '../tsconfig.json')

// In-memory consumer files probing the import styles against the source entry points
// (the same modules the published `exports` map points to in development).
const probes: Record<string, string> = {
  [path.join(SRC_PATH, '__probe_barrel__.ts')]: [
    `import {Icon, icons, type IconComponent, type IconMap, type IconSymbol} from './index'`,
    `const rocket: IconComponent = icons['rocket' satisfies IconSymbol]`,
    `const map: IconMap = icons`,
    `console.log(Icon, rocket, map)`,
    ``,
  ].join('\n'),
  [path.join(SRC_PATH, '__probe_removed_barrel_icon__.ts')]: [
    `import {AccessDeniedIcon} from './index'`,
    `console.log(AccessDeniedIcon)`,
    ``,
  ].join('\n'),
  [path.join(SRC_PATH, '__probe_subpath__.ts')]: [
    `import {AccessDeniedIcon} from './exports/AccessDenied'`,
    `import LazyDefault from './exports/AccessDenied'`,
    `console.log(AccessDeniedIcon, LazyDefault)`,
    ``,
  ].join('\n'),
}

// TypeScript 7 replaces the in-process language service with an API client
// driving the native compiler. The probes stay in-memory through a virtual
// filesystem overlay: they exist only in the overlay, which also merges them
// into the `src/` directory listing so the project's `include` picks them up,
// and everything else falls through (`undefined`) to the real filesystem.
function createProject() {
  const fs: FileSystem = {
    fileExists: (fileName) => (probes[fileName] === undefined ? undefined : true),
    readFile: (fileName) => probes[fileName] ?? undefined,
    getAccessibleEntries: (directoryName) => {
      if (path.resolve(directoryName) !== SRC_PATH) return undefined
      const entries = readdirSync(SRC_PATH, {withFileTypes: true})
      return {
        files: [
          ...entries.filter((entry) => entry.isFile()).map((entry) => entry.name),
          ...Object.keys(probes).map((probe) => path.basename(probe)),
        ],
        directories: entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
      }
    },
  }

  const api = new API({cwd: path.dirname(TSCONFIG_PATH), fs})
  const snapshot = api.updateSnapshot({openProjects: [TSCONFIG_PATH]})
  const project = snapshot.getProject(TSCONFIG_PATH)

  if (!project) throw new Error(`Failed to load project for ${TSCONFIG_PATH}`)

  return {project, close: () => api.close()}
}

describe('root entry surface', () => {
  const {project, close} = createProject()
  const [barrelProbe, removedIconProbe, subpathProbe] = Object.keys(probes) as [
    string,
    string,
    string,
  ]

  afterAll(close)

  function getSemanticErrors(probe: string) {
    return project.program
      .getSemanticDiagnostics(probe)
      .filter((diagnostic) => diagnostic.category === DiagnosticCategory.Error)
  }

  function getDeprecations(probe: string) {
    return project.program
      .getSuggestionDiagnostics(probe)
      .filter((diagnostic) => diagnostic.reportsDeprecated)
  }

  test('the dynamic barrel exports type-check without deprecations', () => {
    expect(getSemanticErrors(barrelProbe)).toEqual([])
    expect(getDeprecations(barrelProbe)).toEqual([])
  })

  test('importing an icon from the barrel is a type error, the export is removed', () => {
    const errors = getSemanticErrors(removedIconProbe)

    expect(errors.map((diagnostic) => diagnostic.code)).toContain(2305)
    expect(errors.map((diagnostic) => diagnostic.text)).toContain(
      `Module '"./index"' has no exported member 'AccessDeniedIcon'.`,
    )
  })

  test('importing an icon from its subpath type-checks without deprecations', () => {
    expect(getSemanticErrors(subpathProbe)).toEqual([])
    expect(getDeprecations(subpathProbe)).toEqual([])
  })
})
