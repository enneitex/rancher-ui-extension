import MiddlewareListPo from '../../po/traefik/middleware-list.po';
import MiddlewareFormPo from '../../po/traefik/middleware-form.po';

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

function makeBasicAuthYaml(name: string, secret: string) {
  return `apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: ${ name }
  namespace: ${ NAMESPACE }
spec:
  basicAuth:
    secret: ${ secret }
`;
}

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('Middleware — create', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  describe('stripPrefix middleware via YAML editor', () => {
    let resourceName: string;
    let removeMiddleware = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('mw-strip').then((name) => {
        resourceName = name;
      });
    });

    after('clean up', () => {
      if (removeMiddleware) {
        cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('creates a stripPrefix middleware from YAML and shows it in the list', () => {
      const form = new MiddlewareFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.yamlEditor().should('be.visible');
      form.setYaml(makeStripPrefixYaml(resourceName, ['/api', '/v1']));
      form.save();

      const list = new MiddlewareListPo(CLUSTER_ID);

      list.waitForPage();
      list.rowWithName(resourceName).checkVisible();
      list.findRowByName(resourceName).should('contain.text', 'stripPrefix');
      removeMiddleware = true;

      cy.getRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.stripPrefix.prefixes).to.deep.eq(['/api', '/v1']);
      });
    });
  });

  describe('basicAuth middleware via YAML editor', () => {
    let resourceName: string;
    let removeMiddleware = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('mw-auth').then((name) => {
        resourceName = name;
      });
    });

    after('clean up', () => {
      if (removeMiddleware) {
        cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('creates a basicAuth middleware from YAML and persists the secret reference', () => {
      const form = new MiddlewareFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.yamlEditor().should('be.visible');
      form.setYaml(makeBasicAuthYaml(resourceName, 'my-auth-secret'));
      form.save();

      const list = new MiddlewareListPo(CLUSTER_ID);

      list.waitForPage();
      list.rowWithName(resourceName).checkVisible();
      list.findRowByName(resourceName).should('contain.text', 'basicAuth');
      removeMiddleware = true;

      cy.getRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.basicAuth.secret).to.eq('my-auth-secret');
      });
    });
  });
});
