/**
 * IngressRoute — secondary resource integration tests
 *
 * These tests cover the cases where the IngressRoute create form loads existing
 * cluster resources and populates dropdown menus:
 *   - Middlewares  → route's middleware selector
 *   - TLS Options  → TLS tab's "TLS Options" select
 *   - TLS Secrets  → TLS tab's "TLS Secret Name" select
 *
 * Each describe block follows the same pattern:
 *   1. Create the secondary resource via API in `before()`.
 *   2. Open the IngressRoute create form.
 *   3. Assert the resource appears in the relevant dropdown.
 *   4. Select it and assert it is visually selected.
 *   5. (Where applicable) save the form and assert the value is persisted in the API.
 *   6. Clean up all created resources in `after()`.
 */

import IngressRouteFormPo from '../../po/traefik/ingressroute-form.po';
import IngressRouteListPo from '../../po/traefik/ingressroute-list.po';
import { makeMiddlewareStripPrefix, makeK8sTLSSecret } from './blueprints/middlewares';
import { makeTLSOption } from './blueprints/tlsoptions';

const CLUSTER_ID = 'local';
const NAMESPACE   = 'default';

// ── 2.6 Routes — middlewares ──────────────────────────────────────────────────

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRoute — middleware dropdown (secondary resource)', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  let middlewareName: string;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-mw').then((name) => {
      middlewareName = name;
      cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(middlewareName));
    });
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ middlewareName }`, false);
  });

  beforeEach(() => {
    cy.login();
  });

  it('middleware dropdown does not show the "no middlewares" banner when one exists', () => {
    const form = new IngressRouteFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.routesTab().click();

    // The banner should NOT be visible because at least one middleware exists
    form.middlewareEmptyBanner().should('not.exist');
  });

  it('the existing middleware appears as an option in the dropdown', () => {
    const form = new IngressRouteFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.routesTab().click();

    form.addMiddlewareButton().click();
    form.middlewareOptionShouldExist(middlewareName);
  });

  it('can select the middleware and it appears as a selected tag', () => {
    const form = new IngressRouteFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.routesTab().click();

    form.addMiddlewareButton().click();
    form.selectMiddleware(middlewareName);

    form.middlewareSelect()
      .contains('.vs__selected', middlewareName)
      .should('be.visible');
  });

  describe('create with middleware and verify API', () => {
    let irName: string;

    before(() => {
      // Guard: outer describe must have created the middleware before this runs
      cy.wrap(middlewareName).should('be.a', 'string');
      cy.login();
      cy.createE2EResourceName('ir-with-mw').then((name) => {
        irName = name;
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ irName }`, false);
    });

    it('creates an IngressRoute with the middleware and verifies it in the API', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.setName(irName);

      form.entryPointsTab().click();
      form.clearEntryPoints();
      form.addEntryPoint('websecure');

      form.routesTab().click();
      form.matchInput().type('Host(`mw-test.example.com`)');
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      // Add middleware to the route
      form.addMiddlewareButton().click();
      form.selectMiddleware(middlewareName);

      form.save();

      const list = new IngressRouteListPo(CLUSTER_ID);

      list.waitForPage();
      list.rowShouldExist(irName);

      cy.getRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ irName }`).then((resp) => {
        const middlewares = resp.body?.spec?.routes?.[0]?.middlewares ?? [];

        expect(middlewares).to.have.length.gte(1);
        expect(middlewares[0].name).to.eq(middlewareName);
      });
    });
  });

});

// ── 2.7 TLS tab — TLS Options ─────────────────────────────────────────────────

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRoute — TLS Options dropdown (secondary resource)', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  let tlsOptionName: string;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-tlsopt').then((name) => {
      tlsOptionName = name;
      cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(tlsOptionName, { minVersion: 'VersionTLS12' }));
    });
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ tlsOptionName }`, false);
  });

  beforeEach(() => {
    cy.login();
  });

  it('the existing TLS option appears in the TLS Options dropdown', () => {
    const form = new IngressRouteFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.tlsTab().click();
    form.enableTls();

    form.tlsOptionShouldExist(tlsOptionName);
  });

  it('can select the TLS option and it appears as a selected tag', () => {
    const form = new IngressRouteFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.tlsTab().click();
    form.enableTls();

    form.selectTlsOption(tlsOptionName);

    form.tlsOptionsSelect()
      .contains('.vs__selected', tlsOptionName)
      .should('be.visible');
  });

  describe('create with TLS option and verify API', () => {
    let irName: string;

    before(() => {
      // Guard: outer describe must have created the TLS option before this runs
      cy.wrap(tlsOptionName).should('be.a', 'string');
      cy.login();
      cy.createE2EResourceName('ir-with-tlsopt').then((name) => {
        irName = name;
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ irName }`, false);
    });

    it('creates an IngressRoute with a TLS option and verifies it in the API', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.setName(irName);

      form.entryPointsTab().click();
      form.clearEntryPoints();
      form.addEntryPoint('websecure');

      form.routesTab().click();
      form.matchInput().type('Host(`tlsopt-test.example.com`)');
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      form.tlsTab().click();
      form.enableTls();
      form.selectTlsOption(tlsOptionName);

      form.save();

      const list = new IngressRouteListPo(CLUSTER_ID);

      list.waitForPage();
      list.rowShouldExist(irName);

      cy.getRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ irName }`).then((resp) => {
        expect(resp.body?.spec?.tls?.options?.name).to.eq(tlsOptionName);
      });
    });
  });

});

// ── 2.7 TLS tab — TLS Secret ──────────────────────────────────────────────────

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRoute — TLS Secret dropdown (secondary resource)', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  let secretName: string;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-tlssec').then((name) => {
      secretName = name;
      cy.createRancherResource('v1', 'secrets', makeK8sTLSSecret(secretName));
    });
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'secrets', `${ NAMESPACE }/${ secretName }`, false);
  });

  beforeEach(() => {
    cy.login();
  });

  it('the existing TLS secret appears in the TLS Secret Name dropdown', () => {
    const form = new IngressRouteFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.tlsTab().click();
    form.enableTls();

    form.tlsSecretShouldExist(secretName);
  });

  it('can select the TLS secret and it appears as a selected tag', () => {
    const form = new IngressRouteFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.tlsTab().click();
    form.enableTls();

    form.selectTlsSecret(secretName);

    form.tlsSecretSelect()
      .contains('.vs__selected', secretName)
      .should('be.visible');
  });

  describe('create with TLS secret and verify API', () => {
    let irName: string;

    before(() => {
      // Guard: outer describe must have created the TLS secret before this runs
      cy.wrap(secretName).should('be.a', 'string');
      cy.login();
      cy.createE2EResourceName('ir-with-tlssec').then((name) => {
        irName = name;
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ irName }`, false);
    });

    it('creates an IngressRoute with a TLS secret and verifies it in the API', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.setName(irName);

      form.entryPointsTab().click();
      form.clearEntryPoints();
      form.addEntryPoint('websecure');

      form.routesTab().click();
      form.matchInput().type('Host(`tlssec-test.example.com`)');
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      form.tlsTab().click();
      form.enableTls();
      form.selectTlsSecret(secretName);

      form.save();

      const list = new IngressRouteListPo(CLUSTER_ID);

      list.waitForPage();
      list.rowShouldExist(irName);

      cy.getRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ irName }`).then((resp) => {
        expect(resp.body?.spec?.tls?.secretName).to.eq(secretName);
      });
    });
  });

});
