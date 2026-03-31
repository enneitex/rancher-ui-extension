import { importTypes } from '@rancher/auto-import';
import { IPlugin, TabLocation } from '@shell/core/types';
import { POD, NODE, WORKLOAD_TYPES } from '@shell/config/types';
import routes from './routing/routes';

export default function(plugin: IPlugin): void {
  importTypes(plugin);

  plugin.metadata = require('./package.json');

  plugin.addProduct(require('./product'));

  plugin.addRoutes(routes);

  const vmTab = () => import('./components/tabs/VictoriaMetricsTab.vue');
  const tabConfig = { labelKey: 'victoriaMetrics.tab', weight: -4, showHeader: false, component: vmTab };

  plugin.addTab(TabLocation.RESOURCE_DETAIL, { resource: [POD] },  { name: 'victoria-metrics-pod-tab',      ...tabConfig });
  plugin.addTab(TabLocation.RESOURCE_DETAIL, { resource: [NODE] }, { name: 'victoria-metrics-node-tab',     ...tabConfig });
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    {
      resource: [
        WORKLOAD_TYPES.DEPLOYMENT,
        WORKLOAD_TYPES.DAEMON_SET,
        WORKLOAD_TYPES.STATEFUL_SET,
        WORKLOAD_TYPES.REPLICA_SET,
        WORKLOAD_TYPES.JOB,
        WORKLOAD_TYPES.CRON_JOB,
      ],
    },
    { name: 'victoria-metrics-workload-tab', ...tabConfig }
  );
}
