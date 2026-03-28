import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import {
  Report,
  ClusterReport,
  ReportSummary,
} from '../../types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

export interface StateConfig {
  loadingReports: boolean;
  reports: Report[];
  clusterReports: ClusterReport[];
  reportMap: Record<string, Report | ClusterReport>;
  summaryMap: Record<string, ReportSummary>;
}

const reportStoreFactory = (config: StateConfig): CoreStoreSpecifics => {
  return {
    state: (): StateConfig => {
      return {
        loadingReports: config.loadingReports,
        reports:        config.reports,
        clusterReports: config.clusterReports,
        reportMap:      config.reportMap,
        summaryMap:     config.summaryMap,
      };
    },

    getters:   { ...getters },
    mutations: { ...mutations },
    actions:   { ...actions },
  };
};

const config: CoreStoreConfig = { namespace: 'openReport' };

export default {
  specifics: reportStoreFactory({
    loadingReports: false,
    reports:        [],
    clusterReports: [],
    reportMap:      {},
    summaryMap:     {},
  }),
  config
};
