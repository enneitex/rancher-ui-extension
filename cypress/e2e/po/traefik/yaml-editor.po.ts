export default class YamlEditorPo {
  static editor() {
    return cy.get('[data-testid="yaml-editor-code-mirror"], .CodeMirror, .cm-editor');
  }

  static codeMirror() {
    return cy.get('[data-testid="yaml-editor-code-mirror"], .CodeMirror').first();
  }

  static value() {
    return YamlEditorPo.codeMirror().find('.CodeMirror-code');
  }

  static setValue(value: string) {
    return YamlEditorPo.codeMirror().then(($editor) => {
      const codeMirror = ($editor.get(0) as any).CodeMirror;

      expect(codeMirror, 'CodeMirror instance').to.exist;
      codeMirror.setValue(value);
    });
  }
}
