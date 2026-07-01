import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'ppsg7ml5',
    dataset: 'icons',
  },
  // Deploys the Studio to https://icons.sanity.studio. Needed until the first
  // `sanity deploy` returns an `appId` to pin below.
  // oxlint-disable-next-line typescript/no-deprecated
  studioHost: 'icons',
  deployment: {
    // The `appId` is generated on the first `sanity deploy`. Set it here afterwards
    // so subsequent (CI) deploys are non-interactive and pin the deployment.
    // appId: '<your-app-id>',
    autoUpdates: true,
  },
})
