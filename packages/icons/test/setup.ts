/// <reference types="@testing-library/jest-dom/vitest" />

import * as matchers from '@testing-library/jest-dom/matchers'
import {expect} from 'vitest'

// Do not import `@testing-library/jest-dom/vitest`. That entry resolves
// `vitest` from jest-dom's directory, and pnpm can link a different isolate
// of the same vitest version (different vite optional peers), so the matchers
// would attach to another isolate's `expect`.
expect.extend(matchers)
