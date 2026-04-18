import IngressRouteDetailPo from '../../po/traefik/ingressroute-detail.po';
import IngressRouteFormPo from '../../po/traefik/ingressroute-form.po';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

function makeIngressRoute(name: string) {
  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'IngressRoute',
    metadata:   { name, namespace: NAMESPACE },
    spec:       {
      entryPoints: ['web'],
      routes:      [{
        kind:     'Rule',
        match:    'Host(`detail-test.example.com`)',
        services: [{ name: 'kubernetes', port: 443 }],
      }],
    },
  };
}

describe('IngressRoute — detail view', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {
  let resourceName: string;
  let removeResource = false;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-detail').then((name) => {
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

  it('detail view shows the resource name in the masthead', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    // span.masthead-resource-title is rendered by the <t> component with :name="displayName"
    detail.mastheadTitle().should('contain', resourceName);
  });

  it('Routes tab is visible and shows the match rule', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.routesTab().click();
    detail.routesTable().should('contain', 'detail-test.example.com');
  });

  it('Routes tab shows the service name', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.routesTab().click();
    detail.routesTable().should('contain', 'kubernetes');
  });

  it('TLS tab shows the "not configured" message when TLS is absent', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.tlsTab().click();
    detail.tlsNotConfiguredText().should('be.visible');
  });

  it('Edit action in the masthead menu navigates to the edit form', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.editFromMasthead();

    cy.url().should('include', 'mode=edit');
  });

  it('Delete action in the masthead menu opens the confirmation dialog', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.deleteFromMasthead();

    // Confirmation dialog should appear
    cy.get('.prompt-remove').should('be.visible');

    // Cancel to keep the resource
    detail.cancelDelete();
    detail.waitForPage();
  });

});
