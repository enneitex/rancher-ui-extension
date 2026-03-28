import {
  PolicyReport,
  ClusterPolicyReport,
  PolicyReportSummary
} from '../../types';
import { generateSummaryMap } from '../../modules/policyReporter';

export default {
  // Policy and Cluster Policy Reports
  updateLoadingReports({ commit }: any, val: boolean) {
    commit('updateLoadingReports', val);
  },

  updatePolicyReports({ commit }: any, updatedReports: PolicyReport[]) {
    commit('updateReportsBatch', {
      reportArrayKey: 'policyReports',
      updatedReports
    });
  },

  updateClusterPolicyReports({ commit }: any, updatedReports: ClusterPolicyReport[]) {
    commit('updateReportsBatch', {
      reportArrayKey: 'clusterPolicyReports',
      updatedReports
    });
  },

  async regenerateSummaryMap({ state, commit }: any) {
    const newSummary: Record<string, PolicyReportSummary> = generateSummaryMap(state);

    commit('setSummaryMap', newSummary);
  },
};
