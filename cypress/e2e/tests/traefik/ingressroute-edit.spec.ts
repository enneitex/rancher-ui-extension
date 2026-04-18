import IngressRouteFormPo from '../../po/traefik/ingressroute-form.po';
import IngressRouteListPo from '../../po/traefik/ingressroute-list.po';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

function makeIngressRoute(name: string, opts: { match?: string; entryPoints?: string[]; serviceName?: string } = {}) {
  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'IngressRoute',
    metadata:   { name, namespace: NAMESPACE },
    spec:       {
      entryPoints: opts.entryPoints ?? ['web', 'websecure'],
      routes:      [{
        kind:     'Rule',
        match:    opts.match ?? 'Host(`edit-test.example.com`)',
        services: [{ name: opts.serviceName ?? 'kubernetes', port: 443 }],
      }],
    },
  };
}

describe('IngressRoute — edit form', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  beforeEach(() => {
    cy.login();
  });

  // ── 3.1 Pre-fill all existing values ─────────────────────────────────────────

  describe('pre-fills existing values', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-prefill').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes',
          makeIngressRoute(name, { entryPoints: ['web', 'websecure'], match: 'Host(`prefill.example.com`)' }));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('edit form pre-fills entry points', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.waitForEditPage();
      form.entryPointsTab().click();
      cy.contains('.labeled-select .vs__selected', 'web').should('be.visible');
      cy.contains('.labeled-select .vs__selected', 'websecure').should('be.visible');
    });

    it('edit form pre-fills the match rule and service name', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.waitForEditPage();
      form.routesTab().click();
      form.matchInput().should('have.value', 'Host(`prefill.example.com`)');
      cy.contains('.routes-section .container-group:visible .vs__selected', 'kubernetes').should('be.visible');
    });
  });

  // ── 3.2 Change service name ───────────────────────────────────────────────────

  describe('change service name', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-svc').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes',
          makeIngressRoute(name, { serviceName: 'kubernetes' }));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('can change the service name in an existing route and the change persists', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.waitForEditPage();
      form.routesTab().click();

      // Open the service select, clear with backspace, type a new value.
      // Vue Select taggable single-mode: backspace removes the selected tag, then Enter adds the new one.
      cy.get('.routes-section .container-group:visible')
        .contains('.labeled-select label', 'Target Service')
        .closest('.labeled-select')
        .find('.vs__search')
        .type('{backspace}kubernetes-updated{enter}', { force: true });

      form.save();

      // Verify change persisted via the API
      cy.getRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.routes[0].services[0].name).to.eq('kubernetes-updated');
      });
    });
  });

  // ── 3.3 Enable TLS ────────────────────────────────────────────────────────────

  describe('enable TLS on an existing IngressRoute', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-tls-enable').then((name) => {
        resourceName = name;
        // Create without TLS
        cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(name));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('can enable TLS with a certificate resolver and save', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.waitForEditPage();
      form.tlsTab().click();
      form.enableTls();
      form.setCertResolver('letsencrypt');
      form.save();

      cy.getRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.tls).to.exist;
        expect(resp.body.spec.tls.certResolver).to.eq('letsencrypt');
      });
    });
  });

  // ── 3.4 Changes persist after navigation ─────────────────────────────────────

  describe('changes persist after navigation away and back', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-persist').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes',
          makeIngressRoute(name, { match: 'Host(`original.example.com`)' }));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('updated match rule is still present when returning to the edit form', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);
      form.waitForEditPage();
      form.routesTab().click();
      form.matchInput().clear().type('Host(`updated-persist.example.com`)');
      form.save();

      // Navigate away to the list
      const list = new IngressRouteListPo(CLUSTER_ID);

      list.waitForPage();

      // Navigate back to the edit form
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);
      form.waitForEditPage();
      form.routesTab().click();
      form.matchInput().should('have.value', 'Host(`updated-persist.example.com`)');
    });
  });

});
