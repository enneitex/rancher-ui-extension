import '@rancher/cypress/support/commands/commands';
import '@rancher/cypress/support/commands/rancher-api-commands';

// Force a fresh Rancher session at the start of every spec file.
//
// cy.login() uses cy.session() which caches the R_SESS cookie across specs.
// Once the token expires (~60s in the test environment) any cy.request() in a
// before() hook gets a 401 before the outer beforeEach() can refresh the session.
// Clearing all saved sessions here guarantees the first cy.login() of each spec
// runs the full authentication flow instead of restoring an expired token.
before(() => {
  Cypress.session.clearAllSavedSessions();
});

const SILENCED_URL_PATTERNS = [
  '/v1/catalog.cattle.io.apps',
  '/v1/management.cattle.io.rancherusernotifications',
  '/v1/userpreferences',
  '/v1/management.cattle.io.fleetworkspaces',
  '/v1/management.cattle.io.user',
  '/v1/ext.cattle.io.selfuser',
  '/v1/schemas',
  '/v3/schemas',
  '/v1-public/authproviders',
  '/v1/management.cattle.io.clusters',
];

Cypress.on('log:added', (_attrs, log: any) => {
  const name: string = log.get('displayName') || '';
  const url: string  = log.get('url') || '';

  if (
    (name === 'fetch' || name === 'xhr') &&
    SILENCED_URL_PATTERNS.some((pattern) => url.includes(pattern))
  ) {
    log.set({ hidden: true });
  }
});
