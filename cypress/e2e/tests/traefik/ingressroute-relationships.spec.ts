/**
 * IngressRoute — Related Resources ("Refers To") relationship tests
 *
 * The IngressRoute model builds `metadata.relationships` entries for every
 * secondary resource referenced in its spec:
 *   - spec.routes[].services[]          → toType: "service"
 *   - spec.routes[].middlewares[]       → toType: "traefik.io.middleware"
 *   - spec.tls.secretName               → toType: "secret"
 *   - spec.tls.options.name             → toType: "traefik.io.tlsoption"
 *
 * Rancher's ResourceTabs renders these under the "Related Resources" tab in a
 * "Refers To" section (ResourceTable direction="to").  Each row shows the
 * resource name in a "Name" column.
 *
 * Test strategy
 * ─────────────
 * One describe block per secondary resource type.  Each block:
 *   1. Creates the secondary resource via API (before).
 *   2. Creates an IngressRoute via API that references it (before).
 *   3. Opens the detail page → Related Resources tab → "Refers To" section.
 *   4. Asserts the secondary resource name appears in the table.
 *   5. Cleans up all resources in after().
 *
 * A final combined describe creates an IngressRoute that references all four
 * resource types simultaneously and asserts all four rows are present.
 */

import IngressRouteDetailPo from '../../po/traefik/ingressroute-detail.po';
import { makeMiddlewareStripPrefix, makeK8sTLSSecret } from './blueprints/middlewares';
import { makeTLSOption } from './blueprints/tlsoptions';
import { makeIngressRoute } from './blueprints/ingressroutes';

const CLUSTER_ID = 'local';
const NAMESPACE   = 'default';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Service → "Refers To" shows the k8s Service name
// ─────────────────────────────────────────────────────────────────────────────

describe('IngressRoute — Related Resources: service reference', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  // "kubernetes" is the built-in service that always exists — no creation needed.
  const serviceName = 'kubernetes';
  let irName: string;
  let removeIR = false;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-rel-svc').then((name) => {
      irName = name;
      cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(irName, { entryPoints: ['websecure'], match: `Host(\`${ irName }.example.com\`)`, serviceName }));
      removeIR = true;
    });
  });

  after('clean up', () => {
    if (removeIR) {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ irName }`, false);
    }
  });

  beforeEach(() => cy.login());

  it('the "Related Resources" tab is present on the detail page', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();

    detail.relatedTab().should('be.visible');
  });

  it('"Refers To" lists the kubernetes service', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(serviceName);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Middleware → "Refers To" shows the Middleware name
// ─────────────────────────────────────────────────────────────────────────────

describe('IngressRoute — Related Resources: middleware reference', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  let middlewareName: string;
  let irName: string;
  let removeMiddleware = false;
  let removeIR = false;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-rel-mw').then((mwName) => {
      middlewareName = mwName;
      cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(middlewareName));
      removeMiddleware = true;

      cy.createE2EResourceName('ir-rel-mw-ir').then((name) => {
        irName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(irName, { entryPoints: ['websecure'], match: `Host(\`${ irName }.example.com\`)`, middlewares: [{ name: middlewareName }] }));
        removeIR = true;
      });
    });
  });

  after('clean up', () => {
    if (removeIR) {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ irName }`, false);
    }
    if (removeMiddleware) {
      cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ middlewareName }`, false);
    }
  });

  beforeEach(() => cy.login());

  it('"Refers To" lists the middleware', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(middlewareName);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 3. TLS Secret → "Refers To" shows the Secret name
// ─────────────────────────────────────────────────────────────────────────────

describe('IngressRoute — Related Resources: TLS secret reference', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  let secretName: string;
  let irName: string;
  let removeSecret = false;
  let removeIR = false;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-rel-sec').then((secName) => {
      secretName = secName;
      cy.createRancherResource('v1', 'secrets', makeK8sTLSSecret(secretName));
      removeSecret = true;

      cy.createE2EResourceName('ir-rel-sec-ir').then((name) => {
        irName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(irName, { entryPoints: ['websecure'], match: `Host(\`${ irName }.example.com\`)`, tls: { secretName } }));
        removeIR = true;
      });
    });
  });

  after('clean up', () => {
    if (removeIR) {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ irName }`, false);
    }
    if (removeSecret) {
      cy.deleteRancherResource('v1', 'secrets', `${ NAMESPACE }/${ secretName }`, false);
    }
  });

  beforeEach(() => cy.login());

  it('"Refers To" lists the TLS secret', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(secretName);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TLSOption → "Refers To" shows the TLSOption name
// ─────────────────────────────────────────────────────────────────────────────

describe('IngressRoute — Related Resources: TLS option reference', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  let tlsOptionName: string;
  let irName: string;
  let removeTLSOption = false;
  let removeIR = false;

  before(() => {
    cy.login();
    cy.createE2EResourceName('ir-rel-tlsopt').then((optName) => {
      tlsOptionName = optName;
      cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(tlsOptionName, { minVersion: 'VersionTLS12' }));
      removeTLSOption = true;

      cy.createE2EResourceName('ir-rel-tlsopt-ir').then((name) => {
        irName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(irName, { entryPoints: ['websecure'], match: `Host(\`${ irName }.example.com\`)`, tls: { options: { name: tlsOptionName, namespace: 'default' } } }));
        removeIR = true;
      });
    });
  });

  after('clean up', () => {
    if (removeIR) {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ irName }`, false);
    }
    if (removeTLSOption) {
      cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ tlsOptionName }`, false);
    }
  });

  beforeEach(() => cy.login());

  it('"Refers To" lists the TLS option', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(tlsOptionName);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Combined — all four resource types referenced at once
// ─────────────────────────────────────────────────────────────────────────────

describe('IngressRoute — Related Resources: all references combined', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  const serviceName = 'kubernetes';
  let middlewareName: string;
  let secretName: string;
  let tlsOptionName: string;
  let irName: string;

  let removeMiddleware = false;
  let removeSecret = false;
  let removeTLSOption = false;
  let removeIR = false;

  before(() => {
    cy.login();

    cy.createE2EResourceName('ir-rel-all-mw').then((mwName) => {
      middlewareName = mwName;
      cy.createRancherResource('v1', 'traefik.io.middlewares', makeMiddlewareStripPrefix(middlewareName));
      removeMiddleware = true;
    });

    cy.createE2EResourceName('ir-rel-all-sec').then((secName) => {
      secretName = secName;
      cy.createRancherResource('v1', 'secrets', makeK8sTLSSecret(secretName));
      removeSecret = true;
    });

    cy.createE2EResourceName('ir-rel-all-opt').then((optName) => {
      tlsOptionName = optName;
      cy.createRancherResource('v1', 'traefik.io.tlsoptions', makeTLSOption(tlsOptionName, { minVersion: 'VersionTLS12' }));
      removeTLSOption = true;
    });

    // Cypress's command queue ensures the three create calls above have
    // already resolved by this point, so all name variables are available.
    cy.createE2EResourceName('ir-rel-all').then((name) => {
      irName = name;
      cy.createRancherResource(
        'v1',
        'traefik.io.ingressroutes',
        makeIngressRoute(irName, { entryPoints: ['websecure'], match: `Host(\`${ irName }.example.com\`)`, middlewares: [{ name: middlewareName }], tls: { secretName, options: { name: tlsOptionName, namespace: 'default' } } })
      );
      removeIR = true;
    });
  });

  after('clean up', () => {
    if (removeIR) {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ irName }`, false);
    }
    if (removeMiddleware) {
      cy.deleteRancherResource('v1', 'traefik.io.middlewares', `${ NAMESPACE }/${ middlewareName }`, false);
    }
    if (removeSecret) {
      cy.deleteRancherResource('v1', 'secrets', `${ NAMESPACE }/${ secretName }`, false);
    }
    if (removeTLSOption) {
      cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ tlsOptionName }`, false);
    }
  });

  beforeEach(() => cy.login());

  it('"Refers To" lists the service', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(serviceName);
  });

  it('"Refers To" lists the middleware', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(middlewareName);
  });

  it('"Refers To" lists the TLS secret', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(secretName);
  });

  it('"Refers To" lists the TLS option', () => {
    const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, irName);

    detail.goTo();
    detail.waitForPage();
    detail.goToRelatedTab();

    detail.refersToRowShouldContain(tlsOptionName);
  });

});
