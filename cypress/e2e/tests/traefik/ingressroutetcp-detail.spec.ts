import IngressRouteTCPDetailPo from '../../po/traefik/ingressroutetcp-detail.po';
import IngressRouteTCPListPo from '../../po/traefik/ingressroutetcp-list.po';
import { makeIngressRouteTCP } from './blueprints/ingressroutes';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRouteTCP — detail view', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── Basic detail view ─────────────────────────────────────────────────────────

  describe('Basic detail view', () => {
    let resourceName: string;
    let removeIngressRouteTcp = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-detail').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(name, { match: 'HostSNI(`detail-tcp.example.com`)' }));
        removeIngressRouteTcp = true;
      });
    });

    after('clean up', () => {
      if (removeIngressRouteTcp) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('detail view shows the resource name in the masthead', () => {
      const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.mastheadTitle().should('contain', resourceName);
    });

    it('Routes tab shows TCP match rule and service', () => {
      const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.routesTab().click();
      detail.routesTable().should('contain', 'detail-tcp.example.com');
      detail.routesTable().should('contain', 'kubernetes');
    });

    it('TLS tab shows "not configured" message when TLS is absent', () => {
      const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.tlsTab().click();
      detail.tlsNotConfiguredText().should('be.visible');
    });

    it('Edit action in the masthead menu navigates to the edit form', () => {
      const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.editFromMasthead();

      detail.shouldBeOnEditPage();
    });
  });

  // ── Passthrough detail view ───────────────────────────────────────────────────

  describe('TLS passthrough detail view', () => {
    let resourceName: string;
    let removeIngressRouteTcp = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-passthrough').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(name, { tls: { passthrough: true } }));
        removeIngressRouteTcp = true;
      });
    });

    after('clean up', () => {
      if (removeIngressRouteTcp) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('TLS tab shows passthrough banner when passthrough is enabled', () => {
      const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.tlsTab().click();
      detail.tlsPassthroughBanner().should('be.visible');
    });
  });

  // ── Delete from list ─────────────────────────────────────────────────────────

  describe('Delete from list', () => {
    let resourceName: string;
    let removeIngressRouteTcp = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-del').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(name));
        removeIngressRouteTcp = true;
      });
    });

    after('clean up', () => {
      if (removeIngressRouteTcp) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('deletes the resource via the list action menu', () => {
      const list = new IngressRouteTCPListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowWithName(resourceName).checkVisible();

      list.deleteResourceByName(resourceName);

      list.rowElementWithName(resourceName).should('not.exist');
      removeIngressRouteTcp = false;
    });
  });

  // ── Delete from detail masthead ───────────────────────────────────────────────

  describe('Delete from detail masthead', () => {
    let resourceName: string;
    let removeIngressRouteTcp = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-del-detail').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(name));
        removeIngressRouteTcp = true;
      });
    });

    after('clean up', () => {
      if (removeIngressRouteTcp) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('deletes via the detail view masthead and redirects to the list', () => {
      const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.deleteFromMasthead();
      detail.confirmDelete();

      const list = new IngressRouteTCPListPo(CLUSTER_ID);
      list.waitForPage();
      list.rowElementWithName(resourceName).should('not.exist');
      removeIngressRouteTcp = false;
    });
  });
});

// ── Ingress Class display (masthead + list column) ────────────────────────────

describe('IngressRouteTCP — ingressClass display', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  describe('via spec.ingressClassName (Traefik v3+)', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-icn').then((name) => {
        resourceName = name;
        cy.createRancherResource(
          'v1',
          'traefik.io.ingressroutetcps',
          makeIngressRouteTCP(name, { ingressClassName: 'traefik-v3' })
        );
        removeResource = true;
      });
    });

    beforeEach(() => cy.login());

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('shows ingressClassName in the masthead detail row', () => {
      const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.mastheadIngressClass().should('contain', 'traefik-v3');
    });

    it('shows ingressClassName in the list view Ingress Class column', () => {
      const list = new IngressRouteTCPListPo(CLUSTER_ID);

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
      cy.createE2EResourceName('irtcp-ica').then((name) => {
        resourceName = name;
        cy.createRancherResource(
          'v1',
          'traefik.io.ingressroutetcps',
          makeIngressRouteTCP(name, { ingressClassAnnotation: 'traefik-legacy' })
        );
        removeResource = true;
      });
    });

    beforeEach(() => cy.login());

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('shows annotation-based ingress class in the masthead detail row', () => {
      const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.mastheadIngressClass().should('contain', 'traefik-legacy');
    });

    it('shows annotation-based ingress class in the list view Ingress Class column', () => {
      const list = new IngressRouteTCPListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.ingressClassColumnForRow(resourceName).should('contain', 'traefik-legacy');
    });
  });
});
