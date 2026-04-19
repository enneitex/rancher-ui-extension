/**
 * TLSOption — Client Auth secret dropdown (secondary resource) tests
 *
 * The TLSOption "Client Auth" tab exposes an ArrayListSelect bound to
 * `spec.clientAuth.secretNames`.  When Kubernetes secrets of type
 * `kubernetes.io/tls` exist in the namespace, they appear as options in each
 * row's LabeledSelect.
 *
 * These tests cover:
 *   1. Creating a TLS Secret via API.
 *   2. Navigating to the TLSOption create form → Client Auth tab.
 *   3. Selecting an auth type that enables the secret list.
 *   4. Asserting the secret appears in the dropdown.
 *   5. Selecting the secret and asserting it is visually selected.
 *   6. Saving the TLSOption and asserting the API persists secretNames.
 *   7. Cleaning up all created resources.
 */

import TLSOptionFormPo from '../../po/traefik/tlsoption-form.po';
import TLSOptionListPo from '../../po/traefik/tlsoption-list.po';
import { makeK8sTLSSecret } from './blueprints/middlewares';

const CLUSTER_ID = 'local';
const NAMESPACE   = 'default';

describe('TLSOption — Client Auth secret dropdown (secondary resource)', {
  testIsolation: 'off',
  tags:          ['@traefik', '@adminUser']
}, () => {

  let secretName: string;
  let removeSecret = false;

  before(() => {
    cy.login();
    cy.createE2EResourceName('tlsopt-casec').then((name) => {
      secretName = name;
      cy.createRancherResource('v1', 'secrets', makeK8sTLSSecret(secretName));
      removeSecret = true;
    });
  });

  after('clean up', () => {
    if (removeSecret) {
      cy.deleteRancherResource('v1', 'secrets', `${ NAMESPACE }/${ secretName }`, false);
    }
  });

  beforeEach(() => {
    cy.login();
  });

  it('the "Add CA Secret" button is present on the Client Auth tab', () => {
    const form = new TLSOptionFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.clientAuthTab().click();

    form.addClientAuthSecretButton().should('be.visible');
  });

  it('the existing TLS secret appears in the CA secret dropdown', () => {
    const form = new TLSOptionFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.clientAuthTab().click();

    // Add a secret row and check the dropdown
    form.addClientAuthSecretButton().click();
    form.clientAuthSecretOptionShouldExist(secretName);
  });

  it('can select the CA secret and it appears as a selected tag', () => {
    const form = new TLSOptionFormPo(CLUSTER_ID);

    form.goTo();
    form.waitForPage();
    form.clientAuthTab().click();

    form.addClientAuthSecretButton().click();
    form.selectClientAuthSecret(secretName);

    form.clientAuthSecretSelect()
      .contains('.vs__selected', secretName)
      .should('be.visible');
  });

  describe('create with CA secret and verify API', () => {
    let tlsOptName: string;
    let removeOpt = false;

    before(() => {
      cy.login();
      cy.createE2EResourceName('tlsopt-with-casec').then((name) => {
        tlsOptName = name;
      });
    });

    after('clean up', () => {
      if (removeOpt) {
        cy.deleteRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ tlsOptName }`, false);
      }
    });

    it('creates a TLSOption with a CA secret and verifies it in the API', () => {
      const form = new TLSOptionFormPo(CLUSTER_ID);

      form.goTo();
      form.waitForPage();

      form.setName(tlsOptName);

      // Select an auth type that requires CA secrets
      form.clientAuthTab().click();
      form.selectClientAuthType('RequireAndVerifyClientCert');

      // Add the CA secret
      form.addClientAuthSecretButton().click();
      form.selectClientAuthSecret(secretName);

      form.save();

      const list = new TLSOptionListPo(CLUSTER_ID);

      list.waitForPage();
      list.rowShouldExist(tlsOptName);
      removeOpt = true;

      cy.getRancherResource('v1', 'traefik.io.tlsoptions', `${ NAMESPACE }/${ tlsOptName }`).then((resp) => {
        expect(resp.body?.spec?.clientAuth?.clientAuthType).to.eq('RequireAndVerifyClientCert');
        expect(resp.body?.spec?.clientAuth?.secretNames).to.include(secretName);
      });
    });
  });

});
