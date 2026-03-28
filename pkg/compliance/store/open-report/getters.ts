import {
  Report,
  ClusterReport,
  ReportSummary,
} from '../../types';
import { StateConfig } from './index';

export default {
  loadingReports:  (state: StateConfig): boolean => state.loadingReports,
  reports:         (state: StateConfig): Report[] => state.reports,
  clusterReports:  (state: StateConfig): ClusterReport[] => state.clusterReports,

  reportByResourceId:  (state: StateConfig) => (resourceId: string): Report | ClusterReport => {
    return state.reportMap[resourceId];
  },

  summaryByResourceId: (state: StateConfig) => (resourceId: string): ReportSummary => {
    return state.summaryMap[resourceId] || {
      pass:  0,
      fail:  0,
      warn:  0,
      error: 0,
      skip:  0
    };
  },
};
