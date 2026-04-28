import IngressRouteTCPFormPo from '../../po/traefik/ingressroutetcp-form.po';
import IngressRouteTCPListPo from '../../po/traefik/ingressroutetcp-list.po';
import { makeIngressRouteTCP } from './blueprints/ingressroutes';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRouteTCP — edit form', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── Edit: pre-fill ────────────────────────────────────────────────────────────

  describe('Pre-fills existing values', () => {
    let resourceName: string;
    let removeIngressRouteTcp = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-edit-prefill').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(name, { match: 'HostSNI(`original.example.com`)' }));
        removeIngressRouteTcp = true;
      });
    });

    after('clean up', () => {
      if (removeIngressRouteTcp) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('edit form pre-fills existing match rule', () => {
      IngressRouteTCPFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteTCPFormPo(CLUSTER_ID);
      form.waitForEditPage();
      form.routesTab().click();

      form.matchInput().should('have.value', 'HostSNI(`original.example.com`)');
    });

    it('edit form pre-fills existing entry points', () => {
      IngressRouteTCPFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteTCPFormPo(CLUSTER_ID);
      form.waitForEditPage();
      form.entryPointsTab().click();

      form.entryPointTag('tcpep').should('be.visible');
    });
  });

  // ── Edit: modify match rule ───────────────────────────────────────────────────

  describe('Modify match rule', () => {
    let resourceName: string;
    let removeIngressRouteTcp = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-edit-match').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(name, { match: 'HostSNI(`before.example.com`)' }));
        removeIngressRouteTcp = true;
      });
    });

    after('clean up', () => {
      if (removeIngressRouteTcp) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('can modify the match rule and change persists', () => {
      IngressRouteTCPFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteTCPFormPo(CLUSTER_ID);
      form.waitForEditPage();
      form.routesTab().click();

      form.matchInput().clear().type('HostSNI(`after.example.com`)');
      form.save();

      cy.getRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.routes[0].match).to.eq('HostSNI(`after.example.com`)');
      });
    });
  });

  // ── Edit: toggle TLS passthrough ──────────────────────────────────────────────

  describe('Toggle TLS passthrough', () => {
    let resourceName: string;
    let removeIngressRouteTcp = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-edit-tls').then((name) => {
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

    it('can enable TLS passthrough and change persists', () => {
      IngressRouteTCPFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteTCPFormPo(CLUSTER_ID);
      form.waitForEditPage();
      form.tlsTab().click();
      form.enableTls();
      form.enableTlsPassthrough();
      form.save();

      const list = new IngressRouteTCPListPo(CLUSTER_ID);
      list.goTo();
      list.waitForPage();

      cy.getRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.tls?.passthrough).to.eq(true);
      });
    });
  });
});
