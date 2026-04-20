import '@rancher/cypress/support/commands/commands';
import '@rancher/cypress/support/commands/rancher-api-commands';

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

Cypress.on('log:added', (_attrs, log) => {
  const name: string = log.get('displayName') || '';
  const url: string  = log.get('url') || '';

  if (
    (name === 'fetch' || name === 'xhr') &&
    SILENCED_URL_PATTERNS.some((pattern) => url.includes(pattern))
  ) {
    log.set({ hidden: true });
  }
});
