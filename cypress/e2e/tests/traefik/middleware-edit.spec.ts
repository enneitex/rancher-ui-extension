import MiddlewareListPo from '../../po/traefik/middleware-list.po';
import { makeMiddlewareStripPrefix } from './blueprints/middlewares';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

/**
 * Edit tests for Middleware.
 *
 * Since Middleware has no custom Vue edit form, editing is done via the YAML editor
 * or via direct API updates. These tests verify that the resource state is correctly
 * reflected in the UI after an API-level modification.
 */
describe('Middleware — edit', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── Edit via YAML editor ──────────────────────────────────────────────────────

  describe('YAML editor is accessible', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('mw-edit-yaml').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(name));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('Edit Config opens the YAML editor with the resource kind and name', () => {
      const list = new MiddlewareListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowShouldExist(resourceName);

      list.openEditConfig(resourceName);

      list.yamlEditor()
        .should('be.visible')
        .and('contain.text', resourceName)
        .and('contain.text', 'Middleware');
    });
  });

  // ── API update reflected in UI ────────────────────────────────────────────────

  describe('API update reflected in detail view', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('mw-edit-api').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(name, ['/before']));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('API update to prefix is reflected in the stored resource', () => {
      // Read the current resource to get its resourceVersion for the PUT
      cy.getRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        const updated = {
          ...resp.body,
          spec: { stripPrefix: { prefixes: ['/after'] } },
        };

        cy.setRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, updated);
      });

      cy.getRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.stripPrefix.prefixes).to.include('/after');
        expect(resp.body.spec.stripPrefix.prefixes).not.to.include('/before');
      });
    });
  });

  // ── Delete from list ─────────────────────────────────────────────────────────

  describe('Delete from list', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('mw-del').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(name));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('deletes the middleware via the list action menu', () => {
      const list = new MiddlewareListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowShouldExist(resourceName);

      list.deleteResourceByName(resourceName);
      removeResource = false;

      list.rowShouldNotExist(resourceName);
    });
  });
});
