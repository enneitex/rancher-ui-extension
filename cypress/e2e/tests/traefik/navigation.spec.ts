import IngressRouteListPo from '../../po/traefik/ingressroute-list.po';
import IngressRouteDetailPo from '../../po/traefik/ingressroute-detail.po';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

function makeIngressRoute(name: string) {
  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'IngressRoute',
    metadata:   { name, namespace: NAMESPACE },
    spec:       {
      entryPoints: ['web'],
      routes:      [{ kind: 'Rule', match: 'Host(`nav.example.com`)', services: [{ name: 'kubernetes', port: 443 }] }],
    },
  };
}

describe('IngressRoute — navigation', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {
  let resourceName: string;
  let removeResource = false;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-nav').then((name) => {
      resourceName = name;
      cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(name));
      removeResource = true;
    });
  });

  beforeEach(() => {
    cy.login();
  });

  after('clean up', () => {
    if (removeResource) {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
    }
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

    cy.url().should('include', `${ NAMESPACE }/${ resourceName }`);
    cy.url().should('not.include', 'create').and('not.include', 'mode=edit');
  });

  it('detail view shows the resource name and loads correctly', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.mastheadTitle().should('contain', resourceName);
  });
});
