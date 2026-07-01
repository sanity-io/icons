# @sanity/icons

The Sanity icons.

```sh
npm install @sanity/icons

# Install peer dependencies (requires React 19 or newer)
npm install react
```

[![npm version](https://img.shields.io/npm/v/@sanity/icons.svg?style=flat-square)](https://www.npmjs.com/package/@sanity/icons)

## Usage

```jsx
import {RocketIcon} from '@sanity/icons'

function App () {
  return <RocketIcon style={{fontSize: 72}}>
}
```

### Individual icon imports

Every icon is also published on its own export path. The subpath is the icon's name **without**
the `Icon` suffix, e.g. `RocketIcon` lives at `@sanity/icons/Rocket`. This is an opt-in way to
reduce bundle size and speed up tree-shaking, since it lets your bundler skip parsing and
resolving the full icon set to reach the handful of icons you actually use:

```jsx
import {RocketIcon} from '@sanity/icons/Rocket'
```

The named export is identical to the one on the barrel, so `import {RocketIcon} from '@sanity/icons/Rocket'`
and `import {RocketIcon} from '@sanity/icons'` are interchangeable.

Each icon is also the module's default export, which makes lazy-loading a single icon easy:

```jsx
import {lazy} from 'react'

const RocketIcon = lazy(() => import('@sanity/icons/Rocket'))
```

## License

MIT-licensed. See LICENSE.
