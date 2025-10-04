import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';

import {
  PolicyReport,
  ClusterPolicyReport,
  PolicyReportSummary,
} from '../../types';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

export interface StateConfig {
  loadingReports: boolean;
  policyReports: PolicyReport[];
  clusterPolicyReports: ClusterPolicyReport[];
  reportMap: Record<string, PolicyReport | ClusterPolicyReport>;
  summaryMap: Record<string, PolicyReportSummary>;
}

const policyReportFactory = (config: StateConfig): CoreStoreSpecifics => {
  return {
    state: (): StateConfig => {
      return {
        loadingReports:       config.loadingReports,
        policyReports:        config.policyReports,
        clusterPolicyReports: config.clusterPolicyReports,
        reportMap:            config.reportMap,
        summaryMap:           config.summaryMap,
      };
    },

    getters:   { ...getters },
    mutations: { ...mutations },
    actions:   { ...actions },
  };
};

const config: CoreStoreConfig = { namespace: 'policyReport' };

export default {
  specifics: policyReportFactory({
    loadingReports:       false,
    policyReports:        [],
    clusterPolicyReports: [],
    reportMap:            {},
    summaryMap:           {},
  }),
  config
};
