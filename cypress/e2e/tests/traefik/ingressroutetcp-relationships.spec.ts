/**
 * IngressRouteTCP — Related Resources ("Refers To") relationship tests
 *
 * The IngressRouteTCP model builds `metadata.relationships` entries for:
 *   - spec.routes[].services[]      → toType: "service"
 *   - spec.routes[].middlewares[]   → toType: "traefik.io.middlewaretcp"
 *   - spec.tls.secretName           → toType: "secret"
 *   - spec.tls.options.name         → toType: "traefik.io.tlsoption"
 *
 * Important: only MiddlewareTCP resources (traefik.io.middlewaretcp) generate
 * relationships — HTTP Middlewares are NOT referenced by IngressRouteTCP.
 *
 * Test strategy
 * ─────────────
 * - One describe per secondary resource type.
 * - A combined describe that references all types simultaneously.
 * - Each block creates the secondary resource + IngressRouteTCP via API,
 *   navigates to the detail page → Related Resources tab → "Refers To",
 *   and asserts the resource name appears (or is absent where expected).
 */

import IngressRouteTCPDetailPo from '../../po/traefik/ingressroutetcp-detail.po';
import { makeMiddlewareTCP, makeK8sTLSSecret } from './blueprints/middlewares';
import { makeTLSOption } from './blueprints/tlsoptions';
import { makeIngressRouteTCP } from './blueprints/ingressroutes';

const CLUSTER_ID = 'local';
const NAMESPACE   = 'default';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Service → "Refers To" shows the k8s Service name
// ─────────────────────────────────────────────────────────────────────────────

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRouteTCP — Related Resources: service reference', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  const serviceName = 'kubernetes';
  let irName: string;

  before(() => {
    cy.login();
    cy.createE2EResourceName('irtcp-rel-svc').then((name) => {
      irName = name;
      cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(irName, { serviceName }));
    });
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ irName }`, false);
  });

  beforeEach(() => cy.login());

  it('the "Related Resources" tab is present on the detail page', () => {
    const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();

    detail.relatedTab().should('be.visible');
  });

  it('"Refers To" lists the kubernetes service', () => {
    const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(serviceName);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 2. MiddlewareTCP → "Refers To" shows the MiddlewareTCP name
// ─────────────────────────────────────────────────────────────────────────────

describe('IngressRouteTCP — Related Resources: MiddlewareTCP reference', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  let middlewareName: string;
  let irName: string;

  before(() => {
    cy.login();
    cy.createE2EResourceName('irtcp-rel-mwtcp').then((mwName) => {
      middlewareName = mwName;
      cy.createRancherResource('v1', 'traefik.io.middlewaretcps', makeMiddlewareTCP(middlewareName));

      cy.createE2EResourceName('irtcp-rel-mwtcp-ir').then((name) => {
        irName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(irName, { middlewares: [{ name: middlewareName }] }));
      });
    });
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ irName }`, false);
    cy.deleteRancherResource('v1', 'traefik.io.middlewaretcps', `${ NAMESPACE }/${ middlewareName }`, false);
  });

  beforeEach(() => cy.login());

  it('"Refers To" lists the MiddlewareTCP', () => {
    const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(middlewareName);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 3. TLS Secret → "Refers To" shows the Secret name
// ─────────────────────────────────────────────────────────────────────────────

describe('IngressRouteTCP — Related Resources: TLS secret reference', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  let secretName: string;
  let irName: string;

  before(() => {
    cy.login();
    cy.createE2EResourceName('irtcp-rel-sec').then((secName) => {
      secretName = secName;
      cy.createRancherResource('v1', 'secrets', makeK8sTLSSecret(secretName));

      cy.createE2EResourceName('irtcp-rel-sec-ir').then((name) => {
        irName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(irName, { tls: { secretName } }));
      });
    });
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ irName }`, false);
    cy.deleteRancherResource('v1', 'secrets', `${ NAMESPACE }/${ secretName }`, false);
  });

  beforeEach(() => cy.login());

  it('"Refers To" lists the TLS secret', () => {
    const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(secretName);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TLSOption → "Refers To" shows the TLSOption name
// ─────────────────────────────────────────────────────────────────────────────

describe('IngressRouteTCP — Related Resources: TLS option reference', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  let tlsOptionName: string;
  let irName: string;

  before(() => {
    cy.login();
    cy.createE2EResourceName('irtcp-rel-tlsopt').then((optName) => {
      tlsOptionName = optName;
      cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(tlsOptionName, { minVersion: 'VersionTLS12' }));

      cy.createE2EResourceName('irtcp-rel-tlsopt-ir').then((name) => {
        irName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutetcps', makeIngressRouteTCP(irName, { tls: { options: { name: tlsOptionName, namespace: 'default' } } }));
      });
    });
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ irName }`, false);
    cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ tlsOptionName }`, false);
  });

  beforeEach(() => cy.login());

  it('"Refers To" lists the TLS option', () => {
    const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(tlsOptionName);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Combined — all four resource types referenced simultaneously
// ─────────────────────────────────────────────────────────────────────────────

describe('IngressRouteTCP — Related Resources: all references combined', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  const serviceName = 'kubernetes';
  let middlewareName: string;
  let secretName: string;
  let tlsOptionName: string;
  let irName: string;

  before(() => {
    cy.login();

    cy.createE2EResourceName('irtcp-rel-all-mw').then((mwName) => {
      middlewareName = mwName;
      cy.createRancherResource('v1', 'traefik.io.middlewaretcps', makeMiddlewareTCP(middlewareName));
    });

    cy.createE2EResourceName('irtcp-rel-all-sec').then((secName) => {
      secretName = secName;
      cy.createRancherResource('v1', 'secrets', makeK8sTLSSecret(secretName));
    });

    cy.createE2EResourceName('irtcp-rel-all-opt').then((optName) => {
      tlsOptionName = optName;
      cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(tlsOptionName, { minVersion: 'VersionTLS12' }));
    });

    // Cypress's command queue ensures the three create calls above have
    // already resolved by this point, so all name variables are available.
    cy.createE2EResourceName('irtcp-rel-all').then((name) => {
      irName = name;
      cy.createRancherResource(
        'v1',
        'traefik.io.ingressroutetcps',
        makeIngressRouteTCP(irName, { middlewares: [{ name: middlewareName }], tls: { secretName, options: { name: tlsOptionName, namespace: 'default' } } })
      );
    });
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'traefik.io.ingressroutetcps', `${ NAMESPACE }/${ irName }`, false);
    cy.deleteRancherResource('v1', 'traefik.io.middlewaretcps', `${ NAMESPACE }/${ middlewareName }`, false);
    cy.deleteRancherResource('v1', 'secrets', `${ NAMESPACE }/${ secretName }`, false);
    cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ tlsOptionName }`, false);
  });

  beforeEach(() => cy.login());

  it('"Refers To" lists the service', () => {
    const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(serviceName);
  });

  it('"Refers To" lists the MiddlewareTCP', () => {
    const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(middlewareName);
  });

  it('"Refers To" lists the TLS secret', () => {
    const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(secretName);
  });

  it('"Refers To" lists the TLS option', () => {
    const detail = new IngressRouteTCPDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(tlsOptionName);
  });

});
