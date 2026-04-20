/**
 * IngressRouteTCP — MiddlewareTCP dropdown (secondary resource) tests
 *
 * These tests verify that the IngressRouteTCP create form correctly loads
 * existing MiddlewareTCP resources and populates the middleware dropdown.
 *
 * The form fetches `traefik.io.middlewaretcp` (not HTTP Middleware) — these tests
 * confirm that only MiddlewareTCP resources appear in the dropdown, not HTTP Middlewares.
 *
 * Pattern:
 *   1. Create a MiddlewareTCP via API.
 *   2. Open the IngressRouteTCP create form.
 *   3. Assert no "no middleware" banner.
 *   4. Assert the MiddlewareTCP appears in the dropdown.
 *   5. Select it and verify it is visually selected.
 *   6. Save a full IngressRouteTCP and assert the API persists the middleware reference.
 *   7. Clean up all resources in `after()`.
 */

import IngressRouteTCPFormPo from '../../po/traefik/ingressroutetcp-form.po';
import IngressRouteTCPListPo from '../../po/traefik/ingressroutetcp-list.po';
import { makeMiddlewareTCP, makeMiddlewareStripPrefix } from './blueprints/middlewares';

const CLUSTER_ID = 'local';
const NAMESPACE   = 'default';

// ── MiddlewareTCP dropdown ────────────────────────────────────────────────────

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRouteTCP — MiddlewareTCP dropdown (secondary resource)', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  let middlewareTcpName: string;
  let httpMiddlewareName: string;

  before(() => {
    cy.login();

    // Create a MiddlewareTCP resource
    cy.createE2EResourceName('irtcp-mwtcp').then((name) => {
      middlewareTcpName = name;
      cy.createRancherResource('v1', 'traefik.io.middlewaretcps', makeMiddlewareTCP(middlewareTcpName));
    });

    // Create a plain HTTP Middleware — it should NOT appear in the IngressRouteTCP dropdown
    cy.createE2EResourceName('irtcp-mwhttp').then((name) => {
      httpMiddlewareName = name;
      cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(httpMiddlewareName));
    });
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'traefik.io.middlewaretcps', `${ NAMESPACE }/${ middlewareTcpName }`, false);
    cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ httpMiddlewareName }`, false);
  });

  beforeEach(() => {
    cy.login();
  });

  it('no "no middleware" banner when a MiddlewareTCP exists', () => {
    const form = new IngressRouteTCPFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.routesTab().click();

    // Banner should NOT be visible because a MiddlewareTCP exists
    form.middlewareEmptyBanner().should('not.exist');
  });

  it('the existing MiddlewareTCP appears in the middleware dropdown', () => {
    const form = new IngressRouteTCPFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.routesTab().click();

    form.addMiddlewareButton().click();
    form.middlewareTcpOptionShouldExist(middlewareTcpName);
  });

  it('the HTTP Middleware does NOT appear in the IngressRouteTCP middleware dropdown', () => {
    const form = new IngressRouteTCPFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.routesTab().click();

    form.addMiddlewareButton().click();
    form.middlewareTcpOptionShouldNotExist(httpMiddlewareName);
  });

  it('can select the MiddlewareTCP and it appears as a selected tag', () => {
    const form = new IngressRouteTCPFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.routesTab().click();

    form.addMiddlewareButton().click();
    form.selectMiddleware(middlewareTcpName);

    form.middlewareSelect()
      .contains('.vs__selected', middlewareTcpName)
      .should('be.visible');
  });

  describe('create with MiddlewareTCP and verify API', () => {
    let irName: string;

    before(() => {
      // Guard: outer describe must have created the MiddlewareTCP before this runs
      cy.wrap(middlewareTcpName).should('be.a', 'string');
      cy.login();
      cy.createE2EResourceName('irtcp-with-mwtcp').then((name) => {
        irName = name;
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ irName }`, false);
    });

    it('creates an IngressRouteTCP with a MiddlewareTCP and verifies it in the API', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.setName(irName);

      form.entryPointsTab().click();
      form.addEntryPoint('tcpep');

      form.routesTab().click();
      // Default match HostSNI(`*`) is acceptable
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      // Add the MiddlewareTCP to the route
      form.addMiddlewareButton().click();
      form.selectMiddleware(middlewareTcpName);

      form.save();

      const list = new IngressRouteTCPListPo(CLUSTER_ID);

      list.waitForPage();
      list.rowShouldExist(irName);

      cy.getRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ irName }`).then((resp) => {
        const middlewares = resp.body?.spec?.routes?.[0]?.middlewares ?? [];

        expect(middlewares).to.have.length.gte(1);
        expect(middlewares[0].name).to.eq(middlewareTcpName);
      });
    });
  });

});
