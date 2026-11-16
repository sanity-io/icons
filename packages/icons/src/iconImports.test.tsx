import {render} from '@testing-library/react'
import {Suspense} from 'react'
import {expect, test, vi} from 'vitest'

import {Icon} from './icon'
import {iconImports, icons, type IconSymbol} from './icons'

const symbols = ['wrench', 'trolley', 'lemon'] as const satisfies readonly IconSymbol[]

function isIconSymbol(symbol: string): symbol is IconSymbol {
  return Object.prototype.hasOwnProperty.call(iconImports, symbol)
}

test('iconImports and icons list the same symbols', () => {
  expect(Object.keys(iconImports).toSorted()).toEqual(Object.keys(icons).toSorted())

  for (const symbol of Object.keys(iconImports)) {
    if (!isIconSymbol(symbol)) throw new Error(`Unknown icon symbol: ${symbol}`)
    expect(typeof iconImports[symbol]).toBe('function')
  }
})

test('an icon that was not preloaded still paints the empty fallback first', () => {
  const {container} = render(<Icon symbol="ice-cream" />)

  expect(container.querySelector('svg[data-sanity-icon="ice-cream"]')).toBeEmptyDOMElement()
})

test('awaiting iconImports paints the icons without the empty fallback', async () => {
  const settled = await Promise.allSettled(symbols.map((symbol) => iconImports[symbol]()))

  expect(settled.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled', 'fulfilled'])

  const {container} = render(
    <>
      {symbols.map((symbol) => (
        <Icon key={symbol} symbol={symbol} />
      ))}
    </>,
  )

  for (const symbol of symbols) {
    expect(container.querySelector(`svg[data-sanity-icon="${symbol}"]`)).not.toBeEmptyDOMElement()
  }
})

test('icons[symbol] skips its fallback after the same import has resolved', async () => {
  await iconImports.moon()

  const MoonIcon = icons.moon
  const {container, queryByTestId} = render(
    <Suspense fallback={<span data-testid="fallback" />}>
      <MoonIcon />
    </Suspense>,
  )

  expect(queryByTestId('fallback')).not.toBeInTheDocument()
  expect(container.querySelector('svg[data-sanity-icon="moon"]')).not.toBeEmptyDOMElement()
})

test('a resolved iconImports loader is a Promise and chains', async () => {
  const loaded = await iconImports.hash()
  const cached = iconImports.hash()

  expect(cached).toBeInstanceOf(Promise)
  expect(await cached.then((mod) => mod).then((mod) => mod.default)).toBe(loaded.default)
  await expect(cached.catch((error: unknown) => Promise.reject(error))).resolves.toBe(loaded)
  await expect(cached.finally(() => undefined)).resolves.toBe(loaded)
})

test('a resolved loader calls then after its promise binding exists', async () => {
  await iconImports.hash()
  const seen: Array<Promise<unknown>> = []
  const request = iconImports.hash().then(() => {
    seen.push(request)
    return seen.length
  })

  await request
  expect(seen).toEqual([request])
})

test('a throwing finally callback on a resolved loader runs once and rejects', async () => {
  await iconImports.hash()
  const onFinally = vi.fn(() => {
    throw new Error('finally failed')
  })

  await expect(iconImports.hash().finally(onFinally)).rejects.toThrow('finally failed')
  expect(onFinally).toHaveBeenCalledTimes(1)
})
