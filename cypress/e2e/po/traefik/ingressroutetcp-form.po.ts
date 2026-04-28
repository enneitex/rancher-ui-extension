import PagePo from '@rancher/cypress/e2e/po/pages/page.po';

const CLUSTER = (id: string) => `/c/${ id }/explorer/traefik.io.ingressroutetcp`;

/**
 * Page Object for the IngressRouteTCP create / edit form.
 *
 * Selector notes
 * ──────────────
 * IngressRouteTCP uses a taggable LabeledSelect for entry points (free-form, no dropdown options).
 * Users type a value and press Enter to confirm — unlike IngressRoute which has predefined options.
 *
 * The Routes component is reused (same as IngressRoute) — all route-level selectors are scoped
 * with ".routes-section" to avoid collisions with the outer Tabbed.
 *
 * TLSConfiguration supports passthrough (`:support-passthrough="true"`) so there is an extra
 * "TLS Passthrough" toggle absent from the HTTP IngressRoute form.
 *
 * CruResource uses componentTestid="form" (default) → save button is [data-testid="form-save"].
 */
export default class IngressRouteTCPFormPo extends PagePo {
  constructor(clusterId = 'local') {
    super(`${ CLUSTER(clusterId) }/create`);
  }

  static goToCreate(clusterId = 'local') {
    return PagePo.goTo(`${ CLUSTER(clusterId) }/create`);
  }

  static goToEdit(clusterId = 'local', namespace: string, name: string) {
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

  // ── Entry Points — taggable free-form input ───────────────────────────────────
  // Unlike IngressRoute, IngressRouteTCP entryPoints are typed as tags (no predefined list).

  entryPointsSelect() {
    return cy.contains('.labeled-select label', 'EntryPoints').closest('.labeled-select');
  }

  /** Type a custom entry point name and confirm with Enter. */
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

  /** Remove all currently selected entry points. */
  clearEntryPoints() {
    this.entryPointsSelect().find('.vs__deselect').each(($btn) => cy.wrap($btn).click());
  }

  entryPointTag(value: string) {
    return this.entryPointsSelect().contains('.vs__selected', value);
  }

  // ── Entry Points validation banner ───────────────────────────────────────────

  entryPointsRequiredBanner() {
    return cy.contains('.banner', 'At least one entryPoint must be specified');
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

  matchInput() {
    return cy.get('.routes-section .container-group:visible')
      .contains('.labeled-input label', 'Match Rule')
      .closest('.labeled-input')
      .find('input');
  }

  setServiceName(name: string) {
    this.setServiceNameByIndex(0, name);
  }

  setServicePort(port: string) {
    this.setServicePortByIndex(0, port);
  }

  // ── Remove route ─────────────────────────────────────────────────────────────

  removeRouteButton() {
    return cy.get('.routes-section .container-group:visible [data-testid^="route-remove-"]');
  }

  serviceRows() {
    return cy.get('.routes-section .container-group:visible [data-testid="service-row"]');
  }

  addServiceButton() {
    return cy.get('.routes-section .container-group:visible .services-section')
      .contains('button', 'Add Target Service');
  }

  /**
   * Set the "Target Service" field for the service row at the given zero-based index.
   * Useful when multiple services are added to the same route.
   */
  setServiceNameByIndex(index: number, name: string) {
    this.serviceRows().eq(index)
      .contains('.labeled-select label', 'Target Service')
      .closest('.labeled-select')
      .find('.vs__search')
      .type(name)
      .type('{enter}');
  }

  /**
   * Set the "Port" field for the service row at the given zero-based index.
   */
  setServicePortByIndex(index: number, port: string) {
    this.serviceRows().eq(index)
      .contains('.labeled-select label', 'Port')
      .closest('.labeled-select')
      .find('.vs__search')
      .type(port)
      .type('{enter}');
  }

  /**
   * Returns the "Target Service" LabeledSelect element for the service row at the given
   * zero-based index so callers can assert its status class (e.g. `warning`).
   */
  serviceNameSelectByIndex(index: number) {
    return this.serviceRows().eq(index)
      .contains('.labeled-select label', 'Target Service')
      .closest('.labeled-select');
  }

  servicePortField() {
    return cy.get('.routes-section .container-group:visible')
      .contains('.labeled-select label, .labeled-input label', 'Port');
  }

  // ── Middlewares TCP inside the active route ───────────────────────────────────

  /** Info banner shown when no MiddlewareTCP resources exist in the namespace. */
  middlewareEmptyBanner() {
    return cy.contains('.routes-section .container-group:visible .banner', 'No middleware available in this namespace');
  }

  /** "Add Middleware" button — visible only when MiddlewareTCP resources exist. */
  addMiddlewareButton() {
    return cy.get('.routes-section .container-group:visible .middleware-section')
      .contains('button', 'Add Middleware');
  }

  /** LabeledSelect for a specific middleware row (zero-based). */
  middlewareSelect(rowIndex = 0) {
    return cy.get('.routes-section .container-group:visible .middleware-section')
      .find('.labeled-select')
      .eq(rowIndex);
  }

  /** Click toggle to open dropdown and click the middleware by name. */
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

  /** Close the middleware dropdown after reading its contents. */
  closeMiddlewareOptions(rowIndex = 0) {
    this.middlewareSelect(rowIndex).find('.vs__dropdown-toggle').click();
  }

  // ── TLS tab — passthrough (TCP-specific) ─────────────────────────────────────
  // The TLSConfiguration component with :support-passthrough="true" renders an extra toggle.

  enableTlsPassthrough() {
    cy.contains('.tls-configuration .checkbox-outer-container, .tls-configuration .radio-container', 'Passthrough').click();
  }

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

  tlsPassthroughToggle() {
    return cy.contains('.tls-configuration .checkbox-outer-container, .tls-configuration .radio-container', 'Passthrough');
  }

  tlsVisibleSelects() {
    return cy.get('.tls-configuration .labeled-select:visible');
  }

  // ── IngressClass tab ──────────────────────────────────────────────────────────
  // Tab name="ingress-class" → [data-testid="btn-ingress-class"]
  // Same component as IngressRoute; selectors are identical.

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

  // ── Save / Create ─────────────────────────────────────────────────────────────

  saveButton() {
    return cy.getId('form-save');
  }

  save() {
    this.saveButton().click();
  }
}
