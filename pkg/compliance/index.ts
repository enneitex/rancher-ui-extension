import { importTypes } from '@rancher/auto-import';
import {
  IPlugin, TableColumnLocation, TabLocation, PanelLocation, HeaderOptions
} from '@shell/core/types';
import {
  POD, WORKLOAD_TYPES
} from '@shell/config/types';

import openReportStore from './store/open-report';

// Extend HeaderOptions to include tooltip property
// This property exists in Rancher's table-headers.js but is missing from the TypeScript interface
interface ExtendedHeaderOptions extends HeaderOptions {
  tooltip?: string;
}

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Add Vuex store
  plugin.addDashboardStore(openReportStore.config.namespace, openReportStore.specifics, openReportStore.config);

  // Load Compliance product configuration
  plugin.addProduct(require('./product'));

  // Ensure that Kyverno CRD lists use server-side pagination
  plugin.enableServerSidePagination?.({
    cluster: {
      resources: {
        enableSome: {
          enabled: ['kyverno.io.clusterpolicy', 'kyverno.io.policy'],
        }
      }
    }
  });

  /** Panels */
  plugin.addPanel(
    PanelLocation.RESOURCE_LIST,
    {
      resource: [
        POD,
        WORKLOAD_TYPES.CRON_JOB,
        WORKLOAD_TYPES.DAEMON_SET,
        WORKLOAD_TYPES.DEPLOYMENT,
        WORKLOAD_TYPES.JOB,
        WORKLOAD_TYPES.STATEFUL_SET
      ]
    },
    { component: () => import('./components/OpenReport/ReporterPanel.vue') }
  );

  /** Columns */
  // Policy Reports for namespaced resources
  // Only show in list views, not in detail views (to avoid column duplication in the Compliance tab)
  plugin.addTableColumn(
    TableColumnLocation.RESOURCE,
    {
      resource: [
        POD,
        WORKLOAD_TYPES.CRON_JOB,
        WORKLOAD_TYPES.DAEMON_SET,
        WORKLOAD_TYPES.DEPLOYMENT,
        WORKLOAD_TYPES.JOB,
        WORKLOAD_TYPES.STATEFUL_SET
      ],
      mode: [
        'list' // Only show in list views, not in detail views
      ]
    },
    {
      name:      'open-reports',
      labelKey:  'openReport.headers.label',
      tooltip:   'openReport.headers.tooltip',
      getValue:  (row: any) => row,
      formatter: 'ReportSummary'
    } as ExtendedHeaderOptions
  );

  /** Tabs */
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    {
      resource: [
        POD,
        WORKLOAD_TYPES.CRON_JOB,
        WORKLOAD_TYPES.DAEMON_SET,
        WORKLOAD_TYPES.DEPLOYMENT,
        WORKLOAD_TYPES.JOB,
        WORKLOAD_TYPES.STATEFUL_SET
      ]
    },
    {
      name:       'open-report-tab',
      labelKey:   'openReport.headers.label',
      weight:     -5,
      showHeader: false,
      component:  () => import('./components/OpenReport/ResourceTab.vue')
    }
  );
}
