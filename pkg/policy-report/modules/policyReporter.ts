import { toRaw } from 'vue';
import { Store } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import { NAMESPACE } from '@shell/config/types';
import {
  Severity, Result, PolicyReport, ClusterPolicyReport, PolicyReportResult, PolicyReportSummary, WG_POLICY_K8S
} from '../types';

interface CacheEntry<T> {
  promise: Promise<T>;
  timestamp: number;
}

const reportCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CHUNK_SIZE = 1000;

export function __clearReportCache() {
  reportCache.clear();
}

/**
 * Fetches either PolicyReports or ClusterPolicyReports based on version compatibility and dispatches update actions.
 * @param store
 * @param isClusterLevel
 * @param resourceType
 * @returns `PolicyReport[] | ClusterPolicyReport[] | void`
 */
export async function getReports<T extends PolicyReport | ClusterPolicyReport>(
  store: Store<any>,
  isClusterLevel: boolean = false,
  resourceType?: string
): Promise<T[] | void> {
  const now = Date.now();
  const reportTypes: string[] = [];

  if (isClusterLevel) {
    reportTypes.push(WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE);
  }

  if (resourceType || !isClusterLevel) {
    reportTypes.push(WG_POLICY_K8S.POLICY_REPORT.TYPE);
  }

  // Map over the report types to get (or create) the promise for each
  const fetchPromises = reportTypes.map((reportType) => {
    const cachedEntry = reportCache.get(reportType);

    if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL) {
      return cachedEntry.promise;
    }

    const promise = (async() => {
      const schema = store.getters['cluster/schemaFor'](reportType);

      if (!schema) {
        return [];
      }

      let reports = toRaw(store.getters['cluster/all'](reportType));

      if (isEmpty(reports)) {
        reports = toRaw(await store.dispatch('cluster/findAll', { type: reportType }, { root: true }));
      }

      if (!isEmpty(reports)) {
        // Cache the reports right away so subsequent calls don't trigger a new fetch
        // (even though the store will eventually be updated asynchronously).
        const updateAction = reportType === WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE ? 'policyReport/updateClusterPolicyReports' : 'policyReport/updatePolicyReports';

        await processReportsInBatches(store, reports, updateAction);
      }

      return reports;
    })();

    // Save the pending promise in the cache.
    reportCache.set(reportType, {
      promise,
      timestamp: now
    });

    return promise;
  });

  const results = await Promise.all(fetchPromises);

  // Now that all chunked updates are done, regenerate the summary map *once*
  await store.dispatch('policyReport/regenerateSummaryMap');

  return results.flat();
}

/**
 * Processes reports in batches to prevent UI blocking
 */
async function processReportsInBatches(
  store: Store<any>,
  reports: Array<PolicyReport | ClusterPolicyReport>,
  action: string
): Promise<void> {
  const totalReports = reports.length;

  return new Promise((resolve) => {
    let index = 0;

    const processBatch = () => {
      const batch = reports.slice(index, index + CHUNK_SIZE);

      index += CHUNK_SIZE;

      if (batch.length > 0) {
        try {
          store.dispatch(action, batch);
        } catch (error) {
          console.error(`Failed to dispatch ${ action }:`, error);
        }
      }

      if (index < totalReports) {
        if ('requestIdleCallback' in window) {
          // requestIdleCallback() ensures work is done when the browser is idle
          requestIdleCallback(processBatch);
        } else {
          // defers execution, but does not account for UI responsiveness.
          setTimeout(processBatch, 0);
        }
      } else {
        resolve();
      }
    };

    processBatch();
  });
}

/**
 * Generates a map of { [resourceId]: PolicyReportSummary } for all PolicyReports
 * and ClusterPolicyReports currently in the store.
 */
export function generateSummaryMap(storeState: any): Record<string, PolicyReportSummary> {
  const summaryMap: Record<string, PolicyReportSummary> = {};

  function processReport(report: PolicyReport | ClusterPolicyReport) {
    // Determine resource ID
    let resourceId: string | undefined;

    if (report.scope) {
      resourceId = report.scope.namespace ? `${ report.scope.namespace }/${ report.scope.name }` : report.scope.name;
    }

    if (!resourceId) {
      return;
    }

    if (!summaryMap[resourceId]) {
      summaryMap[resourceId] = {
        pass:  0,
        fail:  0,
        warn:  0,
        error: 0,
        skip:  0
      };
    }

    report.results?.forEach((r) => {
      const key = r.result?.toLowerCase() as keyof PolicyReportSummary;

      if (key && resourceId && summaryMap[resourceId] && summaryMap[resourceId][key] !== undefined) {
        summaryMap[resourceId][key]! += 1;
      }
    });
  }

  // Process clusterPolicyReports
  storeState.clusterPolicyReports.forEach(processReport);

  // Process policyReports
  storeState.policyReports.forEach(processReport);

  return summaryMap;
}

/**
 * Determines if a resource is namespaced based on its metadata
 * @param resource
 * @returns boolean
 */
export function isResourceNamespaced(resource: any): boolean {
  return !!resource?.metadata?.namespace;
}

/**
 * Filters PolicyReports for namespaced resources or the Namespace resource type
 * @param store
 * @param resource
 * @returns `PolicyReport | PolicyReportResult[] | null | void`
 */
export async function getFilteredReport(store: Store<any>, resource: any): Promise<PolicyReport | ClusterPolicyReport | null> {
  const schema = store.getters['cluster/schemaFor'](resource?.type);

  if (schema) {
    try {
      // Determine if we need to fetch cluster level reports or resource-specific reports
      const isClusterLevel = resource?.type === NAMESPACE || !isResourceNamespaced(resource);
      const resourceType = resource?.type;

      // Fetch the appropriate reports based on the resource context
      const reports = await getReports(store, isClusterLevel, resourceType);

      if (reports && !isEmpty(reports)) {
        // Filter and return the applicable report
        const filteredReport = store.getters['policyReport/reportByResourceId'](resource.id) || null;

        return filteredReport;
      }
    } catch (e) {
      console.warn(`Error fetching PolicyReports: ${ e }`);
    }
  }

  return null;
}

/**
 * Determines color for PolicyReport status
 * @param result | PolicyReport summary result || report resource.result
 * @returns string
 */
export function colorForResult(result: Result): string {
  switch (result) {
  case Result.FAIL:
    return 'text-error';
  case Result.ERROR:
    return 'sizzle-warning';
  case Result.PASS:
    return 'text-success';
  case Result.WARN:
    return 'text-warning';
  case Result.SKIP:
    return 'text-darker';
  default:
    return 'text-muted';
  }
}

/**
 * Determines color for PolicyReport severity
 * @param severity | PolicyReport severity
 * @returns string
 */
export function colorForSeverity(severity: Severity): string {
  switch (severity) {
  case Severity.INFO:
    return 'bg-info';
  case Severity.LOW:
    return 'bg-warning';
  case Severity.MEDIUM:
    return 'bg-warning';
  case Severity.HIGH:
    return 'bg-warning';
  case Severity.CRITICAL:
    return 'bg-error';
  default:
    return 'bg-muted';
  }
}

/**
 * Returns a numeric value for sorting severities in order of importance
 * @param severity | PolicyReport severity (can be undefined)
 * @returns number for sorting (lower = more severe)
 */
export function severitySortValue(severity: Severity | undefined): number {
  if (!severity) {
    return 999;
  }

  const normalizedSeverity = severity.toLowerCase();

  switch (normalizedSeverity) {
  case 'critical':
    return 1;
  case 'high':
    return 2;
  case 'medium':
    return 3;
  case 'low':
    return 4;
  case 'info':
    return 5;
  default:
    return 999; // unknown severities go last
  }
}
