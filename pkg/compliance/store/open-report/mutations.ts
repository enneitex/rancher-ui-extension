import {
  ClusterReport,
  Report,
  ReportSummary
} from '../../types';
import { StateConfig } from './index';

type ReportKeys = 'reports' | 'clusterReports';

export default {
  /**
   * Updates loading state of Reports
   * @param state
   * @param val `boolean`
   */
  updateLoadingReports(state: StateConfig, val: boolean) {
    state.loadingReports = val;
  },

  /**
   * Updates/Adds Reports to state
   * @param state
   * @param updatedReports `Report[] | ClusterReport[]`
   */
  updateReportsBatch<T extends Report | ClusterReport>(
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
   * Updates/Adds Report summaries to state
   * @param state
   * @param newSummary `Record<string, ReportSummary>`
   */
  setSummaryMap(state: StateConfig, newSummary: Record<string, ReportSummary>) {
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
  removeReportById(state: StateConfig, reportId: string) {
    const idx = state.reports.findIndex((report) => report.id === reportId);

    if (idx !== -1) {
      const report = state.reports[idx];
      const key = report.scope?.namespace
        ? `${ report.scope.namespace }/${ report.scope.name }`
        : report.scope?.name || report.id;

      state.reports.splice(idx, 1);
      delete state.reportMap[key];
    }
  },
};
