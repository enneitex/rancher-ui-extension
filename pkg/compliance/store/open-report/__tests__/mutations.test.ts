import mutations from '../mutations';
import { Report, ReportSummary, ClusterReport } from '../../../types';

interface StateConfig {
  loadingReports: boolean;
  reports: Report[];
  clusterReports: ClusterReport[];
  reportMap: Record<string, Report | ClusterReport>;
  summaryMap: Record<string, ReportSummary>;
}

const makeState = (): StateConfig => ({
  loadingReports: false,
  reports:        [],
  clusterReports: [],
  reportMap:      {},
  summaryMap:     {},
});

const makeReport = (overrides: Partial<Report> = {}): Report => ({
  id:         'report-1',
  apiVersion: 'v1',
  kind:       'PolicyReport',
  metadata:   { name: 'report-1' },
  type:       'wgpolicyk8s.io.policyreport',
  uid:        'uid-1',
  results:    [],
  summary:    { pass: 0, fail: 0, warn: 0, error: 0, skip: 0 },
  ...overrides,
});

describe('open-report: mutations', () => {
  describe('updateLoadingReports', () => {
    it('should set loading to true', () => {
      const state = makeState();
      mutations.updateLoadingReports(state, true);
      expect(state.loadingReports).toStrictEqual(true);
    });

    it('should set loading to false', () => {
      const state = makeState();
      state.loadingReports = true;
      mutations.updateLoadingReports(state, false);
      expect(state.loadingReports).toStrictEqual(false);
    });
  });

  describe('updateReportsBatch', () => {
    it('should add a report with namespace/name scope key', () => {
      const state = makeState();
      const report = makeReport({ scope: { namespace: 'default', name: 'my-pod', apiVersion: 'v1', kind: 'Pod', resourceVersion: '1', uid: 'u1' } });

      mutations.updateReportsBatch(state, { reportArrayKey: 'reports', updatedReports: [report] });

      expect(state.reports).toHaveLength(1);
      expect(state.reportMap['default/my-pod']).toBe(state.reports[0]);
    });

    it('should add a report with name-only scope key', () => {
      const state = makeState();
      const report = makeReport({ scope: { name: 'my-node', apiVersion: 'v1', kind: 'Node', resourceVersion: '1', uid: 'u2' } });

      mutations.updateReportsBatch(state, { reportArrayKey: 'reports', updatedReports: [report] });

      expect(state.reports).toHaveLength(1);
      expect(state.reportMap['my-node']).toBe(state.reports[0]);
    });

    it('should add a report with id fallback when scope is absent', () => {
      const state = makeState();
      const report = makeReport({ id: 'report-id-fallback', scope: undefined });

      mutations.updateReportsBatch(state, { reportArrayKey: 'reports', updatedReports: [report] });

      expect(state.reports).toHaveLength(1);
      expect(state.reportMap['report-id-fallback']).toBe(state.reports[0]);
    });

    it('should update an existing report in-place without growing the array', () => {
      const state = makeState();
      const scope = { namespace: 'default', name: 'my-pod', apiVersion: 'v1', kind: 'Pod', resourceVersion: '1', uid: 'u1' };
      const original = makeReport({ scope, results: [] });
      state.reports.push(original);

      const updated = makeReport({ scope, results: [{ result: 'pass' as any, policy: 'p1' }] });
      mutations.updateReportsBatch(state, { reportArrayKey: 'reports', updatedReports: [updated] });

      expect(state.reports).toHaveLength(1);
      expect(state.reports[0].results).toHaveLength(1);
    });

    it('should insert a new report when id is not already in state', () => {
      const state = makeState();
      const existing = makeReport({ id: 'r1', scope: { namespace: 'default', name: 'pod-a', apiVersion: 'v1', kind: 'Pod', resourceVersion: '1', uid: 'u1' } });
      state.reports.push(existing);

      const newReport = makeReport({ id: 'r2', scope: { namespace: 'default', name: 'pod-b', apiVersion: 'v1', kind: 'Pod', resourceVersion: '1', uid: 'u2' } });
      mutations.updateReportsBatch(state, { reportArrayKey: 'reports', updatedReports: [newReport] });

      expect(state.reports).toHaveLength(2);
    });

    it('should sync reportMap after the batch', () => {
      const state = makeState();
      const r1 = makeReport({ id: 'r1', scope: { namespace: 'ns', name: 'a', apiVersion: 'v1', kind: 'Pod', resourceVersion: '1', uid: 'u1' } });
      const r2 = makeReport({ id: 'r2', scope: { namespace: 'ns', name: 'b', apiVersion: 'v1', kind: 'Pod', resourceVersion: '1', uid: 'u2' } });

      mutations.updateReportsBatch(state, { reportArrayKey: 'reports', updatedReports: [r1, r2] });

      expect(Object.keys(state.reportMap)).toHaveLength(2);
      expect(state.reportMap['ns/a']).toBeDefined();
      expect(state.reportMap['ns/b']).toBeDefined();
    });
  });

  describe('removeReportById', () => {
    it('should remove the report from the reports array', () => {
      const state = makeState();
      const report = makeReport({ id: 'to-remove', scope: { namespace: 'ns', name: 'pod', apiVersion: 'v1', kind: 'Pod', resourceVersion: '1', uid: 'u1' } });
      state.reports.push(report);

      mutations.removeReportById(state, 'to-remove');

      expect(state.reports).toHaveLength(0);
    });

    it('should remove the derived scope key from reportMap (namespace+name)', () => {
      const state = makeState();
      const scope = { namespace: 'ns', name: 'pod', apiVersion: 'v1', kind: 'Pod', resourceVersion: '1', uid: 'u1' };
      const report = makeReport({ id: 'r1', scope });
      state.reports.push(report);
      state.reportMap['ns/pod'] = report;

      mutations.removeReportById(state, 'r1');

      expect(state.reportMap['ns/pod']).toBeUndefined();
    });

    it('should remove the name-only scope key from reportMap', () => {
      const state = makeState();
      const scope = { name: 'my-node', apiVersion: 'v1', kind: 'Node', resourceVersion: '1', uid: 'u2' };
      const report = makeReport({ id: 'r2', scope });
      state.reports.push(report);
      state.reportMap['my-node'] = report;

      mutations.removeReportById(state, 'r2');

      expect(state.reportMap['my-node']).toBeUndefined();
    });

    it('should remove the id-fallback key from reportMap when scope is absent', () => {
      const state = makeState();
      const report = makeReport({ id: 'fallback-id', scope: undefined });
      state.reports.push(report);
      state.reportMap['fallback-id'] = report;

      mutations.removeReportById(state, 'fallback-id');

      expect(state.reportMap['fallback-id']).toBeUndefined();
    });

    it('should be a no-op when the id is not found', () => {
      const state = makeState();
      const report = makeReport({ id: 'other' });
      state.reports.push(report);

      mutations.removeReportById(state, 'nonexistent');

      expect(state.reports).toHaveLength(1);
    });
  });
});
