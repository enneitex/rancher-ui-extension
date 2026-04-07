import SteveModel from '@shell/plugins/steve/steve-class';

// PHASE_MAP — inspiré du health check ArgoCD :
// https://github.com/argoproj/argo-cd/blob/master/resource_customizations/postgresql.cnpg.io/Cluster/health.lua
//
// Maintenance : si CNPG introduit une nouvelle phase, ajouter une entrée ici
// avec le state Rancher approprié (active/provisioning/updating/degraded/suspended).
const PHASE_MAP = {
  'Cluster in healthy state':                                                               { name: 'active',        transitioning: false },
  'Setting up primary':                                                                     { name: 'provisioning',  transitioning: true },
  'Creating a new replica':                                                                 { name: 'provisioning',  transitioning: true },
  'Upgrading cluster':                                                                      { name: 'updating',      transitioning: true },
  'Waiting for the instances to become active':                                             { name: 'provisioning',  transitioning: true },
  'Promoting to primary cluster':                                                           { name: 'provisioning',  transitioning: true },
  'Switchover in progress':                                                                 { name: 'degraded',      transitioning: false },
  'Failing over':                                                                           { name: 'degraded',      transitioning: false },
  'Upgrading Postgres major version':                                                       { name: 'degraded',      transitioning: false },
  'Cluster upgrade delayed':                                                                { name: 'degraded',      transitioning: false },
  'Waiting for user action':                                                                { name: 'degraded',      transitioning: false },
  'Primary instance is being restarted in-place':                                          { name: 'degraded',      transitioning: false },
  'Primary instance is being restarted without a switchover':                              { name: 'degraded',      transitioning: false },
  'Cluster cannot execute instance online upgrade due to missing architecture binary':     { name: 'degraded',      transitioning: false },
  'Online upgrade in progress':                                                            { name: 'degraded',      transitioning: false },
  'Applying configuration':                                                                { name: 'degraded',      transitioning: false },
  'Unable to create required cluster objects':                                             { name: 'suspended',     transitioning: false },
  'Cluster cannot proceed to reconciliation due to an unknown plugin being required':      { name: 'suspended',     transitioning: false },
  'Cluster has incomplete or invalid image catalog':                                       { name: 'suspended',     transitioning: false },
  'Cluster is unrecoverable and needs manual intervention':                               { name: 'suspended',     transitioning: false },
};

export default class CnpgCluster extends SteveModel {
  get stateObj() {
    // Réconciliation suspendue via annotation
    if (this.metadata?.annotations?.['cnpg.io/reconciliationLoop'] === 'disabled') {
      return {
        name:          'suspended',
        transitioning: false,
        error:         false,
        message:       'Cluster reconciliation is suspended',
      };
    }

    const conditions = this.status?.conditions || [];
    const hibernation = conditions.find((c) => c.type === 'cnpg.io/hibernation');

    if (hibernation) {
      return {
        name:          hibernation.status === 'True' ? 'suspended' : 'degraded',
        transitioning: false,
        error:         false,
        message:       hibernation.message,
      };
    }

    const phase = this.status?.phase;

    if (phase) {
      const mapped = PHASE_MAP[phase];

      return {
        name:          mapped?.name || 'unknown',
        transitioning: mapped?.transitioning ?? false,
        error:         false,
        message:       this.status?.phaseReason || phase,
      };
    }

    // Pas encore de status : cluster en cours de création
    return {
      name:          'provisioning',
      transitioning: true,
      error:         false,
      message:       this.status?.phaseReason,
    };
  }
}
