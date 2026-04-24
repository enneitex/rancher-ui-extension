import IngressRouteDetailPo from '../../po/traefik/ingressroute-detail.po';
import { makeIngressRoute } from './blueprints/ingressroutes';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRoute — detail view', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {
  let resourceName: string;
  let removeIngressRoute = false;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-detail').then((name) => {
      resourceName = name;
      cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(name, { match: 'Host(`detail-test.example.com`)' }));
      removeIngressRoute = true;
    });
  });

  beforeEach(() => {
    cy.login();
  });

  after('clean up', () => {
    if (removeIngressRoute) {
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

    detail.shouldBeOnEditPage();
  });

  it('Delete action in the masthead menu opens the confirmation dialog', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.deleteFromMasthead();

    detail.cancelDelete();
    detail.waitForPage();
  });

});
