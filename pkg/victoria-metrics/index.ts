import { importTypes } from '@rancher/auto-import';
import { IPlugin, TabLocation } from '@shell/core/types';
import { POD, NODE, WORKLOAD_TYPES } from '@shell/config/types';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Register Victoria Metrics tab for Pod resources
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    {
      resource: [POD]
    },
    {
      name: 'victoria-metrics-pod-tab',
      labelKey: 'victoriaMetrics.title',
      weight: -4, // Position after standard Metrics tab
      showHeader: true,
      component: () => import('./components/tabs/VictoriaMetricsPodTab.vue')
    }
  );

  // Register Victoria Metrics tab for Node resources
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    {
      resource: [NODE]
    },
    {
      name: 'victoria-metrics-node-tab',
      labelKey: 'victoriaMetrics.title',
      weight: -4,
      showHeader: true,
      component: () => import('./components/tabs/VictoriaMetricsNodeTab.vue')
    }
  );

  // Register Victoria Metrics tab for Workload resources
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    {
      resource: [
        WORKLOAD_TYPES.DEPLOYMENT,
        WORKLOAD_TYPES.DAEMON_SET, 
        WORKLOAD_TYPES.STATEFUL_SET,
        WORKLOAD_TYPES.REPLICA_SET,
        WORKLOAD_TYPES.JOB,
        WORKLOAD_TYPES.CRON_JOB
      ]
    },
    {
      name: 'victoria-metrics-workload-tab',
      labelKey: 'victoriaMetrics.title',
      weight: -4,
      showHeader: true,
      component: () => import('./components/tabs/VictoriaMetricsWorkloadTab.vue')
    }
  );

  console.log('Victoria Metrics extension loaded successfully');
}
