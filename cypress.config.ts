import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl:                process.env.TEST_BASE_URL || 'https://localhost:8005',
    specPattern:            'cypress/e2e/tests/**/*.spec.ts',
    supportFile:            'cypress/support/e2e.ts',
    fixturesFolder:         'cypress/fixtures',
    screenshotsFolder:      'cypress/screenshots',
    videosFolder:           'cypress/videos',
    screenshotOnRunFailure: true,
    video:                  false,
    defaultCommandTimeout:  10000,
    requestTimeout:         15000,
    responseTimeout:        30000,
    retries:                { runMode: 2, openMode: 0 },
    viewportWidth:          1280,
    viewportHeight:         900,
    experimentalSessionAndOrigin: true,

    setupNodeEvents(on, config) {
      // Derive API base URL from TEST_BASE_URL (same origin as the dashboard)
      config.env['api']               = process.env.TEST_BASE_URL || config.baseUrl;
      config.env['username']          = process.env.TEST_USERNAME || 'admin';
      config.env['password']          = process.env.TEST_PASSWORD || process.env.CATTLE_BOOTSTRAP_PASSWORD || '';
      // Used for the first-login bootstrap flow (Rancher sets firstLogin=true on fresh installs)
      config.env['bootstrapPassword'] = process.env.CATTLE_BOOTSTRAP_PASSWORD || process.env.TEST_PASSWORD || '';
      // URL where `yarn dev` serves the extension (used to configure dev-mode loading)
      config.env['extensionDevUrl']   = process.env.EXTENSION_DEV_URL || 'http://localhost:4500';

      return config;
    },
  },
});
