import PagePo from '@rancher/cypress/e2e/po/pages/page.po';
import PromptRemove from '@rancher/cypress/e2e/po/prompts/promptRemove.po';

const CLUSTER = (id: string) => `/c/${ id }/explorer/traefik.io.ingressroute`;

export default class IngressRouteDetailPo extends PagePo {
  constructor(clusterId = 'local', namespace: string, name: string) {
    super(`${ CLUSTER(clusterId) }/${ namespace }/${ name }`);
  }

  static goToDetail(clusterId = 'local', namespace: string, name: string) {
    return PagePo.goTo(`${ CLUSTER(clusterId) }/${ namespace }/${ name }`);
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────────

  routesTab() {
    return cy.get('[data-testid="btn-routes"]');
  }

  tlsTab() {
    return cy.get('[data-testid="btn-tls"]');
  }

  relatedTab() {
    return cy.get('[data-testid="btn-related"]');
  }

  // ── Masthead ──────────────────────────────────────────────────────────────────
  // Rancher 2.13 masthead: resource name is in span.masthead-resource-title (inside h1).
  // Actions are behind the single [data-testid="masthead-action-menu"] kebab button.
  // There is no standalone Edit button — Edit lives in the action menu.

  mastheadTitle() {
    return cy.get('.masthead-resource-title');
  }

  /** Open the ⋮ kebab menu in the masthead. */
  openActionsMenu() {
    cy.get('[data-testid="masthead-action-menu"]').click();
  }

  /** Click a named item in the masthead action menu. */
  mastheadMenuItem(item: string) {
    this.openActionsMenu();
    cy.contains('[dropdown-menu-item]', item).click();
  }

  editFromMasthead() {
    this.mastheadMenuItem('Edit');
  }

  deleteFromMasthead() {
    this.mastheadMenuItem('Delete');
  }

  // ── Content ───────────────────────────────────────────────────────────────────

  routesTable() {
    return cy.get('.sortable-table');
  }

  /** TLS "not configured" text shown by the read-only TLSConfiguration component. */
  tlsNotConfiguredText() {
    return cy.contains('TLS is not configured for this IngressRoute');
  }

  confirmDelete() {
    new PromptRemove().remove();
  }

  cancelDelete() {
    new PromptRemove().cancel();
  }
}
