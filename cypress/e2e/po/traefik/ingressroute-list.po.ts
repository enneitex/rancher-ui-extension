import { BaseListPagePo } from '@rancher/cypress/e2e/po/pages/base/base-list-page.po';
import PromptRemove from '@rancher/cypress/e2e/po/prompts/promptRemove.po';

export default class IngressRouteListPo extends BaseListPagePo {
  constructor(clusterId = 'local') {
    super(`/c/${ clusterId }/explorer/traefik.io.ingressroute`);
  }

  findRowByName(name: string) {
    return this.list().resourceTable().sortableTable().rowElementWithName(name);
  }

  rowShouldExist(name: string) {
    this.list().rowWithName(name).checkVisible();
  }

  rowShouldNotExist(name: string) {
    this.list().resourceTable().sortableTable().rowElementWithName(name).should('not.exist');
  }

  deleteResourceByName(name: string) {
    this.list().actionMenu(name).getMenuItem('Delete').click();
    new PromptRemove().remove();
  }
}
