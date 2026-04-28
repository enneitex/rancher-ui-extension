import IngressRouteTCPFormPo from '../../po/traefik/ingressroutetcp-form.po';
import IngressRouteTCPListPo from '../../po/traefik/ingressroutetcp-list.po';
import { makeIngressClass } from './blueprints/ingressclasses';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRouteTCP — create form', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── 2.1 Entry Points tab — free-form taggable input ───────────────────────────

  describe('2.1 Entry Points tab — free-form input', () => {
    it('can type a custom entry point name and confirm with Enter', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.entryPointsTab().click();
      form.addEntryPoint('tcpep');

      form.entryPointTag('tcpep').should('be.visible');
    });

    it('can add multiple entry points', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.entryPointsTab().click();
      form.addEntryPoint('tcpep');
      form.addEntryPoint('another-ep');

      form.entryPointTag('tcpep').should('be.visible');
      form.entryPointTag('another-ep').should('be.visible');
    });

    it('can remove an entry point tag', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.entryPointsTab().click();
      form.addEntryPoint('tcpep');
      form.removeEntryPoint('tcpep');

      form.entryPointTag('tcpep').should('not.exist');
    });
  });

  // ── 2.2 Routes tab ────────────────────────────────────────────────────────────

  describe('2.2 Routes tab', () => {
    it('default match rule is HostSNI(`*`)', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();

      form.matchInput().should('have.value', 'HostSNI(`*`)');
    });

    it('can modify the match rule', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();
      form.matchInput().clear().type('HostSNI(`my.host.example.com`)');

      form.matchInput().should('have.value', 'HostSNI(`my.host.example.com`)');
    });

    it('Port field is always visible for TCP services', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();

      form.servicePortField().should('be.visible');
    });

    it('can add multiple services to a route', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();

      // Find the "Add Target Service" button and click it
      form.addServiceButton().click();
      form.serviceRows().should('have.length.gte', 2);
    });
  });

  // ── 2.3 TLS tab — passthrough ─────────────────────────────────────────────────

  describe('2.3 TLS tab — passthrough', () => {
    it('TLS is disabled by default', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsTab().click();

      form.tlsNotConfiguredBanner().should('be.visible');
    });

    it('TLS Passthrough toggle is present (TCP-specific)', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsTab().click();
      form.enableTls();

      form.tlsPassthroughToggle().should('be.visible');
    });

    it('enabling TLS Passthrough keeps TLS configuration available for TCP routes', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsTab().click();
      form.enableTls();
      form.enableTlsPassthrough();

      form.tlsPassthroughToggle().should('be.visible');
      form.tlsVisibleSelects().should('have.length.gte', 1);
    });

    it('enabling TLS (non-passthrough) reveals the secret field', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsTab().click();
      form.enableTls();

      form.tlsSecretSelect().should('be.visible');
    });
  });

  // ── 2.4 IngressClass tab ─────────────────────────────────────────────────────

  describe('2.4 IngressClass tab', () => {
    it('IngressClass tab is present', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.ingressClassTab().should('be.visible');
    });

    it('IngressClass dropdown reflects the cluster state (enabled with classes, disabled without)', () => {
      cy.getRancherResource('v1', 'networking.k8s.io.ingressclasses').then((resp) => {
        const hasClasses = (resp.body?.data?.length ?? 0) > 0;

        const form = new IngressRouteTCPFormPo(CLUSTER_ID);

        form.goTo();
        form.waitForPage();
        form.ingressClassTab().click();

        if (hasClasses) {
          form.ingressClassSelect().should('be.visible');
          form.ingressClassSelect().find('input').should('not.be.disabled');
        } else {
          form.ingressClassWarningBanner().should('be.visible');
          form.ingressClassSelect().find('input').should('be.disabled');
        }
      });
    });

    describe('with a dedicated IngressClass resource', () => {
      let ingressClassName: string;
      let resourceName: string;
      let removeIngressClass = false;
      let removeIngressRouteTCP = false;

      before(() => {
        cy.login();
        cy.createE2EResourceName('irtcp-ic').then((name) => {
          ingressClassName = name;
          cy.createRancherResource('v1', 'networking.k8s.io.ingressclasses', makeIngressClass(ingressClassName));
          removeIngressClass = true;
        });
        cy.createE2EResourceName('irtcp-ic-create').then((name) => {
          resourceName = name;
        });
      });

      after('clean up', () => {
        if (removeIngressRouteTCP) {
          cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
        }
        if (removeIngressClass) {
          cy.deleteRancherResource('v1', 'networking.k8s.io.ingressclasses', ingressClassName, false);
        }
      });

      it('the created IngressClass appears in the dropdown options', () => {
        const form = new IngressRouteTCPFormPo(CLUSTER_ID);

        form.goTo();
        form.waitForPage();
        form.ingressClassTab().click();

        form.ingressClassSelect().find('.vs__dropdown-toggle').click();
        cy.get('.vs__dropdown-menu').should('be.visible').contains('li', ingressClassName).should('be.visible');
        form.ingressClassSelect().find('.vs__dropdown-toggle').click();
      });

      it('selecting an IngressClass and saving persists the annotation in the API', () => {
        const form = new IngressRouteTCPFormPo(CLUSTER_ID);

        form.goTo();
        form.waitForPage();

        form.setName(resourceName);

        form.entryPointsTab().click();
        form.addEntryPoint('tcpep');

        form.routesTab().click();
        form.setServiceName('kubernetes');
        form.setServicePort('443');

        form.ingressClassTab().click();
        form.ingressClassSelect().find('.vs__dropdown-toggle').click();
        cy.get('.vs__dropdown-menu').should('be.visible').contains('li', ingressClassName).click();

        form.save();

        const list = new IngressRouteTCPListPo(CLUSTER_ID);
        list.waitForPage();
        list.rowWithName(resourceName).checkVisible();
        removeIngressRouteTCP = true;

        cy.getRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
          expect(resp.body.metadata.annotations?.['kubernetes.io/ingress.class']).to.eq(ingressClassName);
        });
      });
    });
  });

  // ── 2.5 Full create flow ──────────────────────────────────────────────────────

  describe('2.5 Full create flow', () => {
    let resourceName: string;
    let removeIngressRouteTCP = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-full').then((name) => {
        resourceName = name;
      });
    });

    after('clean up', () => {
      if (removeIngressRouteTCP) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('can create a minimal IngressRouteTCP and it appears in the list', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.setName(resourceName);

      form.entryPointsTab().click();
      form.addEntryPoint('tcpep');

      form.routesTab().click();
      // Default match HostSNI(`*`) is acceptable — just set the service
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      form.save();

      const list = new IngressRouteTCPListPo(CLUSTER_ID);
      list.waitForPage();
      list.rowWithName(resourceName).checkVisible();
      removeIngressRouteTCP = true;

      cy.getRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.entryPoints).to.include('tcpep');
        expect(resp.body.spec.routes[0].match).to.eq('HostSNI(`*`)');
      });
    });
  });

  // ── 2.6 Multi-service create — unknown second service ────────────────────────

  describe('2.6 Multi-service create — first service existing, second service unknown', () => {
    const MATCH = 'HostSNI(`*`)';
    let resourceName: string;
    let removeIngressRouteTCP = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-multi-svc').then((name) => {
        resourceName = name;
      });
    });

    after('clean up', () => {
      if (removeIngressRouteTCP) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('second service row shows warning when the service does not exist in the namespace, then resource is saved', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.setName(resourceName);

      form.entryPointsTab().click();
      form.addEntryPoint('tcpep');

      form.routesTab().click();
      // Default match HostSNI(`*`) is acceptable

      // First service — existing: pick "kubernetes" from the dropdown and port 443 (https)
      form.setServiceNameByIndex(0, 'kubernetes');
      form.setServicePortByIndex(0, '443');

      // Add a second service
      form.addServiceButton().click();
      form.serviceRows().should('have.length', 2);

      // Second service — non-existent: typed manually, does not exist in the namespace
      form.setServiceNameByIndex(1, 'nonexistent-svc');
      form.setServicePortByIndex(1, '9999');

      // The second "Target Service" select must carry the warning status (yellow highlight)
      form.serviceNameSelectByIndex(1).should('have.class', 'warning');

      form.save();

      const list = new IngressRouteTCPListPo(CLUSTER_ID);

      list.waitForPage();
      list.rowWithName(resourceName).checkVisible();
      removeIngressRouteTCP = true;
    });

    it('Routes column shows the match rule and both target services', () => {
      const list = new IngressRouteTCPListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.findRowByName(resourceName).should('contain', MATCH);
      list.findRowByName(resourceName).should('contain', 'kubernetes');
      list.findRowByName(resourceName).should('contain', 'nonexistent-svc');
    });
  });

});
