jest.mock('@shell/plugins/steve/steve-class', () => {
  class SteveModel {
    constructor(data) {
      Object.assign(this, data);
    }
  }

  return { __esModule: true, default: SteveModel };
});

import CnpgCluster from '../postgresql.cnpg.io.cluster';

const makeCluster = (data) => new CnpgCluster(data);

describe('postgresql.cnpg.io.cluster model', () => {
  describe('stateObj', () => {
    it('should return provisioning when status is absent', () => {
      const cluster = makeCluster({ metadata: { name: 'pg', namespace: 'default' } });

      expect(cluster.stateObj).toStrictEqual({
        name:          'provisioning',
        transitioning: true,
        error:         false,
        message:       undefined,
      });
    });

    it('should return active when phase is "Cluster in healthy state"', () => {
      const cluster = makeCluster({
        metadata: { name: 'pg', namespace: 'default' },
        status:   { phase: 'Cluster in healthy state' },
      });

      expect(cluster.stateObj).toStrictEqual({
        name:          'active',
        transitioning: false,
        error:         false,
        message:       'Cluster in healthy state',
      });
    });

    it('should return unknown when phase is not in PHASE_MAP', () => {
      const cluster = makeCluster({
        metadata: { name: 'pg', namespace: 'default' },
        status:   { phase: 'Unknown new phase' },
      });

      expect(cluster.stateObj).toStrictEqual({
        name:          'unknown',
        transitioning: false,
        error:         false,
        message:       'Unknown new phase',
      });
    });

    it('should return suspended when reconciliationLoop annotation is disabled', () => {
      const cluster = makeCluster({
        metadata: {
          name:        'pg',
          namespace:   'default',
          annotations: { 'cnpg.io/reconciliationLoop': 'disabled' },
        },
        status: { phase: 'Cluster in healthy state' },
      });

      expect(cluster.stateObj).toStrictEqual({
        name:          'suspended',
        transitioning: false,
        error:         false,
        message:       'Cluster reconciliation is suspended',
      });
    });

    it('should return suspended when hibernation condition has status True', () => {
      const cluster = makeCluster({
        metadata: { name: 'pg', namespace: 'default' },
        status:   {
          phase:      'Cluster in healthy state',
          conditions: [
            {
              type:    'cnpg.io/hibernation',
              status:  'True',
              message: 'Cluster is hibernating',
            },
          ],
        },
      });

      expect(cluster.stateObj).toStrictEqual({
        name:          'suspended',
        transitioning: false,
        error:         false,
        message:       'Cluster is hibernating',
      });
    });

    it('should return degraded when hibernation condition has status False', () => {
      const cluster = makeCluster({
        metadata: { name: 'pg', namespace: 'default' },
        status:   {
          conditions: [
            {
              type:    'cnpg.io/hibernation',
              status:  'False',
              message: 'Waking up',
            },
          ],
        },
      });

      expect(cluster.stateObj).toStrictEqual({
        name:          'degraded',
        transitioning: false,
        error:         false,
        message:       'Waking up',
      });
    });
  });
});
