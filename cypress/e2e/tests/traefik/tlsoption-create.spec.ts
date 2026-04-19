import TLSOptionFormPo from '../../po/traefik/tlsoption-form.po';
import TLSOptionListPo from '../../po/traefik/tlsoption-list.po';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

describe('TLSOption — create form', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── 2.1 TLS Versions tab ──────────────────────────────────────────────────────

  describe('2.1 TLS Versions tab', () => {
    it('form opens with TLS Versions tab active', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.tlsVersionsTab().should('be.visible');
      form.minVersionSelect().should('be.visible');
      form.maxVersionSelect().should('be.visible');
    });

    it('can select minVersion VersionTLS12', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsVersionsTab().click();
      form.selectMinVersion('VersionTLS12');

      form.minVersionSelect().should('contain', 'TLS 1.2');
    });

    it('can select maxVersion VersionTLS13', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsVersionsTab().click();
      form.selectMaxVersion('VersionTLS13');

      form.maxVersionSelect().should('contain', 'TLS 1.3');
    });
  });

  // ── 2.2 Cipher Suites tab ─────────────────────────────────────────────────────

  describe('2.2 Cipher Suites tab', () => {
    it('can navigate to the Cipher Suites tab', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.cipherSuitesTab().click();

      form.addCipherSuiteButton().should('be.visible');
    });

    it('can add a cipher suite string', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.cipherSuitesTab().click();
      form.addCipherSuiteButton().click();

      form.cipherSuiteInput(0).type('TLS_AES_128_GCM_SHA256');
      form.cipherSuiteInput(0).should('have.value', 'TLS_AES_128_GCM_SHA256');
    });

    it('can add multiple cipher suites', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.cipherSuitesTab().click();
      form.addCipherSuiteButton().click();
      form.addCipherSuiteButton().click();

      form.cipherSuiteInputs().should('have.length.gte', 2);
    });

    it('preferServerCipherSuites checkbox is present and toggleable', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.cipherSuitesTab().click();

      form.preferServerCipherSuitesCheckbox().should('be.visible');
      form.preferServerCipherSuitesCheckbox().find('input[type="checkbox"]').click();
      form.preferServerCipherSuitesCheckbox().find('input[type="checkbox"]').should('be.checked');
    });
  });

  // ── 2.3 Client Authentication tab ────────────────────────────────────────────

  describe('2.3 Client Authentication tab', () => {
    it('can navigate to the Client Auth tab', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.clientAuthTab().click();

      form.clientAuthTypeSelect().should('be.visible');
    });

    it('can select a client auth type', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.clientAuthTab().click();
      form.selectClientAuthType('RequireAndVerifyClientCert');

      form.clientAuthTypeSelect().should('contain', 'Require and Verify Client Certificate');
    });
  });

  // ── 2.4 Advanced tab ─────────────────────────────────────────────────────────

  describe('2.4 Advanced tab', () => {
    it('sniStrict checkbox is present and toggleable', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.advancedTab().click();

      form.sniStrictCheckbox().should('be.visible');
      form.sniStrictCheckbox().find('input[type="checkbox"]').click();
      form.sniStrictCheckbox().find('input[type="checkbox"]').should('be.checked');
    });

    it('disableSessionTickets checkbox is present and toggleable', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.advancedTab().click();

      form.disableSessionTicketsCheckbox().should('be.visible');
      form.disableSessionTicketsCheckbox().find('input[type="checkbox"]').click();
      form.disableSessionTicketsCheckbox().find('input[type="checkbox"]').should('be.checked');
    });

    it('ALPN protocols list — can add "http/1.1"', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.advancedTab().click();
      form.addAlpnProtocolButton().click();

      form.alpnProtocolInput(0).type('http/1.1');
      form.alpnProtocolInput(0).should('have.value', 'http/1.1');
    });

    it('Curve Preferences list — can add "CurveP256"', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.advancedTab().click();
      form.addCurvePreferenceButton().click();

      // The curve preferences ArrayList inputs follow after the ALPN ones
      form.curvePreferenceInput(0).type('CurveP256');
      form.curvePreferenceInput(0).should('have.value', 'CurveP256');
    });
  });

  // ── 2.5 Full create flow ──────────────────────────────────────────────────────

  describe('2.5 Full create flow', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('tls-full').then((name) => {
        resourceName = name;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('can create a TLSOption with minVersion + maxVersion and it appears in the list', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.setName(resourceName);

      form.tlsVersionsTab().click();
      form.selectMinVersion('VersionTLS12');
      form.selectMaxVersion('VersionTLS13');

      form.save();

      const list = new TLSOptionListPo(CLUSTER_ID);
      list.waitForPage();
      list.rowShouldExist(resourceName);
      removeResource = true;

      cy.getRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.minVersion).to.eq('VersionTLS12');
        expect(resp.body.spec.maxVersion).to.eq('VersionTLS13');
      });
    });

    it('new resource shows correct column values in the list', () => {
      const list = new TLSOptionListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.findRowByName(resourceName)
        .should('contain', 'VersionTLS12')
        .and('contain', 'VersionTLS13');
    });
  });
});
