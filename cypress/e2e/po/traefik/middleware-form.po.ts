import PagePo from '@rancher/cypress/e2e/po/pages/page.po';
import YamlEditorPo from './yaml-editor.po';

const CLUSTER = (id: string) => `/c/${ id }/explorer/traefik.io.middleware`;

/**
 * Page Object for the Middleware create / edit form.
 *
 * Selector notes
 * ──────────────
 * Middleware does NOT have a custom Vue edit form. The extension delegates to Rancher's
 * generic YAML editor (canYaml: true, isEditable: true in product.js) for both create and edit.
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

  setYaml(value: string) {
    YamlEditorPo.setValue(value);
  }
}
