import MiddlewareListPo from '../../po/traefik/middleware-list.po';
import MiddlewareFormPo from '../../po/traefik/middleware-form.po';
import { makeMiddlewareStripPrefix } from './blueprints/middlewares';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

function makeStripPrefixYaml(name: string, prefixes: string[]) {
  const renderedPrefixes = prefixes.map((prefix) => `    - ${ prefix }`).join('\n');

  return `apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: ${ name }
  namespace: ${ NAMESPACE }
spec:
  stripPrefix:
    prefixes:
${ renderedPrefixes }
`;
}

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('Middleware — edit', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  describe('Edit via YAML editor', () => {
    let resourceName: string;
    let removeMiddleware = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('mw-edit-yaml').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(name, ['/before']));
        removeMiddleware = true;
      });
    });

    after('clean up', () => {
      if (removeMiddleware) {
        cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('Edit YAML opens the editor with the existing resource and saves updates', () => {
      const list = new MiddlewareListPo(CLUSTER_ID);
      const form = new MiddlewareFormPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowWithName(resourceName).checkVisible();
      list.openEditConfig(resourceName);

      form.waitForEditPage();
      form.yamlEditor().should('be.visible');
      form.yamlEditor().should('contain.text', resourceName).and('contain.text', 'Middleware');
      form.setYaml(makeStripPrefixYaml(resourceName, ['/after']));
      form.save();

      list.waitForPage();
      list.rowWithName(resourceName).checkVisible();

      cy.getRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.stripPrefix.prefixes).to.deep.eq(['/after']);
      });
    });
  });

  describe('Delete from list', () => {
    let resourceName: string;
    let removeMiddleware = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('mw-del').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(name));
        removeMiddleware = true;
      });
    });

    after('clean up', () => {
      if (removeMiddleware) {
        cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('deletes the middleware via the list action menu', () => {
      const list = new MiddlewareListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowWithName(resourceName).checkVisible();
      list.deleteResourceByName(resourceName);
      list.rowElementWithName(resourceName).should('not.exist');
      removeMiddleware = false;
    });
  });
});
