import TraefikBaseDetailPo from './traefik-base-detail.po';

const CLUSTER = (id: string) => `/c/${ id }/explorer/traefik.io.tlsoption`;

export default class TLSOptionDetailPo extends TraefikBaseDetailPo {
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

  // ── Configuration cards ───────────────────────────────────────────────────────
  // The detail view (traefik.io.tlsoption.vue) renders one Card per configured section.
  // Cards are only present when their section has values — `v-if="hasTlsVersions"` etc.

  tlsVersionsCard() {
    return cy.getId('tls-card-versions');
  }

  cipherSuitesCard() {
    return cy.getId('tls-card-cipher-suites');
  }

  clientAuthCard() {
    return cy.getId('tls-card-client-auth');
  }

  advancedCard() {
    return cy.getId('tls-card-advanced');
  }

  /** Raw selector variant used when the spec needs to assert a card is absent. */
  tlsVersionsCardElement() {
    return cy.get('[data-testid="tls-card-versions"]');
  }

  /** Raw selector variant used when the spec needs to assert a card is absent. */
  cipherSuitesCardElement() {
    return cy.get('[data-testid="tls-card-cipher-suites"]');
  }
}
