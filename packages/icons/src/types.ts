import type {ComponentPropsWithRef, ComponentType} from 'react'

/**
 * A React component rendering an icon svg.
 *
 * Entries in the `icons` map are `React.lazy` components, so when rendered directly they
 * suspend until their chunk has loaded – wrap them in a `<Suspense>` boundary (or use the
 * `<Icon>` component, which brings its own).
 *
 * @public
 */
export type IconComponent = ComponentType<ComponentPropsWithRef<'svg'>>

/**
 * Loads one icon module. The module's `default` export is the icon component.
 *
 * @public
 */
export type IconImporter = () => Promise<{default: IconComponent}>
