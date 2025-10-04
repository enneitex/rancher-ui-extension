import {
  ClusterPolicyReport,
  PolicyReport,
  PolicyReportSummary
} from '../../types';
import { StateConfig } from './index';

type ReportKeys = 'policyReports' | 'clusterPolicyReports';

export default {
  /**
   * Updates loading state of Policy Reports
   * @param state
   * @param val `boolean`
   */
  updateLoadingReports(state: StateConfig, val: boolean) {
    state.loadingReports = val;
  },

  /**
   * Updates/Adds Policy Reports to state
   * @param state
   * @param updatedReports `PolicyReport[] | ClusterPolicyReport[]`
   */
  updateReportsBatch<T extends PolicyReport | ClusterPolicyReport>(
    state: StateConfig,
    { reportArrayKey, updatedReports }: { reportArrayKey: ReportKeys, updatedReports: T[] }
  ): void {
    const reportArray = state[reportArrayKey] as Array<T>;

    // Convert array to a Map for O(1) lookups
    const reportMap = new Map(reportArray.map((report) => {
      const resourceId = report.scope?.namespace ? `${ report.scope.namespace }/${ report.scope.name }` : report.scope?.name || report.id;

      return [resourceId, report];
    }));

    updatedReports.forEach((updatedReport) => {
      const updatedId = updatedReport.scope?.namespace ? `${ updatedReport.scope.namespace }/${ updatedReport.scope.name }` : updatedReport.scope?.name || updatedReport.id;

      if (reportMap.has(updatedId)) {
        // Directly update the object reference
        Object.assign(reportMap.get(updatedId)!, {
          results: updatedReport.results,
          summary: updatedReport.summary,
        });
      } else {
        reportArray.push(updatedReport);
        reportMap.set(updatedId, updatedReport); // Keep map in sync
      }
    });

    state.reportMap = {
      ...state.reportMap,
      ...Object.fromEntries(reportMap)
    };
  },

  /**
   * Updates/Adds Policy Report summaries to state
   * @param state
   * @param newSummary `Record<string, PolicyReportSummary>`
   */
  setSummaryMap(state: StateConfig, newSummary: Record<string, PolicyReportSummary>) {
    state.summaryMap = {
      ...state.summaryMap,
      ...newSummary
    };
  },

  /**
   * Searches and then removes a report by id from the store
   * @param state
   * @param reportId
   */
  removePolicyReportById(state: StateConfig, reportId: string) {
    const idx = state.policyReports.findIndex((report) => report.id === reportId);

    if (idx !== -1) {
      state.policyReports.splice(idx, 1);
    }
  },
};
