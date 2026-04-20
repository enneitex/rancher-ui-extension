import MiddlewareDetailPo from '../../po/traefik/middleware-detail.po';
import { makeMiddlewareMultiType, makeMiddlewareStripPrefix } from './blueprints/middlewares';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('Middleware — detail view', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── Single type card ─────────────────────────────────────────────────────────

  describe('Single middleware type', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('mw-detail-single').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(name));
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('Configuration tab is visible', () => {
      const detail = new MiddlewareDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.configurationTab().should('be.visible');
    });

    it('Configuration tab shows a card for the stripPrefix type', () => {
      const detail = new MiddlewareDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.configurationTab().click();

      // The detail view renders one Card per middleware type
      detail.middlewareCards().should('have.length', 1);
      // Card title uses getDisplayName() → i18n key; the raw type name is also in the title
      detail.middlewareCardByType('stripPrefix').should('be.visible');
    });

    it('card contains a YAML editor with the type configuration', () => {
      const detail = new MiddlewareDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.configurationTab().click();

      detail.middlewareCardYaml('stripPrefix').should('exist');
    });

    it('Edit action in the masthead menu opens the edit form', () => {
      const detail = new MiddlewareDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.editFromMasthead();

      cy.url().should('include', 'mode=edit');
    });

    it('Delete action in the masthead opens the confirmation dialog', () => {
      const detail = new MiddlewareDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.deleteFromMasthead();

      detail.cancelDelete();
      detail.waitForPage();
    });
  });

  // ── Multiple type cards ───────────────────────────────────────────────────────

  describe('Multiple middleware types', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('mw-detail-multi').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareMultiType(name));
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('navigating to a middleware with multiple types shows multiple cards', () => {
      const detail = new MiddlewareDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.configurationTab().click();

      detail.middlewareCards().should('have.length', 2);
    });
  });
});
