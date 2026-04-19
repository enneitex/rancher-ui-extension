export default class YamlEditorPo {
  static editor() {
    return cy.get('[data-testid="yaml-editor-input"], .CodeMirror, .cm-editor');
  }
}
