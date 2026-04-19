import TraefikBaseDetailPo from './traefik-base-detail.po';

const CLUSTER = (id: string) => `/c/${ id }/explorer/traefik.io.ingressroutetcp`;

export default class IngressRouteTCPDetailPo extends TraefikBaseDetailPo {
  constructor(clusterId = 'local', namespace: string, name: string) {
    super(`${ CLUSTER(clusterId) }/${ namespace }/${ name }`);
  }

  static goToDetail(clusterId = 'local', namespace: string, name: string) {
    return TraefikBaseDetailPo.goTo(`${ CLUSTER(clusterId) }/${ namespace }/${ name }`);
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────────

  routesTab() {
    return cy.getId('btn-routes');
  }

  tlsTab() {
    return cy.getId('btn-tls');
  }

  relatedTab() {
    return cy.getId('btn-related');
  }

  // ── Related Resources tab ─────────────────────────────────────────────────────

  /** Navigate to the Related Resources tab and wait for it to be active. */
  goToRelatedTab() {
    this.relatedTab().click();
    cy.contains('h3', 'Refers To').should('be.visible');
  }

  /**
   * The "Refers To" section — resources that the IngressRouteTCP points to
   * (services, MiddlewareTCP resources, TLS options, TLS secrets).
   */
  refersToSection() {
    return cy.contains('h3', 'Refers To').parent();
  }

  /** Assert that a row with the given resource name appears in the "Refers To" table. */
  refersToRowShouldContain(name: string) {
    this.refersToSection()
      .find('table')
      .contains('td', name)
      .should('be.visible');
  }

  /** Assert that NO row with the given name appears in the "Refers To" table. */
  refersToRowShouldNotContain(name: string) {
    this.refersToSection()
      .find('table')
      .contains('td', name)
      .should('not.exist');
  }

  // ── Content ───────────────────────────────────────────────────────────────────

  routesTable() {
    return cy.get('.sortable-table');
  }

  /** TLS "not configured" text shown by the read-only TLSConfiguration component. */
  tlsNotConfiguredText() {
    return cy.contains('TLS is not configured');
  }

  /** Banner shown when TLS passthrough is enabled. */
  tlsPassthroughBanner() {
    return cy.contains('.banner', 'TLS Passthrough is enabled');
  }
}
