jest.mock('@shell/plugins/steve/steve-class', () => {
  class SteveModel {
    constructor(data: Record<string, unknown>) {
      Object.assign(this, data);
    }
  }

  return { __esModule: true, default: SteveModel };
});

import CnpgCluster from '../postgresql.cnpg.io.cluster';

const makeCluster = (data) => new CnpgCluster(data);

const BASE_META = { name: 'pg', namespace: 'default' };

describe('postgresql.cnpg.io.cluster model', () => {
  describe('stateObj', () => {
    // ─── No status ──────────────────────────────────────────────────────────
    describe('no status', () => {
      it('returns provisioning when status is entirely absent', () => {
        const cluster = makeCluster({ metadata: BASE_META });

        expect(cluster.stateObj).toStrictEqual({
          name:          'provisioning',
          transitioning: true,
          error:         false,
          message:       undefined,
        });
      });

      it('returns provisioning when status has no phase or conditions', () => {
        const cluster = makeCluster({ metadata: BASE_META, status: {} });

        expect(cluster.stateObj).toStrictEqual({
          name:          'provisioning',
          transitioning: true,
          error:         false,
          message:       undefined,
        });
      });

      it('includes phaseReason in message even when phase is absent', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   { phaseReason: 'Waiting for operator' },
        });

        expect(cluster.stateObj).toStrictEqual({
          name:          'provisioning',
          transitioning: true,
          error:         false,
          message:       'Waiting for operator',
        });
      });
    });

    // ─── Reconciliation annotation (highest priority) ───────────────────────
    describe('reconciliationLoop annotation', () => {
      it('returns suspended when annotation is "disabled"', () => {
        const cluster = makeCluster({
          metadata: {
            ...BASE_META,
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

      it('overrides hibernation when annotation is "disabled"', () => {
        const cluster = makeCluster({
          metadata: {
            ...BASE_META,
            annotations: { 'cnpg.io/reconciliationLoop': 'disabled' },
          },
          status: {
            phase:      'Cluster in healthy state',
            conditions: [{ type: 'cnpg.io/hibernation', status: 'False', message: 'Waking up' }],
          },
        });

        expect(cluster.stateObj.name).toStrictEqual('suspended');
        expect(cluster.stateObj.message).toStrictEqual('Cluster reconciliation is suspended');
      });

      it('does NOT suspend when annotation is "enabled"', () => {
        const cluster = makeCluster({
          metadata: {
            ...BASE_META,
            annotations: { 'cnpg.io/reconciliationLoop': 'enabled' },
          },
          status: { phase: 'Cluster in healthy state' },
        });

        expect(cluster.stateObj.name).toStrictEqual('active');
      });

      it('does NOT suspend when annotation is absent', () => {
        const cluster = makeCluster({
          metadata: { ...BASE_META, annotations: {} },
          status:   { phase: 'Cluster in healthy state' },
        });

        expect(cluster.stateObj.name).toStrictEqual('active');
      });

      it('does NOT suspend when metadata.annotations is undefined', () => {
        const cluster = makeCluster({
          metadata: { ...BASE_META },
          status:   { phase: 'Cluster in healthy state' },
        });

        expect(cluster.stateObj.name).toStrictEqual('active');
      });
    });

    // ─── Hibernation conditions (second priority) ───────────────────────────
    describe('hibernation condition', () => {
      it('returns suspended when hibernation condition status is "True"', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   {
            phase:      'Cluster in healthy state',
            conditions: [{ type: 'cnpg.io/hibernation', status: 'True', message: 'Cluster is hibernating' }],
          },
        });

        expect(cluster.stateObj).toStrictEqual({
          name:          'suspended',
          transitioning: false,
          error:         false,
          message:       'Cluster is hibernating',
        });
      });

      it('returns degraded when hibernation condition status is "False"', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   {
            conditions: [{ type: 'cnpg.io/hibernation', status: 'False', message: 'Waking up' }],
          },
        });

        expect(cluster.stateObj).toStrictEqual({
          name:          'degraded',
          transitioning: false,
          error:         false,
          message:       'Waking up',
        });
      });

      it('uses the hibernation condition message verbatim', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   {
            conditions: [{ type: 'cnpg.io/hibernation', status: 'True', message: 'Custom hibernation reason' }],
          },
        });

        expect(cluster.stateObj.message).toStrictEqual('Custom hibernation reason');
      });

      it('ignores non-hibernation conditions and falls through to phase', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   {
            phase:      'Cluster in healthy state',
            conditions: [{ type: 'Ready', status: 'True', message: 'All good' }],
          },
        });

        expect(cluster.stateObj.name).toStrictEqual('active');
      });

      it('hibernation takes priority over phase even when phase is healthy', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   {
            phase:      'Cluster in healthy state',
            conditions: [{ type: 'cnpg.io/hibernation', status: 'True', message: 'Hibernating' }],
          },
        });

        expect(cluster.stateObj.name).toStrictEqual('suspended');
      });
    });

    // ─── Active phase ────────────────────────────────────────────────────────
    describe('active phase', () => {
      it('returns active for "Cluster in healthy state"', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   { phase: 'Cluster in healthy state' },
        });

        expect(cluster.stateObj).toStrictEqual({
          name:          'active',
          transitioning: false,
          error:         false,
          message:       'Cluster in healthy state',
        });
      });
    });

    // ─── Provisioning phases ─────────────────────────────────────────────────
    describe('provisioning phases (transitioning=true)', () => {
      it.each([
        'Setting up primary',
        'Creating a new replica',
        'Waiting for the instances to become active',
        'Promoting to primary cluster',
      ])('returns provisioning/transitioning=true for "%s"', (phase) => {
        const cluster = makeCluster({ metadata: BASE_META, status: { phase } });

        expect(cluster.stateObj).toStrictEqual({
          name:          'provisioning',
          transitioning: true,
          error:         false,
          message:       phase,
        });
      });
    });

    // ─── Updating phase ──────────────────────────────────────────────────────
    describe('updating phase (transitioning=true)', () => {
      it('returns updating/transitioning=true for "Upgrading cluster"', () => {
        const cluster = makeCluster({ metadata: BASE_META, status: { phase: 'Upgrading cluster' } });

        expect(cluster.stateObj).toStrictEqual({
          name:          'updating',
          transitioning: true,
          error:         false,
          message:       'Upgrading cluster',
        });
      });
    });

    // ─── Degraded phases ─────────────────────────────────────────────────────
    describe('degraded phases (transitioning=false)', () => {
      it.each([
        'Switchover in progress',
        'Failing over',
        'Upgrading Postgres major version',
        'Cluster upgrade delayed',
        'Waiting for user action',
        'Primary instance is being restarted in-place',
        'Primary instance is being restarted without a switchover',
        'Cluster cannot execute instance online upgrade due to missing architecture binary',
        'Online upgrade in progress',
        'Applying configuration',
      ])('returns degraded/transitioning=false for "%s"', (phase) => {
        const cluster = makeCluster({ metadata: BASE_META, status: { phase } });

        expect(cluster.stateObj).toStrictEqual({
          name:          'degraded',
          transitioning: false,
          error:         false,
          message:       phase,
        });
      });
    });

    // ─── Suspended phases ────────────────────────────────────────────────────
    describe('suspended phases (transitioning=false)', () => {
      it.each([
        'Unable to create required cluster objects',
        'Cluster cannot proceed to reconciliation due to an unknown plugin being required',
        'Cluster has incomplete or invalid image catalog',
        'Cluster is unrecoverable and needs manual intervention',
      ])('returns suspended/transitioning=false for "%s"', (phase) => {
        const cluster = makeCluster({ metadata: BASE_META, status: { phase } });

        expect(cluster.stateObj).toStrictEqual({
          name:          'suspended',
          transitioning: false,
          error:         false,
          message:       phase,
        });
      });
    });

    // ─── Unknown phase ───────────────────────────────────────────────────────
    describe('unknown phase', () => {
      it('returns name=unknown and transitioning=false for an unrecognized phase', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   { phase: 'Some future cnpg phase' },
        });

        expect(cluster.stateObj).toStrictEqual({
          name:          'unknown',
          transitioning: false,
          error:         false,
          message:       'Some future cnpg phase',
        });
      });

      it('returns name=unknown even if phaseReason is present', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   { phase: 'Totally new phase', phaseReason: 'Operator v99 feature' },
        });

        expect(cluster.stateObj.name).toStrictEqual('unknown');
      });
    });

    // ─── phaseReason overrides phase in message ──────────────────────────────
    describe('phaseReason as message', () => {
      it('uses phaseReason as message when present instead of phase', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   { phase: 'Cluster in healthy state', phaseReason: 'Primary elected after failover' },
        });

        expect(cluster.stateObj.message).toStrictEqual('Primary elected after failover');
      });

      it('falls back to phase when phaseReason is absent', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   { phase: 'Cluster in healthy state' },
        });

        expect(cluster.stateObj.message).toStrictEqual('Cluster in healthy state');
      });

      it('uses phaseReason for provisioning phases', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   { phase: 'Setting up primary', phaseReason: 'Initializing WAL archive' },
        });

        expect(cluster.stateObj.message).toStrictEqual('Initializing WAL archive');
      });

      it('uses phaseReason for degraded phases', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   { phase: 'Failing over', phaseReason: 'Primary pod killed' },
        });

        expect(cluster.stateObj.message).toStrictEqual('Primary pod killed');
      });

      it('uses phaseReason for suspended phases', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   { phase: 'Cluster is unrecoverable and needs manual intervention', phaseReason: 'Corrupted pg_wal' },
        });

        expect(cluster.stateObj.message).toStrictEqual('Corrupted pg_wal');
      });
    });

    // ─── error flag ─────────────────────────────────────────────────────────
    describe('error flag', () => {
      it('is always false — even for suspended/degraded states', () => {
        const suspended = makeCluster({
          metadata: BASE_META,
          status:   { phase: 'Cluster is unrecoverable and needs manual intervention' },
        });
        const degraded = makeCluster({
          metadata: BASE_META,
          status:   { phase: 'Failing over' },
        });

        expect(suspended.stateObj.error).toStrictEqual(false);
        expect(degraded.stateObj.error).toStrictEqual(false);
      });
    });

    // ─── Priority chain integration ──────────────────────────────────────────
    describe('priority chain: annotation > hibernation > phase > no-status', () => {
      it('annotation wins over all: suspended despite healthy phase and no-hibernation', () => {
        const cluster = makeCluster({
          metadata: {
            ...BASE_META,
            annotations: { 'cnpg.io/reconciliationLoop': 'disabled' },
          },
          status: {
            phase:      'Cluster in healthy state',
            conditions: [{ type: 'cnpg.io/hibernation', status: 'False', message: 'Resuming' }],
          },
        });

        expect(cluster.stateObj.name).toStrictEqual('suspended');
        expect(cluster.stateObj.message).toStrictEqual('Cluster reconciliation is suspended');
      });

      it('hibernation wins over phase when annotation is absent', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   {
            phase:      'Cluster in healthy state',
            conditions: [{ type: 'cnpg.io/hibernation', status: 'True', message: 'Hibernating' }],
          },
        });

        expect(cluster.stateObj.name).toStrictEqual('suspended');
      });

      it('phase wins over no-status when no annotation or hibernation', () => {
        const cluster = makeCluster({
          metadata: BASE_META,
          status:   { phase: 'Setting up primary' },
        });

        expect(cluster.stateObj.name).toStrictEqual('provisioning');
      });

      it('no-status is the last resort when phase, annotation, and conditions are all absent', () => {
        const cluster = makeCluster({ metadata: BASE_META, status: { conditions: [] } });

        expect(cluster.stateObj.name).toStrictEqual('provisioning');
        expect(cluster.stateObj.transitioning).toStrictEqual(true);
      });
    });
  });
});
