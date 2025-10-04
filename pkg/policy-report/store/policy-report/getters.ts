import {
  PolicyReport,
  ClusterPolicyReport,
  PolicyReportSummary,
} from '../../types';
import { StateConfig } from './index';

export default {
  loadingReports:      (state: StateConfig): boolean => state.loadingReports,
  policyReports:       (state: StateConfig): PolicyReport[] => state.policyReports,
  clusterPolicyReports: (state: StateConfig): ClusterPolicyReport[] => state.clusterPolicyReports,

  reportByResourceId:  (state: StateConfig) => (resourceId: string): PolicyReport | ClusterPolicyReport => {
    return state.reportMap[resourceId];
  },

  summaryByResourceId: (state: StateConfig) => (resourceId: string): PolicyReportSummary => {
    return state.summaryMap[resourceId] || {
      pass:  0,
      fail:  0,
      warn:  0,
      error: 0,
      skip:  0
    };
  },
};
