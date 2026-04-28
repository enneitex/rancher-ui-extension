import TLSOptionListPo from '../../po/traefik/tlsoption-list.po';
import TLSOptionDetailPo from '../../po/traefik/tlsoption-detail.po';
import { makeTLSOption } from './blueprints/tlsoptions';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('TLSOption — navigation', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {
  let resourceName: string;
  let removeTlsOption = false;

  before(() => {
    cy.login();
    cy.createE2EResourceName('tls-nav').then((name) => {
      resourceName = name;
      cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(name, { minVersion: 'VersionTLS12', maxVersion: 'VersionTLS13' }));
      removeTlsOption = true;
    });
  });

  beforeEach(() => {
    cy.login();
  });

  after('clean up', () => {
    if (removeTlsOption) {
      cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ resourceName }`, false);
    }
  });

  it('list page is reachable at /c/local/explorer/traefik.io.tlsoption', () => {
    const list = new TLSOptionListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
  });

  it('masthead Create button is present', () => {
    const list = new TLSOptionListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.masthead().createButton().should('be.visible');
  });

  it('TLSOption item is visible in the Traefik side-nav group', () => {
    const list = new TLSOptionListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.sideNavLink('TLSOption').should('be.visible');
  });

  it('resource created via API appears in the list', () => {
    const list = new TLSOptionListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.rowWithName(resourceName).checkVisible();
  });

  it('MinVersion column shows the correct value', () => {
    const list = new TLSOptionListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.findRowByName(resourceName).should('contain', 'VersionTLS12');
  });

  it('MaxVersion column shows the correct value', () => {
    const list = new TLSOptionListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.findRowByName(resourceName).should('contain', 'VersionTLS13');
  });

  describe('CipherSuites column — CompactList badge', () => {
    // CompactList renders the first item + "+N more" badge when multiple suites are set.
    // This is extension-owned rendering logic (CompactList.vue).
    let cipherResourceName: string;
    let removeCipherResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('tls-nav-cipher').then((name) => {
        cipherResourceName = name;
        cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(name, {
          cipherSuites: [
            'TLS_AES_128_GCM_SHA256',
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256',
          ],
        }));
        removeCipherResource = true;
      });
    });

    after('clean up', () => {
      if (removeCipherResource) {
        cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ cipherResourceName }`, false);
      }
    });

    it('CipherSuites column shows first suite and a "+N more" badge when multiple suites configured', () => {
      const list = new TLSOptionListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();

      // First item rendered by CompactList
      list.findRowByName(cipherResourceName).should('contain', 'TLS_AES_128_GCM_SHA256');

      // "+2 more" badge for the remaining 2 suites
      list.findRowByName(cipherResourceName).find('.plus-more').should('be.visible');
    });
  });

  it('row action menu contains Edit Config, Clone, Download YAML and Delete', () => {
    const list = new TLSOptionListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.rowWithName(resourceName).checkVisible();

    list.list().actionMenu(resourceName).menuItemNames().then((names) => {
      expect(names).to.include('Edit Config');
      expect(names).to.include('Clone');
      expect(names).to.include('Download YAML');
      expect(names).to.include('Delete');
    });
  });

  it('clicking the resource name navigates to the detail view', () => {
    const list = new TLSOptionListPo(CLUSTER_ID);

    list.goTo();
    list.waitForPage();
    list.clickResourceName(resourceName);

    list.shouldBeOnDetailPage(NAMESPACE, resourceName);
  });

  it('detail view shows the resource name in the masthead', () => {
    const detail = new TLSOptionDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

    detail.goTo();
    detail.waitForPage();
    detail.mastheadTitle().should('contain', resourceName);
  });
});
