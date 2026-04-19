import IngressRouteTCPDetailPo from '../../po/traefik/ingressroutetcp-detail.po';
import IngressRouteTCPListPo from '../../po/traefik/ingressroutetcp-list.po';
import { makeIngressRouteTCP } from './blueprints/ingressroutes';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

describe('IngressRouteTCP — detail view', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── Basic detail view ─────────────────────────────────────────────────────────

  describe('Basic detail view', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-detail').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(name, { match: 'HostSNI(`detail-tcp.example.com`)' }));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
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
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-passthrough').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(name, { tls: { passthrough: true } }));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
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
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-del').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(name));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('deletes the resource via the list action menu', () => {
      const list = new IngressRouteTCPListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowShouldExist(resourceName);

      list.deleteResourceByName(resourceName);
      removeResource = false;

      list.rowShouldNotExist(resourceName);
    });
  });

  // ── Delete from detail masthead ───────────────────────────────────────────────

  describe('Delete from detail masthead', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-del-detail').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(name));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('deletes via the detail view masthead and redirects to the list', () => {
      const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.deleteFromMasthead();
      detail.confirmDelete();
      removeResource = false;

      const list = new IngressRouteTCPListPo(CLUSTER_ID);
      list.waitForPage();
      list.rowShouldNotExist(resourceName);
    });
  });
});
