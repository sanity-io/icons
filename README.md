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

Every icon is also published on its own export path, named after the icon component. This is
an opt-in way to reduce bundle size and speed up tree-shaking, since it lets your bundler skip
parsing and resolving the full icon set to reach the handful of icons you actually use:

```jsx
import {RocketIcon} from '@sanity/icons/RocketIcon'
```

This is entirely equivalent to importing `RocketIcon` from `@sanity/icons` directly – it's the
same component, just reachable through a dedicated path.

## License

MIT-licensed. See LICENSE.
