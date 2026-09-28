import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [
    // `compiler` runs the React Compiler natively via `oxc-transform-react`
    // (the Rust port) in the same pass as TypeScript/JSX — no babel
    react({compiler: {target: '19'}}),
  ],
})
