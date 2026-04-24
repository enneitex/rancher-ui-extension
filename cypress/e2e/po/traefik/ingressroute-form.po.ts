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
    return cy.getId('NameNsDescriptionNameInput');
  }

  setName(name: string) {
    this.nameInput().clear().type(name);
  }

  // ── Main form tabs ───────────────────────────────────────────────────────────

  entryPointsTab() {
    return cy.getId('btn-entrypoints');
  }

  routesTab() {
    return cy.getId('btn-routes');
  }

  tlsTab() {
    return cy.getId('btn-tls');
  }

  labelsAndAnnotationsTab() {
    return cy.getId('btn-labels-and-annotations');
  }

  // ── Entry Points ─────────────────────────────────────────────────────────────
  // Label text: "EntryPoints" (traefik.ingressRoute.entryPoints.label)

  entryPointsSelect() {
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

  /** Clear the current service selection and type a new one. */
  replaceServiceName(name: string) {
    this.serviceNameSelect()
      .find('.vs__search')
      .type('{backspace}')
      .type(name)
      .type('{enter}');
  }

  setServicePort(port: string) {
    this.servicePortSelect().find('.vs__search').type(port).type('{enter}');
  }

  // ── Remove route ─────────────────────────────────────────────────────────────
  // Route.vue renders a "Remove" button in .route-header when canRemove=true.

  removeRouteButton() {
    return cy.get('.routes-section .container-group:visible [data-testid^="route-remove-"]');
  }

  // ── Services inside the active route ─────────────────────────────────────────
  // Add-label = `${t('generic.add')} ${t('traefik.ingressRoute.routes.service.label')}`
  //           = "Add Target Service"

  addServiceButton() {
    return cy.get('.routes-section .container-group:visible .services-section')
      .contains('button', 'Add Target Service');
  }

  serviceRows() {
    return cy.get('.routes-section .container-group:visible [data-testid="service-row"]');
  }

  activeRouteHeader() {
    return cy.get('.routes-section .container-group:visible [data-testid^="route-header-"]');
  }

  middlewareEmptyBanner() {
    return cy.contains('.routes-section .container-group:visible .banner', 'No middleware available in this namespace');
  }

  /** Click "Add Middleware" button inside the active route (only visible when middlewares exist). */
  addMiddlewareButton() {
    return cy.get('.routes-section .container-group:visible .middleware-section')
      .contains('button', 'Add Middleware');
  }

  /**
   * Select a middleware by name in the given middleware row (zero-based index).
   * Requires that at least one middleware exists in the namespace so the select is rendered.
   */
  middlewareSelect(rowIndex = 0) {
    return cy.get('.routes-section .container-group:visible .middleware-section')
      .find('.labeled-select')
      .eq(rowIndex);
  }

  selectMiddleware(name: string, rowIndex = 0) {
    this.middlewareSelect(rowIndex).find('.vs__dropdown-toggle').click();
    cy.get('.vs__dropdown-menu').should('be.visible').contains('li', name).click();
  }

  middlewareOptions() {
    return cy.get('.vs__dropdown-menu');
  }

  openMiddlewareOptions(rowIndex = 0) {
    this.middlewareSelect(rowIndex).find('.vs__dropdown-toggle').click();
    return this.middlewareOptions().should('be.visible');
  }

  /** Close the currently open middleware dropdown for the provided row. */
  closeMiddlewareOptions(rowIndex = 0) {
    this.middlewareSelect(rowIndex).find('.vs__dropdown-toggle').click();
  }

  /** Open the TLS Options dropdown so the spec can assert on the available entries. */
  openTlsOptions() {
    this.tlsOptionsSelect().find('.vs__dropdown-toggle').click();
    return cy.get('.vs__dropdown-menu').should('be.visible');
  }

  /** Close the TLS Options dropdown after reading its contents. */
  closeTlsOptions() {
    this.tlsOptionsSelect().find('.vs__dropdown-toggle').click();
  }

  /** Open the TLS Secret dropdown so the spec can assert on the available entries. */
  openTlsSecrets() {
    this.tlsSecretSelect().find('.vs__dropdown-toggle').click();
    return cy.get('.vs__dropdown-menu').should('be.visible');
  }

  /** Close the TLS Secret dropdown after reading its contents. */
  closeTlsSecrets() {
    this.tlsSecretSelect().find('.vs__dropdown-toggle').click();
  }

  /** Select a TLS option by name. */
  selectTlsOption(name: string) {
    this.tlsOptionsSelect().find('.vs__dropdown-toggle').click();
    cy.get('.vs__dropdown-menu').should('be.visible').contains('li', name).click();
  }

  /** Select a TLS secret by name. */
  selectTlsSecret(name: string) {
    this.tlsSecretSelect().find('.vs__dropdown-toggle').click();
    cy.get('.vs__dropdown-menu').should('be.visible').contains('li', name).click();
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
    return cy.getId('tls-secret-field')
      .contains('.labeled-select label', 'TLS Secret Name')
      .closest('.labeled-select');
  }

  tlsOptionsSelect() {
    return cy.getId('tls-options-field')
      .contains('.labeled-select label', 'TLS Options')
      .closest('.labeled-select');
  }

  setCertResolver(value: string) {
    cy.getId('tls-cert-resolver-field')
      .contains('.labeled-input label', 'Certificate Resolver')
      .closest('.labeled-input')
      .find('input')
      .clear()
      .type(value);
  }

  certResolverInput() {
    return cy.getId('tls-cert-resolver-field')
      .contains('.labeled-input label', 'Certificate Resolver')
      .closest('.labeled-input')
      .find('input');
  }

  addTlsDomain() {
    cy.getId('tls-domains-section').contains('button', 'Add Domain').click();
  }

  tlsDomainMainInput() {
    return cy.getId('tls-domains-list')
      .contains('.labeled-input label', 'Main Domain')
      .closest('.labeled-input')
      .find('input');
  }

  tlsDomainSansInput() {
    return cy.getId('tls-domains-list')
      .contains('.labeled-input label', 'Subject Alternative Names')
      .closest('.labeled-input')
      .find('input');
  }

  // ── IngressClass tab ──────────────────────────────────────────────────────────
  // Tab name="ingress-class" → [data-testid="btn-ingress-class"]

  ingressClassTab() {
    return cy.getId('btn-ingress-class');
  }

  ingressClassSelect() {
    return cy.contains('.ingress-class-tab .labeled-select label', 'Ingress Class')
      .closest('.labeled-select');
  }

  ingressClassWarningBanner() {
    return cy.getId('ingress-class-warning');
  }

  // ── Validation banners ────────────────────────────────────────────────────────

  entryPointsRequiredBanner() {
    return cy.contains('.banner', 'At least one entry point must be specified');
  }

  // ── Save / Create ─────────────────────────────────────────────────────────────

  saveButton() {
    return cy.getId('form-save');
  }

  save() {
    this.saveButton().click();
  }
}
