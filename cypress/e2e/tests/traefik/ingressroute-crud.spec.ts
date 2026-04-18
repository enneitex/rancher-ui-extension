import IngressRouteListPo from '../../po/traefik/ingressroute-list.po';
import IngressRouteFormPo from '../../po/traefik/ingressroute-form.po';
import IngressRouteDetailPo from '../../po/traefik/ingressroute-detail.po';

const CLUSTER_ID = 'local';
const NAMESPACE  = 'default';

function makeIngressRoute(name: string, match = 'Host(`e2e-test.example.com`)') {
  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'IngressRoute',
    metadata:   { name, namespace: NAMESPACE },
    spec:       {
      entryPoints: ['web'],
      routes:      [{
        kind:     'Rule',
        match,
        services: [{ name: 'kubernetes', port: 443 }],
      }],
    },
  };
}

describe('IngressRoute', { testIsolation: 'off', tags: ['@traefik', '@adminUser'] }, () => {

  // Refresh the Cypress session cache before every test in every nested describe.
  beforeEach(() => {
    cy.login();
  });

  // ── 1. Create via form ────────────────────────────────────────────────────────

  describe('Create via form', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-create').then((name) => {
        resourceName = name;
      });
    });

    beforeEach(() => {
      cy.login();
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('fills in the form and creates an IngressRoute', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.setName(resourceName);

      form.entryPointsTab().click();
      form.clearEntryPoints();
      form.addEntryPoint('web');

      form.routesTab().click();
      form.matchInput().type('Host(`e2e-create.example.com`)');
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      form.save();

      const list = new IngressRouteListPo(CLUSTER_ID);
      list.waitForPage();
      list.rowShouldExist(resourceName);
      removeResource = true;
    });

    it('shows the entry-point value "web" in the list row', () => {
      const list = new IngressRouteListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.findRowByName(resourceName).should('contain', 'web');
    });
  });

  // ── 2. Add / remove routes ────────────────────────────────────────────────────

  describe('Add and remove routes', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-routes').then((name) => {
        resourceName = name;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('can create an IngressRoute with two routes and persist them', () => {
      const form = new IngressRouteFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();
      form.setName(resourceName);

      // Route 0
      form.routesTab().click();
      form.matchInput().type('Host(`route0.example.com`)');
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      // Route 1
      form.addRoute();
      form.routeTab(1).should('exist').click();
      form.matchInput().type('Host(`route1.example.com`)');
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      form.save();

      const list = new IngressRouteListPo(CLUSTER_ID);
      list.waitForPage();
      list.rowShouldExist(resourceName);
      removeResource = true;

      cy.getRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.routes).to.have.length(2);
      });
    });

    it('can remove the second route and persist the change', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteFormPo(CLUSTER_ID);
      form.waitForEditPage();
      form.routesTab().click();

      // Switch to route 1 and remove it
      form.routeTab(1).should('exist').click();
      form.removeRouteButton().click();
      form.routeTab(1).should('not.exist');

      form.save();

      cy.getRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.routes).to.have.length(1);
        expect(resp.body.spec.routes[0].match).to.eq('Host(`route0.example.com`)');
      });
    });
  });

  // ── 3. Edit via form ──────────────────────────────────────────────────────────

  describe('Edit via form', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-edit').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(name, 'Host(`original.example.com`)'));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('edit form pre-fills the existing match rule', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      new IngressRouteFormPo(CLUSTER_ID).waitForEditPage();
      cy.get('[data-testid="btn-routes"]').click();
      new IngressRouteFormPo(CLUSTER_ID)
        .matchInput()
        .should('have.value', 'Host(`original.example.com`)');
    });

    it('can modify the match rule and the change persists', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteFormPo(CLUSTER_ID);
      form.waitForEditPage();
      cy.get('[data-testid="btn-routes"]').click();

      form.matchInput().clear().type('Host(`updated.example.com`)');
      form.save();

      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);
      form.waitForEditPage();
      cy.get('[data-testid="btn-routes"]').click();
      form.matchInput().should('have.value', 'Host(`updated.example.com`)');
    });

    it('can add a second route to an existing IngressRoute', () => {
      IngressRouteFormPo.goToEdit(CLUSTER_ID, NAMESPACE, resourceName);

      const form = new IngressRouteFormPo(CLUSTER_ID);
      form.waitForEditPage();
      cy.get('[data-testid="btn-routes"]').click();

      form.addRoute();
      form.routeTab(1).should('exist').click();
      form.matchInput().type('Host(`second-route.example.com`)');
      form.setServiceName('kubernetes');
      form.setServicePort('443');

      form.save();

      cy.getRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`).then((resp) => {
        expect(resp.body.spec.routes).to.have.length(2);
      });
    });
  });

  // ── 4. Delete from list ───────────────────────────────────────────────────────

  describe('Delete from list', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-delete').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(name));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('deletes the resource via the action menu and confirms it is removed', () => {
      const list = new IngressRouteListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowShouldExist(resourceName);

      list.deleteResourceByName(resourceName);
      removeResource = false;

      list.rowShouldNotExist(resourceName);
    });
  });

  // ── 5. Cancel deletion ────────────────────────────────────────────────────────

  describe('Cancel deletion', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-cancel').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(name));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('cancelling the delete dialog keeps the resource in the list', () => {
      const list = new IngressRouteListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowShouldExist(resourceName);

      list.list().actionMenu(resourceName).getMenuItem('Delete').click();

      // Cancel the prompt
      cy.contains('button', 'Cancel').click();

      list.rowShouldExist(resourceName);
    });
  });

  // ── 6. Delete from detail view ────────────────────────────────────────────────

  describe('Delete from detail view', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-detail-del').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(name));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('deletes via the detail view masthead and redirects to the list', () => {
      const detail = new IngressRouteDetailPo(CLUSTER_ID, NAMESPACE, resourceName);

      detail.goTo();
      detail.waitForPage();
      detail.deleteFromMasthead();
      detail.confirmDelete();
      removeResource = false;

      const list = new IngressRouteListPo(CLUSTER_ID);

      list.waitForPage();
      list.rowShouldNotExist(resourceName);
    });
  });

  // ── 7. YAML ───────────────────────────────────────────────────────────────────

  describe('YAML', () => {
    let resourceName: string;
    let removeResource = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('ir-yaml').then((name) => {
        resourceName = name;
        cy.createRancherResource('v1', 'traefik.io.ingressroutes', makeIngressRoute(name));
        removeResource = true;
      });
    });

    after('clean up', () => {
      if (removeResource) {
        cy.deleteRancherResource('v1', 'traefik.io.ingressroutes', `${ NAMESPACE }/${ resourceName }`, false);
      }
    });

    it('can open the YAML editor via the "Edit YAML" action', () => {
      const list = new IngressRouteListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.rowShouldExist(resourceName);

      list.list().actionMenu(resourceName).getMenuItem('Edit YAML').click();

      // Rancher renders a YAML editor (CodeMirror or the shell editor)
      cy.get('[data-testid="yaml-editor-input"], .CodeMirror, .cm-editor').should('be.visible');
    });

    it('YAML editor contains the resource kind and name', () => {
      const list = new IngressRouteListPo(CLUSTER_ID);

      list.goTo();
      list.waitForPage();
      list.list().actionMenu(resourceName).getMenuItem('Edit YAML').click();

      // The editor content should contain the resource name
      cy.get('[data-testid="yaml-editor-input"], .CodeMirror, .cm-editor')
        .should('contain.text', resourceName)
        .and('contain.text', 'IngressRoute');
    });
  });

});
