import TraefikBaseListPo from './traefik-base-list.po';
import YamlEditorPo from './yaml-editor.po';

export default class MiddlewareListPo extends TraefikBaseListPo {
  constructor(clusterId = 'local') {
    super(`/c/${ clusterId }/explorer/traefik.io.middleware`);
  }

  openEditConfig(name: string) {
    this.list().actionMenu(name).getMenuItem('Edit YAML').click();
  }

  yamlEditor() {
    return YamlEditorPo.editor();
  }
}
