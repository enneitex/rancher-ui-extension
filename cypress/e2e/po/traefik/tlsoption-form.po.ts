import PagePo from '@rancher/cypress/e2e/po/pages/page.po';

const CLUSTER = (id: string) => `/c/${ id }/explorer/traefik.io.tlsoption`;

/**
 * Page Object for the TLSOption create / edit form.
 *
 * Selector notes
 * ──────────────
 * The TLSOption form has 5 tabs (defined by `name` prop on <Tab>):
 *   tls-versions  → [data-testid="btn-tls-versions"]
 *   cipher-suites → [data-testid="btn-cipher-suites"]
 *   client-auth   → [data-testid="btn-client-auth"]
 *   advanced      → [data-testid="btn-advanced"]
 *   labels        → [data-testid="btn-labels"]
 *
 * LabeledSelect components use `.labeled-select` with a `.vs__search` input.
 * ArrayList "add" button text comes from the `add-label` prop.
 * Checkbox components are `.checkbox-outer-container` containing a label.
 */
export default class TLSOptionFormPo extends PagePo {
  constructor(clusterId = 'local') {
    super(`${ CLUSTER(clusterId) }/create`);
  }

  static goToCreate(clusterId = 'local') {
    return PagePo.goTo(`${ CLUSTER(clusterId) }/create`);
  }

  static goToEdit(clusterId = 'local', namespace: string, name: string) {
    return PagePo.goTo(`${ CLUSTER(clusterId) }/${ namespace }/${ name }?mode=edit`);
  }

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

  // ── Tabs ─────────────────────────────────────────────────────────────────────

  tlsVersionsTab() {
    return cy.getId('btn-tls-versions');
  }

  cipherSuitesTab() {
    return cy.getId('btn-cipher-suites');
  }

  clientAuthTab() {
    return cy.getId('btn-client-auth');
  }

  advancedTab() {
    return cy.getId('btn-advanced');
  }

  // ── TLS Versions tab ─────────────────────────────────────────────────────────

  minVersionSelect() {
    return cy.contains('.labeled-select label', 'Minimum TLS Version').closest('.labeled-select');
  }

  maxVersionSelect() {
    return cy.contains('.labeled-select label', 'Maximum TLS Version').closest('.labeled-select');
  }

  selectMinVersion(label: string) {
    this.minVersionSelect().find('.vs__dropdown-toggle').click();
    cy.get('.vs__dropdown-menu').should('be.visible').contains('li', label).click();
  }

  selectMaxVersion(label: string) {
    this.maxVersionSelect().find('.vs__dropdown-toggle').click();
    cy.get('.vs__dropdown-menu').should('be.visible').contains('li', label).click();
  }

  // ── Cipher Suites tab ─────────────────────────────────────────────────────────

  /** Click the "Add Cipher Suite" button (add-label on the ArrayList). */
  addCipherSuiteButton() {
    return cy.contains('.cipher-suites-card button', 'Add Cipher Suite');
  }

  /** Get a specific cipher suite input row by zero-based index. */
  cipherSuiteInput(index = 0) {
    return cy.get('.cipher-suites-card .box input').eq(index);
  }

  cipherSuiteInputs() {
    return cy.getId('cipher-suites-card').find('.box input');
  }

  preferServerCipherSuitesCheckbox() {
    return cy.contains('.cipher-suites-card .checkbox-outer-container', 'Prefer Server Cipher Suites');
  }

  // ── Client Auth tab ───────────────────────────────────────────────────────────

  clientAuthTypeSelect() {
    return cy.contains('.client-auth-card .labeled-select label', 'Authentication Type')
      .closest('.labeled-select');
  }

  selectClientAuthType(label: string) {
    this.clientAuthTypeSelect().find('.vs__dropdown-toggle').click();
    cy.get('.vs__dropdown-menu').should('be.visible').contains('li', label).click();
  }

  /**
   * Returns the ArrayListSelect used for client auth secret names.
   * The component renders each selected secret as a LabeledSelect inside .client-auth-card.
   */
  clientAuthSecretsSection() {
    return cy.get('.client-auth-card');
  }

  /** Click the "Add Secret" button to add a new secret row. */
  addClientAuthSecretButton() {
    return cy.get('.client-auth-card').contains('button', 'Add Secret');
  }

  /**
   * Returns the LabeledSelect for a specific secret row (zero-based).
   * Each row is a LabeledSelect rendered by ArrayListSelect.
   */
  clientAuthSecretSelect(rowIndex = 0) {
    // ArrayListSelect container is .array-list-select; each row is .unlabeled-select
    return cy.get('.client-auth-card .array-list-select .unlabeled-select').eq(rowIndex);
  }

  /** Select a CA secret by name in the given row. */
  selectClientAuthSecret(name: string, rowIndex = 0) {
    this.clientAuthSecretSelect(rowIndex)
      .find('.vs__search')
      .type(name)
      .type('{enter}');
  }

  /** Assert that a secret option appears in the dropdown before selecting. */
  clientAuthSecretOptionShouldExist(name: string, rowIndex = 0) {
    this.clientAuthSecretSelect(rowIndex).find('.vs__search').type(name);
    cy.get('.vs__dropdown-menu').contains('li', name).should('be.visible');
    this.clientAuthSecretSelect(rowIndex).find('.vs__search').type('{esc}');
  }

  // ── Advanced tab ──────────────────────────────────────────────────────────────

  sniStrictCheckbox() {
    return cy.contains('.advanced-options-card .checkbox-outer-container', 'SNI Strict');
  }

  disableSessionTicketsCheckbox() {
    return cy.contains('.advanced-options-card .checkbox-outer-container', 'Disable Session Tickets');
  }

  addAlpnProtocolButton() {
    return cy.contains('.advanced-options-card button', 'Add Protocol');
  }

  alpnProtocolInput(index = 0) {
    return cy.get('.advanced-options-card .box input').eq(index);
  }

  addCurvePreferenceButton() {
    return cy.contains('.advanced-options-card button', 'Add Curve');
  }

  curvePreferenceInput(index = 0) {
    return cy.getId('curve-preferences-section').find('.box input').eq(index);
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  saveButton() {
    return cy.getId('form-save');
  }

  save() {
    this.saveButton().click();
  }
}
