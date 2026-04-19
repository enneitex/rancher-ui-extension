import PagePo from '@rancher/cypress/e2e/po/pages/page.po';
import YamlEditorPo from './yaml-editor.po';

const CLUSTER = (id: string) => `/c/${ id }/explorer/traefik.io.middleware`;

/**
 * Page Object for the Middleware create / edit form.
 *
 * Selector notes
 * ──────────────
 * Middleware does NOT have a custom Vue edit form. The extension delegates to Rancher's
 * generic YAML editor (canYaml: true, isEditable: true in product.js). The "Create" button
 * opens the YAML-based create form.
 *
 * The Middleware type selector is a LabeledSelect rendered inside the form that allows the
 * user to choose a middleware type (e.g. "stripPrefix", "basicAuth"). After selection the
 * corresponding sub-form fields appear.
 *
 * CruResource save button: [data-testid="form-save"].
 */
export default class MiddlewareFormPo extends PagePo {
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

  // ── Middleware type selector ──────────────────────────────────────────────────
  // The form renders a "Middleware Type" LabeledSelect that filters available sub-forms.

  middlewareTypeSelect() {
    return cy.contains('.labeled-select label', 'Middleware Type').closest('.labeled-select');
  }

  selectMiddlewareType(type: string) {
    this.middlewareTypeSelect().find('.vs__search').type(type).type('{enter}');
  }

  // ── stripPrefix sub-form ──────────────────────────────────────────────────────
  // After selecting "stripPrefix", an ArrayList for prefixes appears.

  addPrefixButton() {
    return cy.contains('button', 'Add Prefix');
  }

  prefixInput(index = 0) {
    return cy.get('.strip-prefix-section input').eq(index);
  }

  // ── basicAuth sub-form ────────────────────────────────────────────────────────
  // After selecting "basicAuth", a secret name input/select appears.

  basicAuthSecretInput() {
    return cy.contains('.labeled-input label', 'Secret')
      .closest('.labeled-input')
      .find('input');
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  saveButton() {
    return cy.getId('form-save');
  }

  save() {
    this.saveButton().click();
  }

  yamlEditor() {
    return YamlEditorPo.editor();
  }
}
