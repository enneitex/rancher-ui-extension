import {
  Report,
  ClusterReport,
  ReportSummary
} from '../../types';
import { generateSummaryMap } from '../../modules/openReports';

export default {
  updateLoadingReports({ commit }: any, val: boolean) {
    commit('updateLoadingReports', val);
  },

  updateReports({ commit }: any, updatedReports: Report[]) {
    commit('updateReportsBatch', {
      reportArrayKey: 'reports',
      updatedReports
    });
  },

  updateClusterReports({ commit }: any, updatedReports: ClusterReport[]) {
    commit('updateReportsBatch', {
      reportArrayKey: 'clusterReports',
      updatedReports
    });
  },

  async regenerateSummaryMap({ state, commit }: any) {
    const newSummary: Record<string, ReportSummary> = generateSummaryMap(state);

    commit('setSummaryMap', newSummary);
  },
};
