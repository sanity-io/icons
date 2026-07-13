import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {rmSync, writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

import {afterAll, beforeAll, describe, expect, test} from 'vitest'

const SRC_PATH = path.dirname(fileURLToPath(import.meta.url))
const PROBE_FILE_PREFIX = `__probe_${process.pid}_${Date.now()}`

// In-memory consumer files probing the import styles against the source entry points
// (the same modules the published `exports` map points to in development).
const probes: Record<string, string> = {
  [path.join(SRC_PATH, `${PROBE_FILE_PREFIX}_barrel__.ts`)]: [
    `import {Icon, icons, type IconComponent, type IconMap, type IconSymbol} from './index'`,
    `const rocket: IconComponent = icons['rocket' satisfies IconSymbol]`,
    `const map: IconMap = icons`,
    `console.log(Icon, rocket, map)`,
    ``,
  ].join('\n'),
  [path.join(SRC_PATH, `${PROBE_FILE_PREFIX}_removed_barrel_icon__.ts`)]: [
    `import {AccessDeniedIcon} from './index'`,
    `console.log(AccessDeniedIcon)`,
    ``,
  ].join('\n'),
  [path.join(SRC_PATH, `${PROBE_FILE_PREFIX}_subpath__.ts`)]: [
    `import {AccessDeniedIcon} from './exports/AccessDenied'`,
    `import LazyDefault from './exports/AccessDenied'`,
    `console.log(AccessDeniedIcon, LazyDefault)`,
    ``,
  ].join('\n'),
}

const tscArgs = [
  '--ignoreConfig',
  '--strict',
  '--noEmit',
  '--target',
  'ESNext',
  '--module',
  'ESNext',
  '--moduleResolution',
  'bundler',
  '--jsx',
  'react-jsx',
  '--skipLibCheck',
]

describe('root entry surface', () => {
  const [barrelProbe, removedIconProbe, subpathProbe] = Object.keys(probes) as [
    string,
    string,
    string,
  ]

  beforeAll(() => {
    for (const [filePath, source] of Object.entries(probes)) {
      writeFileSync(filePath, source)
    }
  })

  afterAll(() => {
    for (const filePath of Object.keys(probes)) {
      rmSync(filePath, {force: true})
    }
  })

  function typecheck(probe: string) {
    const result = spawnSync('tsc', [...tscArgs, probe], {cwd: SRC_PATH, encoding: 'utf8'})
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n')
    if (result.status === null) {
      throw new Error(`tsc terminated unexpectedly: ${result.signal ?? 'unknown signal'}`)
    }

    return {exitCode: result.status, output}
  }

  test('the dynamic barrel exports type-check', () => {
    expect(typecheck(barrelProbe)).toEqual({exitCode: 0, output: ''})
  })

  test('importing an icon from the barrel is a type error, the export is removed', () => {
    const {exitCode, output} = typecheck(removedIconProbe)

    expect(exitCode).not.toBe(0)
    expect(output).toContain('error TS2305')
    expect(output).toContain(`Module '"./index"' has no exported member 'AccessDeniedIcon'.`)
  })

  test('importing an icon from its subpath type-checks', () => {
    expect(typecheck(subpathProbe)).toEqual({exitCode: 0, output: ''})
  })
})
