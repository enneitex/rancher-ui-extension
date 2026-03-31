import {
  generateSummaryMap,
  colorForResult,
  colorForSeverity,
  severitySortValue,
  isResourceNamespaced,
  __clearReportCache,
} from '../openReports';
import { Result, Severity } from '../../types';

describe('openReports', () => {
  describe('generateSummaryMap', () => {
    it('should count results for a namespace/name scoped report', () => {
      const state = {
        reports: [
          {
            id:      'r1',
            scope:   { namespace: 'default', name: 'my-pod', apiVersion: 'v1', kind: 'Pod', resourceVersion: '1', uid: 'u1' },
            results: [
              { result: Result.PASS, policy: 'p1' },
              { result: Result.FAIL, policy: 'p2' },
              { result: Result.WARN, policy: 'p3' },
            ],
          },
        ],
        clusterReports: [],
      };

      const map = generateSummaryMap(state);

      expect(map['default/my-pod']).toStrictEqual({ pass: 1, fail: 1, warn: 1, error: 0, skip: 0 });
    });

    it('should count results for a name-only scoped report', () => {
      const state = {
        reports: [
          {
            id:      'r2',
            scope:   { name: 'my-node', apiVersion: 'v1', kind: 'Node', resourceVersion: '1', uid: 'u2' },
            results: [{ result: Result.PASS, policy: 'p1' }],
          },
        ],
        clusterReports: [],
      };

      const map = generateSummaryMap(state);

      expect(map['my-node']).toStrictEqual({ pass: 1, fail: 0, warn: 0, error: 0, skip: 0 });
    });

    it('should return no summaryMap entry for a report with no scope (id-keyed — 2-tier vs 3-tier divergence)', () => {
      const state = {
        reports: [
          {
            id:      'report-id-1',
            results: [{ result: Result.PASS, policy: 'p1' }],
          },
        ],
        clusterReports: [],
      };

      const map = generateSummaryMap(state);

      // generateSummaryMap skips reports without scope — mutations.updateReportsBatch uses id fallback
      expect(Object.keys(map)).toHaveLength(0);
    });

    it('should silently drop an unknown result type', () => {
      const state = {
        reports: [
          {
            id:      'r3',
            scope:   { namespace: 'ns', name: 'pod', apiVersion: 'v1', kind: 'Pod', resourceVersion: '1', uid: 'u3' },
            results: [
              { result: 'exempted' as any, policy: 'p1' },
              { result: Result.PASS, policy: 'p2' },
            ],
          },
        ],
        clusterReports: [],
      };

      const map = generateSummaryMap(state);

      expect(map['ns/pod']).toStrictEqual({ pass: 1, fail: 0, warn: 0, error: 0, skip: 0 });
    });

    it('should accumulate results across multiple reports for the same resource', () => {
      const scope = { namespace: 'default', name: 'my-pod', apiVersion: 'v1', kind: 'Pod', resourceVersion: '1', uid: 'u' };
      const state = {
        reports: [
          { id: 'r1', scope, results: [{ result: Result.PASS, policy: 'p1' }] },
          { id: 'r2', scope, results: [{ result: Result.FAIL, policy: 'p2' }, { result: Result.FAIL, policy: 'p3' }] },
        ],
        clusterReports: [],
      };

      const map = generateSummaryMap(state);

      expect(map['default/my-pod']).toStrictEqual({ pass: 1, fail: 2, warn: 0, error: 0, skip: 0 });
    });

    it('should accumulate results from clusterReports', () => {
      const state = {
        reports: [],
        clusterReports: [
          {
            id:      'cr1',
            scope:   { name: 'my-namespace', apiVersion: 'v1', kind: 'Namespace', resourceVersion: '1', uid: 'u1' },
            results: [{ result: Result.FAIL, policy: 'p1' }, { result: Result.FAIL, policy: 'p2' }],
          },
        ],
      };

      const map = generateSummaryMap(state);

      expect(map['my-namespace']).toStrictEqual({ pass: 0, fail: 2, warn: 0, error: 0, skip: 0 });
    });

    it('should return an empty map for an empty state', () => {
      const map = generateSummaryMap({ reports: [], clusterReports: [] });

      expect(map).toStrictEqual({});
    });
  });

  describe('colorForResult', () => {
    it.each([
      [Result.PASS,  'text-success'],
      [Result.FAIL,  'text-error'],
      [Result.WARN,  'text-warning'],
      [Result.ERROR, 'sizzle-warning'],
      [Result.SKIP,  'text-darker'],
    ])('should return correct color for %s', (result, expected) => {
      expect(colorForResult(result)).toStrictEqual(expected);
    });

    it('should return text-muted for undefined', () => {
      expect(colorForResult(undefined as any)).toStrictEqual('text-muted');
    });
  });

  describe('colorForSeverity', () => {
    it.each([
      [Severity.INFO,     'bg-info'],
      [Severity.LOW,      'bg-warning'],
      [Severity.MEDIUM,   'bg-warning'],
      [Severity.HIGH,     'bg-error'],
      [Severity.CRITICAL, 'bg-error'],
    ])('should return correct color for %s', (severity, expected) => {
      expect(colorForSeverity(severity)).toStrictEqual(expected);
    });

    it('should return bg-muted for undefined', () => {
      expect(colorForSeverity(undefined as any)).toStrictEqual('bg-muted');
    });
  });

  describe('severitySortValue', () => {
    it.each([
      [Severity.CRITICAL, 1],
      [Severity.HIGH,     2],
      [Severity.MEDIUM,   3],
      [Severity.LOW,      4],
      [Severity.INFO,     5],
    ])('should return %i for %s', (severity, expected) => {
      expect(severitySortValue(severity)).toStrictEqual(expected);
    });

    it('should return 999 for undefined', () => {
      expect(severitySortValue(undefined)).toStrictEqual(999);
    });

    it('should return 999 for an unknown string', () => {
      expect(severitySortValue('extreme' as any)).toStrictEqual(999);
    });

    it('should normalize case before matching (CRITICAL → 1)', () => {
      expect(severitySortValue('CRITICAL' as any)).toStrictEqual(1);
      expect(severitySortValue('High' as any)).toStrictEqual(2);
    });
  });

  describe('isResourceNamespaced', () => {
    it('should return true when metadata.namespace is present', () => {
      expect(isResourceNamespaced({ metadata: { namespace: 'default' } })).toStrictEqual(true);
    });

    it('should return false when metadata.namespace is absent', () => {
      expect(isResourceNamespaced({ metadata: {} })).toStrictEqual(false);
    });

    it('should return false for null resource', () => {
      expect(isResourceNamespaced(null)).toStrictEqual(false);
    });

    it('should return false for undefined resource', () => {
      expect(isResourceNamespaced(undefined)).toStrictEqual(false);
    });
  });

  describe('__clearReportCache', () => {
    it('should clear the module-level cache so the next getReports call re-fetches', () => {
      // Clearing twice must not throw
      __clearReportCache();
      __clearReportCache();
    });
  });
});
