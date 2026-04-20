import TLSOptionDetailPo from '../../po/traefik/tlsoption-detail.po';
import TLSOptionListPo from '../../po/traefik/tlsoption-list.po';
import { makeTLSOption } from './blueprints/tlsoptions';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('TLSOption — detail view', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── TLS versions card ─────────────────────────────────────────────────────────

  describe('TLS Versions card', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('tls-detail-ver').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(name, { minVersion: 'VersionTLS12', maxVersion: 'VersionTLS13' }));
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('TLS Versions card shows minVersion and maxVersion', () => {
      const detail = new TLSOptionDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.configurationTab().click();

      detail.tlsVersionsCard().should('be.visible');
      detail.tlsVersionsCard().should('contain', 'TLS 1.2');
      detail.tlsVersionsCard().should('contain', 'TLS 1.3');
    });
  });

  // ── Full configuration cards ──────────────────────────────────────────────────

  describe('Full configuration — all cards present', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('tls-detail-full').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(name, {
          minVersion: 'VersionTLS12',
          maxVersion: 'VersionTLS13',
          cipherSuites: ['TLS_AES_128_GCM_SHA256'],
          clientAuth: {
            clientAuthType: 'RequireAndVerifyClientCert',
            secretNames: ['my-ca-secret'],
          },
          sniStrict: true,
          disableSessionTickets: true,
          alpnProtocols: ['http/1.1', 'h2'],
        }));
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('Cipher Suites card lists all configured suites', () => {
      const detail = new TLSOptionDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.configurationTab().click();

      detail.cipherSuitesCard().should('be.visible');
      detail.cipherSuitesCard().should('contain', 'TLS_AES_128_GCM_SHA256');
    });

    it('Client Authentication card shows auth type', () => {
      const detail = new TLSOptionDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.configurationTab().click();

      detail.clientAuthCard().should('be.visible');
      detail.clientAuthCard().should('contain', 'Require and Verify Client Certificate');
    });

    it('Advanced Options card shows sniStrict and disableSessionTickets state', () => {
      const detail = new TLSOptionDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.configurationTab().click();

      detail.advancedCard().should('be.visible');
      // Both flags are true → "Enabled" text
      detail.advancedCard().should('contain', 'Enabled');
    });
  });

  // ── Minimal spec — cards absent when sections not configured ─────────────────

  describe('Minimal spec — no optional cards', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('tls-detail-min').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(name));
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('no TLS Versions card when minVersion and maxVersion are absent', () => {
      const detail = new TLSOptionDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.configurationTab().click();

      detail.tlsVersionsCardShouldNotExist();
    });

    it('no Cipher Suites card when cipherSuites array is absent', () => {
      const detail = new TLSOptionDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.configurationTab().click();

      detail.cipherSuitesCardShouldNotExist();
    });
  });

  // ── Delete from list ─────────────────────────────────────────────────────────

  describe('Delete from list', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('tls-del').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(name, { minVersion: 'VersionTLS12', maxVersion: 'VersionTLS13' }));
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('deletes the TLSOption via the list action menu', () => {
      const list = new TLSOptionListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowShouldExist(resourceName);

      list.deleteResourceByName(resourceName);

      list.rowShouldNotExist(resourceName);
    });
  });
});
