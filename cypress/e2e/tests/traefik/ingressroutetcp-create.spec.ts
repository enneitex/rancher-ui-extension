import IngressRouteTCPFormPo from '../../po/traefik/ingressroutetcp-form.po';
import IngressRouteTCPListPo from '../../po/traefik/ingressroutetcp-list.po';

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

  // ── 2.4 TLS tab — passthrough ─────────────────────────────────────────────────

  describe('2.4 TLS tab — passthrough', () => {
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

  // ── 2.5 Full create flow ──────────────────────────────────────────────────────

  describe('2.5 Full create flow', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('irtcp-full').then((name) => {
        resourceName = name;
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`, false);
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
      list.rowShouldExist(resourceName);

      cy.getRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.entryPoints).to.include('tcpep');
        expect(resp.body.spec.routes[0].match).to.eq('HostSNI(`*`)');
      });
    });
  });

  // ── 2.6 Validation ───────────────────────────────────────────────────────────

  describe('2.6 Validation', () => {
    it('save button is disabled when no entry point is set and match rule is default', () => {
      const form = new IngressRouteTCPFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      // TCP starts with no entry points by default → add one then remove it
      form.entryPointsTab().click();
      form.addEntryPoint('tcpep');
      form.removeEntryPoint('tcpep');

      form.entryPointsRequiredBanner().should('be.visible');
      form.saveButton().should('be.disabled');
    });
  });
});
