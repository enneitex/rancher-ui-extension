import MiddlewareListPo from '../../po/traefik/middleware-list.po';
import MiddlewareDetailPo from '../../po/traefik/middleware-detail.po';
import { makeMiddlewareStripPrefix } from './blueprints/middlewares';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('Middleware — navigation', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {
  let resourceName: string;

  before(() => {
    cy.login();
    cy.createE2EResourceName('mw-nav').then((name) => {
      resourceName = name;
      cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(name));
    });
  });

  beforeEach(() => {
    cy.login();
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ resourceName }`, false);
  });

  it('list page is reachable at /c/local/explorer/traefik.io.middleware', () => {
    const list = new MiddlewareListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    cy.url().should('include', 'traefik.io.middleware');
  });

  it('masthead Create button is present', () => {
    const list = new MiddlewareListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.masthead().createButton().should('be.visible');
  });

  it('Middleware item is visible in the Traefik side-nav group', () => {
    const list = new MiddlewareListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.sideNavLink('Middleware').should('be.visible');
  });

  it('resource created via API appears in the list', () => {
    const list = new MiddlewareListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.rowShouldExist(resourceName);
  });

  it('Types column shows the middleware type name (stripPrefix)', () => {
    const list = new MiddlewareListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.findRowByName(resourceName).should('contain.text', 'stripPrefix');
  });

  it('row action menu contains Edit Config, Clone, Download YAML and Delete', () => {
    const list = new MiddlewareListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.rowShouldExist(resourceName);

    list.list().actionMenu(resourceName).menuItemNames().then((names) => {
      expect(names).to.include('Edit YAML');
      expect(names).to.include('Clone');
      expect(names).to.include('Download YAML');
      expect(names).to.include('Delete');
    });
  });

  it('clicking the resource name navigates to the detail view', () => {
    const list = new MiddlewareListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.clickResourceName(resourceName);

    list.shouldBeOnDetailPage(NAMESPACE, resourceName);
  });

  it('detail view shows the resource name in the masthead', () => {
    const detail = new MiddlewareDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.mastheadTitle().should('contain', resourceName);
  });
});
