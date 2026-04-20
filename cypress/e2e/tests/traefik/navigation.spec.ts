import IngressRouteListPo from '../../po/traefik/ingressroute-list.po';
import IngressRouteDetailPo from '../../po/traefik/ingressroute-detail.po';
import { makeIngressRoute } from './blueprints/ingressroutes';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRoute — navigation', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {
  let resourceName: string;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-nav').then((name) => {
      resourceName = name;
      cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(name, { match: 'Host(`nav.example.com`)' }));
    });
  });

  beforeEach(() => {
    cy.login();
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
  });

  it('row action menu contains Edit, Clone, Download YAML and Delete', () => {
    const list = new IngressRouteListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.rowShouldExist(resourceName);

    // Open the menu once and read all item names — avoids toggling the menu on each getMenuItem() call.
    list.list().actionMenu(resourceName).menuItemNames().then((names) => {
      expect(names).to.include('Edit Config');
      expect(names).to.include('Clone');
      expect(names).to.include('Download YAML');
      expect(names).to.include('Delete');
    });
  });

  it('clicking the resource name navigates to the detail view', () => {
    const list = new IngressRouteListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.clickResourceName(resourceName);

    list.shouldBeOnDetailPage(NAMESPACE, resourceName);
  });

  it('detail view shows the resource name and loads correctly', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.mastheadTitle().should('contain', resourceName);
  });
});
