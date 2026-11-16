import type {IconComponent, IconImporter} from './types'

interface IconModule {
  default: IconComponent
}

// `React.lazy` skips suspending only when `then` runs its handler before returning.
// A native promise runs that handler later, even after it has already fulfilled, so a
// second `import()` of a loaded module still paints the empty fallback.
class ResolvedModule extends Promise<IconModule> {
  #module?: IconModule

  static of(module: IconModule) {
    const resolved = new ResolvedModule((resolve) => {
      resolve(module)
    })
    resolved.#module = module
    return resolved
  }

  // oxlint-disable-next-line unicorn/no-thenable -- Promise subclass; the handler has to run before `then` returns
  override then<TResult1 = IconModule, TResult2 = never>(
    onfulfilled?: ((value: IconModule) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    if (!this.#module || !onfulfilled) return super.then(onfulfilled, onrejected)

    try {
      return Promise.resolve(onfulfilled(this.#module))
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

const lazyLoaders = new WeakMap<IconImporter, () => Promise<IconModule>>()

export function cachedIconImport(load: () => Promise<IconModule>): IconImporter {
  let resolved: IconModule | undefined
  let pending: Promise<IconModule> | undefined

  const importer: IconImporter = () => {
    if (resolved) return Promise.resolve(resolved)

    if (!pending) {
      pending = load().then(
        (loaded) => {
          resolved = loaded
          return loaded
        },
        (error: unknown) => {
          pending = undefined
          throw error
        },
      )
    }

    return pending
  }

  lazyLoaders.set(importer, () => (resolved ? ResolvedModule.of(resolved) : importer()))

  return importer
}

/** The loader `icons` passes to `React.lazy`. It shares the cache of `importer`. */
export function lazyIcon(importer: IconImporter): () => Promise<IconModule> {
  const load = lazyLoaders.get(importer)
  if (!load) throw new Error('Unknown icon importer')
  return load
}
