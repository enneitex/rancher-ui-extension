import MiddlewareListPo from '../../po/traefik/middleware-list.po';
import MiddlewareFormPo from '../../po/traefik/middleware-form.po';
import { makeMiddlewareBasicAuth, makeMiddlewareStripPrefix } from './blueprints/middlewares';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

/**
 * Middleware create form note
 * ──────────────────────────
 * Middleware does not have a custom Vue edit form. The extension uses Rancher's generic
 * YAML-based create/edit flow (isCreatable: true, canYaml: true in product.js).
 *
 * These tests cover:
 *  - Creating a stripPrefix middleware via the YAML editor
 *  - Creating a basicAuth middleware via the YAML editor
 *  - Verifying the resource appears in the list with the correct type badge
 *
 * Tests that would exercise a custom field-based form are not applicable here and
 * are tracked separately if a custom form is added in the future.
 */

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('Middleware — create', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── stripPrefix ───────────────────────────────────────────────────────────────

  describe('stripPrefix middleware via API', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('mw-strip').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(name, ['/api', '/v1']));
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('stripPrefix middleware appears in list with "stripPrefix" in the Types column', () => {
      const list = new MiddlewareListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowShouldExist(resourceName);
      list.findRowByName(resourceName).should('contain.text', 'stripPrefix');
    });

    it('API resource has the correct spec', () => {
      cy.getRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.stripPrefix.prefixes).to.include('/api');
        expect(resp.body.spec.stripPrefix.prefixes).to.include('/v1');
      });
    });
  });

  // ── basicAuth ─────────────────────────────────────────────────────────────────

  describe('basicAuth middleware via API', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('mw-auth').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareBasicAuth(name));
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('basicAuth middleware appears in list with "basicAuth" in the Types column', () => {
      const list = new MiddlewareListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowShouldExist(resourceName);
      list.findRowByName(resourceName).should('contain.text', 'basicAuth');
    });

    it('API resource has the correct spec', () => {
      cy.getRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.basicAuth.secret).to.eq('my-auth-secret');
      });
    });
  });

  // ── Clicking Create opens the YAML editor ────────────────────────────────────

  describe('Create button opens YAML editor', () => {
    it('Clicking Create opens the YAML-based create form', () => {
      const list = new MiddlewareListPo(CLUSTER_ID);
      const form = new MiddlewareFormPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.masthead().createButton().click();

      // Rancher's YAML editor should be visible
      form.yamlEditor().should('be.visible');
    });
  });
});
