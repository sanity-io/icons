import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'icons',
  },
  // Deploys the Studio to https://icons.sanity.studio.
  // oxlint-disable-next-line typescript/no-deprecated
  studioHost: 'icons',
  deployment: {
    appId: 'kzr7jgsqcbbjvtum223ykpir',
    autoUpdates: true,
  },
  // `transform: 'oxc'` runs the React Compiler natively via `oxc-transform-react`
  // (the Rust port) instead of `babel-plugin-react-compiler`
  reactCompiler: {target: '19', transform: 'oxc'},
})
