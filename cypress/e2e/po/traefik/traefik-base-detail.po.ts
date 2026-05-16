import PagePo from '@rancher/cypress/e2e/po/pages/page.po';
import PromptRemove from '@rancher/cypress/e2e/po/prompts/promptRemove.po';

/**
 * Shared base class for all Traefik resource detail page objects.
 *
 * Factors out common detail interactions:
 *   - mastheadTitle
 *   - openActionsMenu / mastheadMenuItem
 *   - editFromMasthead / deleteFromMasthead
 *   - confirmDelete / cancelDelete
 *   - shouldBeOnEditPage
 */
export default class TraefikBaseDetailPo extends PagePo {
  // ── Masthead ──────────────────────────────────────────────────────────────────

  mastheadTitle(): Cypress.Chainable<any> {
    return cy.get('.masthead-resource-title');
  }

  /** Override: wait for URL match AND masthead to confirm the detail page is mounted. */
  waitForPage(params?: string, fragment?: string, options?: any): any {
    super.waitForPage(params, fragment, options);
    this.mastheadTitle().should('be.visible');
  }

  /** Open the kebab menu in the masthead. */
  openActionsMenu() {
    cy.getId('masthead-action-menu').click();
  }

  /** Click a named item in the masthead action menu. */
  mastheadMenuItem(item: string) {
    this.openActionsMenu();
    cy.contains('[dropdown-menu-item]', item).click();
  }

  editFromMasthead() {
    this.mastheadMenuItem('Edit');
  }

  deleteFromMasthead() {
    this.mastheadMenuItem('Delete');
  }

  // ── Masthead detail items ─────────────────────────────────────────────────────

  /**
   * Returns the value span of the "Ingress Class" detail item in the masthead.
   *
   * Rancher 2.12+ uses a new detail page masthead (latest.vue) that renders model
   * `details()` items via useResourceDetails → IdentifyingInformation:
   *   <div class="identifying-information">
   *     <div class="row">
   *       <label class="label">Ingress Class</label>
   *       <span class="value">traefik-v3</span>
   *     </div>
   *   </div>
   */
  mastheadIngressClass(): Cypress.Chainable {
    return cy.contains('.identifying-information .row .label', 'Ingress Class')
      .parent()
      .find('.value');
  }

  // ── Delete confirmation ───────────────────────────────────────────────────────

  confirmDelete() {
    new PromptRemove().remove();
  }

  cancelDelete() {
    new PromptRemove().cancel();
  }

  shouldBeOnEditPage() {
    cy.url().should('include', 'mode=edit');
  }
}
