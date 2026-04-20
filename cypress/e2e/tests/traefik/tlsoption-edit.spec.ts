import TLSOptionFormPo from '../../po/traefik/tlsoption-form.po';
import TLSOptionListPo from '../../po/traefik/tlsoption-list.po';
import { makeTLSOption } from './blueprints/tlsoptions';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('TLSOption — edit form', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── Pre-fill ──────────────────────────────────────────────────────────────────

  describe('Pre-fills existing TLS version values', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('tls-edit-prefill').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(name, { minVersion: 'VersionTLS12', maxVersion: 'VersionTLS13' }));
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('edit form pre-fills existing minVersion', () => {
      TLSOptionFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new TLSOptionFormPo(CLUSTER_ID);
      form.waitForEditPage();
      form.tlsVersionsTab().click();

      form.minVersionSelect().should('contain', 'TLS 1.2');
    });

    it('edit form pre-fills existing maxVersion', () => {
      TLSOptionFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new TLSOptionFormPo(CLUSTER_ID);
      form.waitForEditPage();
      form.tlsVersionsTab().click();

      form.maxVersionSelect().should('contain', 'TLS 1.3');
    });
  });

  // ── Change minVersion ─────────────────────────────────────────────────────────

  describe('Change minVersion', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('tls-edit-min').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(name, { minVersion: 'VersionTLS12', maxVersion: 'VersionTLS13' }));
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('can change minVersion and the change persists', () => {
      TLSOptionFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new TLSOptionFormPo(CLUSTER_ID);
      form.waitForEditPage();
      form.tlsVersionsTab().click();

      form.selectMinVersion('TLS 1.3');

      form.save();

      const list = new TLSOptionListPo(CLUSTER_ID);
      list.waitForPage();

      cy.getRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.minVersion).to.eq('VersionTLS13');
      });
    });

    it('change is reflected in the list column', () => {
      const list = new TLSOptionListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.findRowByName(resourceName).should('contain', 'VersionTLS13');
    });
  });

  // ── Add cipher suite to existing TLSOption ────────────────────────────────────

  describe('Add cipher suite', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('tls-edit-cipher').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(name, { minVersion: 'VersionTLS12', maxVersion: 'VersionTLS13' }));
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('can add a cipher suite and the change persists', () => {
      TLSOptionFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new TLSOptionFormPo(CLUSTER_ID);
      form.waitForEditPage();
      form.cipherSuitesTab().click();
      form.addCipherSuiteButton().click();
      form.cipherSuiteInput(0).type('TLS_AES_128_GCM_SHA256');
      form.save();

      cy.getRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.cipherSuites).to.include('TLS_AES_128_GCM_SHA256');
      });
    });
  });
});
