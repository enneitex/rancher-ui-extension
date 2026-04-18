import PagePo from '@rancher/cypress/e2e/po/pages/page.po';

const CLUSTER = (id: string) => `/c/${ id }/explorer/traefik.io.ingressroute`;

/**
 * Page Object for the IngressRoute create / edit form.
 *
 * Selector notes
 * ──────────────
 * Rancher shell Tabbed component generates:
 *   [data-testid="btn-{name}"]       → tab button
 *   [data-testid="tab-list-add"]     → add-tab button (show-tabs-add-remove)
 *   [data-testid="tab-list-remove"]  → remove-tab button
 *
 * The Routes component nests its own Tabbed inside .routes-section, so
 * route-level selectors are scoped with ".routes-section" to avoid collisions.
 *
 * CruResource uses componentTestid="form" (default) → save button is [data-testid="form-save"].
 */
export default class IngressRouteFormPo extends PagePo {
  constructor(clusterId = 'local') {
    super(`${ CLUSTER(clusterId) }/create`);
  }

  static goToCreate(clusterId = 'local') {
    return PagePo.goTo(`${ CLUSTER(clusterId) }/create`);
  }

  static goToEdit(clusterId = 'local', namespace: string, name: string) {
    // Rancher appends ?mode=edit to the detail URL to render the edit form
    return PagePo.goTo(`${ CLUSTER(clusterId) }/${ namespace }/${ name }?mode=edit`);
  }

  /** Wait until the edit form is ready (save button visible, correct URL). */
  waitForEditPage() {
    cy.url().should('include', 'mode=edit');
    this.saveButton().should('be.visible');
  }

  // ── Name ────────────────────────────────────────────────────────────────────

  nameInput() {
    return cy.get('[data-testid="NameNsDescriptionNameInput"]');
  }

  setName(name: string) {
    this.nameInput().clear().type(name);
  }

  // ── Main form tabs ───────────────────────────────────────────────────────────

  entryPointsTab() {
    return cy.get('[data-testid="btn-entrypoints"]');
  }

  routesTab() {
    return cy.get('[data-testid="btn-routes"]');
  }

  tlsTab() {
    return cy.get('[data-testid="btn-tls"]');
  }

  // ── Entry Points ─────────────────────────────────────────────────────────────
  // Label text: "EntryPoints" (traefik.ingressRoute.entryPoints.label)

  private entryPointsSelect() {
    return cy.contains('.labeled-select label', 'EntryPoints').closest('.labeled-select');
  }

  /** Remove all currently selected entry points (click every × button). */
  clearEntryPoints() {
    this.entryPointsSelect().find('.vs__deselect').each(($btn) => cy.wrap($btn).click());
  }

  /** Type a value and confirm with Enter (works for both listed options and free tags). */
  addEntryPoint(value: string) {
    this.entryPointsSelect().find('.vs__search').type(value).type('{enter}');
  }

  /** Click the × next to a specific selected entry point tag. */
  removeEntryPoint(value: string) {
    this.entryPointsSelect()
      .contains('.vs__selected', value)
      .find('.vs__deselect')
      .click();
  }

  // ── Routes — route tabs ───────────────────────────────────────────────────────

  /** Click the "+" button to add a new route tab. */
  addRoute() {
    cy.get('.routes-section [data-testid="tab-list-add"]').click();
  }

  /** Click a route tab by zero-based index. */
  routeTab(index: number) {
    return cy.get(`.routes-section [data-testid="btn-route-${ index }"]`);
  }

  // ── Routes — fields inside the active route ────────────────────────────────
  // Label text from l10n:
  //   match   → "Match Rule"   (traefik.ingressRoute.routes.match.label)
  //   service → "Target Service" (traefik.ingressRoute.routes.service.label)
  //   port    → "Port"         (traefik.ingressRoute.routes.port.label)

  matchInput() {
    // Multiple "Match Rule" inputs exist (one per route) but only the active panel is visible.
    // Scope to .container-group:visible to target only the active route's input.
    return cy.get('.routes-section .container-group:visible')
      .contains('.labeled-input label', 'Match Rule')
      .closest('.labeled-input')
      .find('input');
  }

  private serviceNameSelect() {
    return cy.get('.routes-section .container-group:visible')
      .contains('.labeled-select label', 'Target Service')
      .closest('.labeled-select');
  }

  private servicePortSelect() {
    return cy.get('.routes-section .container-group:visible')
      .contains('.labeled-select label', 'Port')
      .closest('.labeled-select');
  }

  setServiceName(name: string) {
    this.serviceNameSelect().find('.vs__search').type(name).type('{enter}');
  }

  setServicePort(port: string) {
    this.servicePortSelect().find('.vs__search').type(port).type('{enter}');
  }

  // ── Remove route ─────────────────────────────────────────────────────────────
  // Route.vue renders a "Remove" button in .route-header when canRemove=true.

  removeRouteButton() {
    return cy.get('.routes-section .container-group:visible .route-header button').contains('Remove');
  }

  // ── Services inside the active route ─────────────────────────────────────────
  // Add-label = `${t('generic.add')} ${t('traefik.ingressRoute.routes.service.label')}`
  //           = "Add Target Service"

  addServiceButton() {
    return cy.get('.routes-section .container-group:visible .services-section')
      .contains('button', 'Add Target Service');
  }

  // ── TLS tab ───────────────────────────────────────────────────────────────────
  // TLSConfiguration component wraps everything in .tls-configuration.
  // RadioGroup name="tls-mode", labels ["Disabled", "Enabled"].

  enableTls() {
    cy.contains('.tls-configuration .radio-container', 'Enabled').click();
  }

  disableTls() {
    cy.contains('.tls-configuration .radio-container', 'Disabled').click();
  }

  tlsNotConfiguredBanner() {
    return cy.contains('.tls-configuration .banner', 'TLS is not configured');
  }

  tlsSecretSelect() {
    return cy.contains('.tls-configuration .labeled-select label', 'TLS Secret Name')
      .closest('.labeled-select');
  }

  setCertResolver(value: string) {
    cy.contains('.tls-configuration .labeled-input label', 'Certificate Resolver')
      .closest('.labeled-input')
      .find('input')
      .clear()
      .type(value);
  }

  addTlsDomain() {
    cy.contains('.domains-section button', 'Add Domain').click();
  }

  tlsDomainMainInput() {
    return cy.contains('.labeled-input label', 'Main Domain')
      .closest('.labeled-input')
      .find('input');
  }

  // ── IngressClass tab ──────────────────────────────────────────────────────────
  // Tab name="ingress-class" → [data-testid="btn-ingress-class"]

  ingressClassTab() {
    return cy.get('[data-testid="btn-ingress-class"]');
  }

  ingressClassSelect() {
    return cy.contains('.ingress-class-tab .labeled-select label', 'Ingress Class')
      .closest('.labeled-select');
  }

  // ── Validation banners ────────────────────────────────────────────────────────

  entryPointsRequiredBanner() {
    return cy.contains('.banner', 'At least one entry point must be specified');
  }

  // ── Save / Create ─────────────────────────────────────────────────────────────

  saveButton() {
    return cy.get('[data-testid="form-save"]');
  }

  save() {
    this.saveButton().click();
  }
}
