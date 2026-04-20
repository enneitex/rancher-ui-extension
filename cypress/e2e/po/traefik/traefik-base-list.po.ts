import { BaseListPagePo } from '@rancher/cypress/e2e/po/pages/base/base-list-page.po';
import PromptRemove from '@rancher/cypress/e2e/po/prompts/promptRemove.po';

/**
 * Shared base class for all Traefik resource list page objects.
 *
 * Factors out common list interactions:
 *   - findRowByName / rowShouldExist / rowShouldNotExist
 *   - deleteResourceByName
 *   - clickResourceName
 *   - shouldBeOnDetailPage
 *   - sideNavLink
 */
export default class TraefikBaseListPo extends BaseListPagePo {
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

  /** Click the resource name `<a>` link in the row to navigate to the detail view. */
  clickResourceName(name: string) {
    this.findRowByName(name).contains('a', name).click();
  }

  shouldBeOnDetailPage(namespace: string, name: string) {
    cy.url().should('include', `${ namespace }/${ name }`);
    cy.url().should('not.include', 'create').and('not.include', 'mode=edit');
  }

  sideNavLink(label: string) {
    return cy.get('.side-nav').contains(label);
  }

  masthead() {
    return {
      createButton: () => cy.get('[data-testid="masthead-create"], [data-testid="masthead-create-yaml"]').first()
    };
  }
}
