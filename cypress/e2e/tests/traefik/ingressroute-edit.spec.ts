import IngressRouteFormPo from '../../po/traefik/ingressroute-form.po';
import IngressRouteListPo from '../../po/traefik/ingressroute-list.po';
import { makeIngressRoute } from './blueprints/ingressroutes';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRoute — edit form', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── 3.1 Pre-fill all existing values ─────────────────────────────────────────

  describe('pre-fills existing values', () => {
    let resourceName: string;
    let removeIngressRoute = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-prefill').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes',
          makeIngressRoute(name, { entryPoints: ['web', 'websecure'], match: 'Host(`prefill.example.com`)' }));
        removeIngressRoute = true;
      });
    });

    after('clean up', () => {
      if (removeIngressRoute) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('edit form pre-fills entry points', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.waitForEditPage();
      form.entryPointsTab().click();
      form.entryPointsSelect().contains('.vs__selected', 'web').should('be.visible');
      form.entryPointsSelect().contains('.vs__selected', 'websecure').should('be.visible');
    });

    it('edit form pre-fills the match rule and service name', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.waitForEditPage();
      form.routesTab().click();
      form.matchInput().should('have.value', 'Host(`prefill.example.com`)');
      form.serviceRows().first().contains('.vs__selected', 'kubernetes').should('be.visible');
    });
  });

  // ── 3.2 Change service name ───────────────────────────────────────────────────

  describe('change service name', () => {
    let resourceName: string;
    let removeIngressRoute = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-svc').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes',
          makeIngressRoute(name, { serviceName: 'kubernetes' }));
        removeIngressRoute = true;
      });
    });

    after('clean up', () => {
      if (removeIngressRoute) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('can change the service name in an existing route and the change persists', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.waitForEditPage();
      form.routesTab().click();

      form.replaceServiceName('kubernetes-updated');

      form.save();

      // Verify change persisted via the API
      cy.getRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.routes[0].services[0].name).to.eq('kubernetes-updated');
      });
    });
  });

  // ── 3.3 Enable TLS ────────────────────────────────────────────────────────────

  describe('enable TLS on an existing IngressRoute', () => {
    let resourceName: string;
    let removeIngressRoute = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-tls-enable').then((name) => {
        resourceName = name;
        // Create without TLS
        cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(name));
        removeIngressRoute = true;
      });
    });

    after('clean up', () => {
      if (removeIngressRoute) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('can enable TLS with a certificate resolver and save', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.waitForEditPage();
      form.tlsTab().click();
      form.enableTls();
      form.setCertResolver('letsencrypt');
      form.save();

      cy.getRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.tls).to.exist;
        expect(resp.body.spec.tls.certResolver).to.eq('letsencrypt');
      });
    });
  });

  // ── 3.4 Changes persist after navigation ─────────────────────────────────────

  describe('changes persist after navigation away and back', () => {
    let resourceName: string;
    let removeIngressRoute = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-persist').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes',
          makeIngressRoute(name, { match: 'Host(`original.example.com`)' }));
        removeIngressRoute = true;
      });
    });

    after('clean up', () => {
      if (removeIngressRoute) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('updated match rule is still present when returning to the edit form', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);
      form.waitForEditPage();
      form.routesTab().click();
      form.matchInput().clear().type('Host(`updated-persist.example.com`)');
      form.save();

      // Navigate away to the list
      const list = new IngressRouteListPo(CLUSTER_ID);

      list.waitForPage();

      // Navigate back to the edit form
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);
      form.waitForEditPage();
      form.routesTab().click();
      form.matchInput().should('have.value', 'Host(`updated-persist.example.com`)');
    });
  });

});
