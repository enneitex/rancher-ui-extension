import IngressRouteTCPListPo from '../../po/traefik/ingressroutetcp-list.po';
import IngressRouteTCPDetailPo from '../../po/traefik/ingressroutetcp-detail.po';
import { makeIngressRouteTCP } from './blueprints/ingressroutes';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRouteTCP — navigation', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {
  let resourceName: string;
  let removeIngressRouteTcp = false;

  before(() => {
    cy.login();
    cy.createE2EResourceName('irtcp-nav').then((name) => {
      resourceName = name;
      cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(name));
      removeIngressRouteTcp = true;
    });
  });

  beforeEach(() => {
    cy.login();
  });

  after('clean up', () => {
    if (removeIngressRouteTcp) {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
    }
  });

  it('list page is reachable at /c/local/explorer/traefik.io.ingressroutetcp', () => {
    const list = new IngressRouteTCPListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.waitForPage();
  });

  it('masthead Create button is present', () => {
    const list = new IngressRouteTCPListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.masthead().createButton().should('be.visible');
  });

  it('IngressRouteTCP item is visible in the Traefik side-nav group', () => {
    const list = new IngressRouteTCPListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.sideNavLink('IngressRouteTCP').should('be.visible');
  });

  it('resource created via API appears in the list', () => {
    const list = new IngressRouteTCPListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.rowWithName(resourceName).checkVisible();
  });

  it('entry-point column shows the correct value', () => {
    const list = new IngressRouteTCPListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.findRowByName(resourceName).should('contain', 'tcpep');
  });

  it('row action menu contains Edit Config, Clone, Download YAML and Delete', () => {
    const list = new IngressRouteTCPListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.rowWithName(resourceName).checkVisible();

    list.list().actionMenu(resourceName).menuItemNames().then((names) => {
      expect(names).to.include('Edit Config');
      expect(names).to.include('Clone');
      expect(names).to.include('Download YAML');
      expect(names).to.include('Delete');
    });
  });

  it('clicking the resource name navigates to the detail view', () => {
    const list = new IngressRouteTCPListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.clickResourceName(resourceName);

    list.shouldBeOnDetailPage(NAMESPACE, resourceName);
  });

  it('detail view shows the resource name in the masthead', () => {
    const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.mastheadTitle().should('contain', resourceName);
  });
});
