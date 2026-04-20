import IngressRouteFormPo from '../../po/traefik/ingressroute-form.po';
import IngressRouteListPo from '../../po/traefik/ingressroute-list.po';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

// testIsolation: 'off' — tests share the login session and navigation state to avoid
// re-authenticating between each test, which would significantly slow down the suite.
describe('IngressRoute — create form', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── 2.1 Form renders correctly ────────────────────────────────────────────────

  describe('2.1 Form structure', () => {
    it('all expected tabs are present when opening the create form', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.entryPointsTab().should('be.visible');
      form.routesTab().should('be.visible');
      form.tlsTab().should('be.visible');
      form.ingressClassTab().should('be.visible');
      form.labelsAndAnnotationsTab().should('be.visible');
    });
  });

  // ── 2.2 Entry Points tab ──────────────────────────────────────────────────────

  describe('2.2 Entry Points tab', () => {
    it('default entry point "websecure" is pre-selected', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.entryPointsTab().click();

      form.entryPointsSelect().contains('.vs__selected', 'websecure').should('be.visible');
    });

    it('can select additional entry point "web"', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.entryPointsTab().click();
      form.addEntryPoint('web');

      form.entryPointsSelect().contains('.vs__selected', 'web').should('be.visible');
      form.entryPointsSelect().contains('.vs__selected', 'websecure').should('be.visible');
    });

    it('can remove an entry point', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.entryPointsTab().click();
      form.removeEntryPoint('websecure');

      cy.contains('.labeled-select .vs__selected', 'websecure').should('not.exist');
    });

    it('removing all entry points shows the required-field error banner', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.entryPointsTab().click();
      form.clearEntryPoints();

      form.entryPointsRequiredBanner().should('be.visible');
      form.saveButton().should('be.disabled');
    });
  });

  // ── 2.3 Routes tab — basic route ─────────────────────────────────────────────

  describe('2.3 Routes tab — basic route', () => {
    it('Routes tab shows one route by default', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();

      form.routeTab(0).should('exist');
      form.routeTab(1).should('not.exist');
    });

    it('can type a match rule', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);
      const match = 'Host(`create-test.example.com`)';

      form.goTo();
      form.waitForPage();
      form.routesTab().click();
      form.matchInput().type(match);

      form.matchInput().should('have.value', match);
    });

    it('can type a service name and select a port', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      form.serviceRows().first().contains('.vs__selected', 'kubernetes').should('be.visible');
    });
  });

  // ── 2.4 Routes tab — multiple routes ─────────────────────────────────────────

  describe('2.4 Routes tab — multiple routes', () => {
    it('can add a second route tab', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();
      form.addRoute();

      form.routeTab(1).should('exist');
    });

    it('each route tab is independent — active route only shows its own fields', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();

      form.matchInput().type('Host(`route0.example.com`)');
      form.addRoute();
      form.routeTab(1).click();
      form.matchInput().type('Host(`route1.example.com`)');

      // Switch back to route 0 and verify its value
      form.routeTab(0).click();
      form.matchInput().should('have.value', 'Host(`route0.example.com`)');
    });

    it('can remove the second route tab', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();
      form.addRoute();
      form.routeTab(1).click();
      form.removeRouteButton().click();

      form.routeTab(1).should('not.exist');
    });

    it('the single default route has no Remove button (cannot remove last route)', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();

      // Wait for the route-header to be present, then assert no Remove button inside it.
      // Cannot use removeRouteButton().should('not.exist') because cy.get() itself would timeout.
      form.activeRouteHeader().should('be.visible');
      form.activeRouteHeader().find('[data-testid^="route-remove-"]').should('not.exist');
    });
  });

  // ── 2.5 Routes tab — services ────────────────────────────────────────────────

  describe('2.5 Routes tab — services', () => {
    it('can add a second service within a route', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();
      form.addServiceButton().click();

      // Two "Target Service" selects should now be visible
      form.serviceRows().should('have.length.gte', 2);
    });

    it('Port field is visible for a k8s service row', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();

      form.serviceRows().first().contains('.labeled-select label', 'Port').should('be.visible');
    });
  });

  // ── 2.6 Routes tab — middlewares ─────────────────────────────────────────────

  describe('2.6 Routes tab — middlewares', () => {
    before(() => {
      cy.login();
      // Guard: the banner only appears when there are no middlewares in the namespace.
      // Assert precondition via the API to avoid false positives from leftover resources.
      cy.request({ url: `/v1/traefik.io.middlewares?namespace=${ NAMESPACE }` }).then((resp) => {
        expect(
          resp.body.data ?? [],
          `Namespace "${ NAMESPACE }" must have no Middlewares for this test to be valid`
        ).to.have.length(0);
      });
    });

    it('shows info banner when no middlewares exist in the namespace', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.routesTab().click();

      form.middlewareEmptyBanner().should('be.visible');
    });
  });

  // ── 2.7 TLS tab ───────────────────────────────────────────────────────────────

  describe('2.7 TLS tab', () => {
    it('TLS is disabled by default', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsTab().click();

      form.tlsNotConfiguredBanner().should('be.visible');
    });

    it('enabling TLS reveals the secret, resolver and options fields', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsTab().click();
      form.enableTls();

      form.tlsSecretSelect().should('be.visible');
      form.certResolverInput().should('be.visible');
      form.tlsOptionsSelect().should('be.visible');
    });

    it('can type a certificate resolver name', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsTab().click();
      form.enableTls();
      form.setCertResolver('letsencrypt');

      form.certResolverInput().should('have.value', 'letsencrypt');
    });

    it('can add a TLS domain with a main domain value', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsTab().click();
      form.enableTls();
      form.addTlsDomain();

      form.tlsDomainMainInput().should('be.visible');
      form.tlsDomainMainInput().type('tls-test.example.com');
      form.tlsDomainMainInput().should('have.value', 'tls-test.example.com');
    });

    it('can add a SAN to a TLS domain', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsTab().click();
      form.enableTls();
      form.addTlsDomain();

      form.tlsDomainSansInput().should('be.visible');
    });

    it('disabling TLS hides the configuration fields', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.tlsTab().click();
      form.enableTls();

      form.tlsSecretSelect().should('be.visible');

      form.disableTls();

      form.tlsNotConfiguredBanner().should('be.visible');
      cy.get('.tls-configuration .labeled-select').should('not.exist');
    });
  });

  // ── 2.8 IngressClass tab ──────────────────────────────────────────────────────

  describe('2.8 IngressClass tab', () => {
    it('IngressClass dropdown is present', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.ingressClassTab().click();

      form.ingressClassSelect().should('be.visible');
    });

    it('IngressClass dropdown reflects the cluster state (enabled with classes, disabled without)', () => {
      cy.getRancherResource('v1', 'networking.k8s.io.ingressclasses').then((resp) => {
        const hasClasses = (resp.body?.data?.length ?? 0) > 0;

        const form = new IngressRouteFormPo(CLUSTER_ID);

        form.goTo();
        form.waitForPage();
        form.ingressClassTab().click();

        if (hasClasses) {
          // Classes exist → dropdown should be enabled, no warning banner
          form.ingressClassSelect().should('be.visible');
          form.ingressClassSelect().find('input').should('not.be.disabled');
        } else {
          // No classes → warning banner and disabled dropdown
          form.ingressClassWarningBanner().should('be.visible');
          form.ingressClassSelect().find('input').should('be.disabled');
        }
      });
    });
  });

  // ── 2.9 Full create flow ──────────────────────────────────────────────────────

  describe('2.9 Full create flow', () => {
    let resourceName: string;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-full').then((name) => {
        resourceName = name;
      });
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
    });

    it('fills name, entry point, match rule, service, port and saves — resource appears in list', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.setName(resourceName);

      form.entryPointsTab().click();
      form.clearEntryPoints();
      form.addEntryPoint('websecure');

      form.routesTab().click();
      form.matchInput().type('Host(`full-create.example.com`)');
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      form.save();

      const list = new IngressRouteListPo(CLUSTER_ID);

      list.waitForPage();
      list.rowShouldExist(resourceName);

      cy.getRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.entryPoints).to.include('websecure');
        expect(resp.body.spec.routes[0].match).to.eq('Host(`full-create.example.com`)');
      });
    });
  });

  // ── 2.10 Validation ───────────────────────────────────────────────────────────

  describe('2.10 Validation', () => {
    it('save button is disabled when the match rule is empty (initial state)', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      // On initial load the match field is empty → routesValid is false → save disabled.
      form.saveButton().should('be.disabled');
    });

    it('removing all entry points disables save and shows error banner', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.entryPointsTab().click();
      form.clearEntryPoints();

      form.entryPointsRequiredBanner().should('be.visible');
      form.saveButton().should('be.disabled');
    });

    it('save button is enabled only after name, entry point, match rule and service are filled', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      cy.createE2EResourceName('ir-validation').then((name) => {
        form.setName(name);
      });

      form.entryPointsTab().click();
      form.clearEntryPoints();
      form.addEntryPoint('web');

      form.routesTab().click();
      form.matchInput().type('Host(`validation.example.com`)');
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      form.saveButton().should('not.be.disabled');
    });
  });

});
