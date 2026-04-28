import IngressRouteDetailPo from '../../po/traefik/ingressroute-detail.po';
import IngressRouteListPo from '../../po/traefik/ingressroute-list.po';
import { makeIngressRoute } from './blueprints/ingressroutes';
import { makeMiddlewareStripPrefix } from './blueprints/middlewares';

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

});

// ── Routes tab: middleware names (detail view) ────────────────────────────────

describe('IngressRoute — detail view: middleware names in Routes tab', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {
  let middlewareName: string;
  let resourceName: string;
  let removeMiddleware = false;
  let removeIngressRoute = false;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-det-mw').then((mwName) => {
      middlewareName = mwName;
      cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(middlewareName));
      removeMiddleware = true;

      cy.createE2EResourceName('ir-det-mw-ir').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes',
          makeIngressRoute(name, {
            match:       'Host(`middleware-detail.example.com`)',
            middlewares: [{ name: middlewareName, namespace: NAMESPACE }],
          })
        );
        removeIngressRoute = true;
      });
    });
  });

  beforeEach(() => {
    cy.login();
  });

  after('clean up', () => {
    if (removeIngressRoute) {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
    }
    if (removeMiddleware) {
      cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ middlewareName }`, false);
    }
  });

  it('Routes tab shows the middleware name in the Middlewares column', () => {
    // RoutesTable renders a "Middlewares" column via MiddlewaresList — extension-owned behaviour.
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.routesTab().click();
    detail.routesTable().should('contain', middlewareName);
  });

});

// ── Ingress Class display (masthead + list column) ────────────────────────────

describe('IngressRoute — ingressClass display', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  describe('via spec.ingressClassName (Traefik v3+)', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-icn').then((name) => {
        resourceName = name;
        cy.createRancherResource(
          'v1',
          'traefik.io.ingressroutes',
          makeIngressRoute(name, { ingressClassName: 'traefik-v3' })
        );
        removeResource = true;
      });
    });

    beforeEach(() => cy.login());

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('shows ingressClassName in the masthead detail row', () => {
      const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.mastheadIngressClass().should('contain', 'traefik-v3');
    });

    it('shows ingressClassName in the list view Ingress Class column', () => {
      const list = new IngressRouteListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.ingressClassColumnForRow(resourceName).should('contain', 'traefik-v3');
    });
  });

  describe('via legacy annotation (kubernetes.io/ingress.class)', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-ica').then((name) => {
        resourceName = name;
        cy.createRancherResource(
          'v1',
          'traefik.io.ingressroutes',
          makeIngressRoute(name, { ingressClassAnnotation: 'traefik-legacy' })
        );
        removeResource = true;
      });
    });

    beforeEach(() => cy.login());

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('shows annotation-based ingress class in the masthead detail row', () => {
      const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.mastheadIngressClass().should('contain', 'traefik-legacy');
    });

    it('shows annotation-based ingress class in the list view Ingress Class column', () => {
      const list = new IngressRouteListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.ingressClassColumnForRow(resourceName).should('contain', 'traefik-legacy');
    });
  });
});
