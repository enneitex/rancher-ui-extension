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
