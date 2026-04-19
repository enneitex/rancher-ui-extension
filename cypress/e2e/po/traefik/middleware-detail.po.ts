import TraefikBaseDetailPo from './traefik-base-detail.po';

const CLUSTER = (id: string) => `/c/${ id }/explorer/traefik.io.middleware`;

export default class MiddlewareDetailPo extends TraefikBaseDetailPo {
  constructor(clusterId = 'local', namespace: string, name: string) {
    super(`${ CLUSTER(clusterId) }/${ namespace }/${ name }`);
  }

  static goToDetail(clusterId = 'local', namespace: string, name: string) {
    return TraefikBaseDetailPo.goTo(`${ CLUSTER(clusterId) }/${ namespace }/${ name }`);
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────────

  configurationTab() {
    return cy.getId('btn-configuration');
  }

  // ── Configuration tab content ─────────────────────────────────────────────────
  // The detail view renders one Card per middleware type.

  middlewareCards() {
    return cy.get('.middleware-card');
  }

  /** Find a middleware card by its type display name (e.g. "Strip Prefix"). */
  middlewareCardByTitle(title: string) {
    return cy.contains('.middleware-card .card-title', title).closest('.middleware-card');
  }

  middlewareCardByType(type: string) {
    return cy.getId(`middleware-card-${ type }`);
  }

  middlewareCardYaml(type: string) {
    return cy.getId(`middleware-card-yaml-${ type }`);
  }
}
