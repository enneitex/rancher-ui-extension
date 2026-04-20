import TraefikBaseDetailPo from './traefik-base-detail.po';

const CLUSTER = (id: string) => `/c/${ id }/explorer/traefik.io.ingressroute`;

export default class IngressRouteDetailPo extends TraefikBaseDetailPo {
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
  //
  // Rancher's ResourceTabs renders the "Related Resources" tab with two sections:
  //   <h3>Referred To By</h3>   → RelatedResources direction="from"
  //   <h3>Refers To</h3>        → RelatedResources direction="to"
  //
  // Each section contains a ResourceTable whose rows display:
  //   State | Type | Name | Namespace
  //
  // All selectors below are scoped to the visible tab-content panel so they work
  // even when the ResourceTabs component lazy-renders its panels.

  /** Navigate to the Related Resources tab and wait for it to be active. */
  goToRelatedTab() {
    // Wait for the masthead to confirm the detail page is fully mounted
    this.mastheadTitle().should('be.visible');
    this.relatedTab().should('be.visible').click();
    cy.contains('h3', 'Refers To').should('be.visible');
  }

  /**
   * The "Refers To" section heading and its table — resources that the
   * IngressRoute points to (services, middlewares, TLS options, TLS secrets).
   */
  refersToSection() {
    return cy.contains('h3', 'Refers To').parent();
  }

  /**
   * Assert that a row with the given resource name appears in the "Refers To"
   * table.  The name column maps to `metadata.name` extracted from `toId`.
   */
  refersToRowShouldContain(name: string) {
    this.refersToSection()
      .find('table')
      .contains('td', name)
      .should('be.visible');
  }

  /**
   * Assert that NO row with the given name appears in the "Refers To" table.
   */
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
    return cy.contains('TLS is not configured for this IngressRoute');
  }
}
