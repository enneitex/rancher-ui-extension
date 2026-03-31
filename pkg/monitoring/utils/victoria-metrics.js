import { CONFIG_MAP } from '@shell/config/types';

export const DEFAULT_MONITORING_NAMESPACE = 'kube-monitoring';
export const DEFAULT_LINKS_CONFIGMAP      = 'vmks-monitoring';

const MONITORING_CONFIGMAP_ID = `${ DEFAULT_MONITORING_NAMESPACE }/${ DEFAULT_LINKS_CONFIGMAP }`;

const DEFAULT_DASHBOARD_IDS = {
  pod: {
    detailDashboardId:  'rancher-pod-containers-1/rancher-pod-containers',
    summaryDashboardId: 'rancher-pod-1/rancher-pod',
  },
  node: {
    detailDashboardId:  'rancher-node-detail-1/rancher-node-detail',
    summaryDashboardId: 'rancher-node-1/rancher-node',
  },
  workload: {
    detailDashboardId:  'rancher-workload-pods-1/rancher-workload-pods',
    summaryDashboardId: 'rancher-workload-1/rancher-workload',
  },
};

const dnsLabel = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;
const portNum  = /^\d{1,5}$/;

/**
 * Load Grafana and Alertmanager service coordinates from the vmks-monitoring ConfigMap.
 * Returns null when the ConfigMap is absent — callers must show a "not installed" banner.
 *
 * ConfigMap keys: grafana.namespace, grafana.service, grafana.port,
 *                 alertmanager.namespace, alertmanager.service, alertmanager.port
 *
 * @param {Object} store - Vuex store
 * @returns {Promise<{namespace: string, service: string, port: string,
 *                    alertmanager: {namespace: string, service: string, port: string}} | null>}
 */
export async function loadVMConfigFromCluster(store) {
  try {
    const cm = await store.dispatch('cluster/find', { type: CONFIG_MAP, id: MONITORING_CONFIGMAP_ID });

    if (!cm?.data) {
      return null;
    }

    const d = cm.data;

    return {
      namespace:    dnsLabel.test(d['grafana.namespace'] || '') ? d['grafana.namespace'] : DEFAULT_MONITORING_NAMESPACE,
      service:      dnsLabel.test(d['grafana.service']   || '') ? d['grafana.service']   : 'vmks-grafana',
      port:         portNum.test(d['grafana.port']        || '') ? d['grafana.port']       : '8080',
      alertmanager: {
        namespace: dnsLabel.test(d['alertmanager.namespace'] || '') ? d['alertmanager.namespace'] : DEFAULT_MONITORING_NAMESPACE,
        service:   dnsLabel.test(d['alertmanager.service']   || '') ? d['alertmanager.service']   : 'vmks-alertmanager',
        port:      portNum.test(d['alertmanager.port']        || '') ? d['alertmanager.port']       : '9093',
      },
    };
  } catch (e) {
    console.debug('[vm] ConfigMap not found:', e?.message);
    return null;
  }
}

/**
 * Load dashboard IDs from the vmks-monitoring ConfigMap.
 * Returns hardcoded defaults when the ConfigMap is absent or keys are missing.
 * Used by VictoriaMetricsTab — unchanged calling contract.
 *
 * @param {Object} store - Vuex store
 * @returns {Promise<{pod: object, node: object, workload: object}>}
 */
export async function loadVMDashboardIdsFromCluster(store) {
  try {
    const cm = await store.dispatch('cluster/find', { type: CONFIG_MAP, id: MONITORING_CONFIGMAP_ID });
    const d  = cm?.data || {};

    return {
      pod: {
        detailDashboardId:  d['pod.detailDashboardId']  || DEFAULT_DASHBOARD_IDS.pod.detailDashboardId,
        summaryDashboardId: d['pod.summaryDashboardId'] || DEFAULT_DASHBOARD_IDS.pod.summaryDashboardId,
      },
      node: {
        detailDashboardId:  d['node.detailDashboardId']  || DEFAULT_DASHBOARD_IDS.node.detailDashboardId,
        summaryDashboardId: d['node.summaryDashboardId'] || DEFAULT_DASHBOARD_IDS.node.summaryDashboardId,
      },
      workload: {
        detailDashboardId:  d['workload.detailDashboardId']  || DEFAULT_DASHBOARD_IDS.workload.detailDashboardId,
        summaryDashboardId: d['workload.summaryDashboardId'] || DEFAULT_DASHBOARD_IDS.workload.summaryDashboardId,
      },
    };
  } catch (e) {
    console.debug('[vm] Dashboard IDs ConfigMap not found, using defaults:', e?.message);
    return DEFAULT_DASHBOARD_IDS;
  }
}

/**
 * Build a bare proxy path for DashboardMetrics (NO cluster prefix, NO query params).
 *
 * @param {string} namespace
 * @param {string} service
 * @param {string} port
 * @param {string} dashboardId  e.g. "k8s_views_pods/kubernetes-views-pods"
 * @returns {string}
 */
export function generateVMUrl(namespace, service, port, dashboardId) {
  return `/api/v1/namespaces/${ namespace }/services/http:${ service }:${ port }/proxy/d/${ dashboardId }`;
}

/**
 * Probe the Grafana API to verify a dashboard UID exists.
 * Uses the k8s proxy — no extra network call outside the cluster.
 *
 * @param {Object} store
 * @param {string} clusterId
 * @param {{namespace: string, service: string, port: string}} config
 * @param {string} dashboardId  e.g. "k8s_views_pods/kubernetes-views-pods"
 * @returns {Promise<boolean>}
 */
export async function dashboardExists(store, clusterId, config, dashboardId) {
  const uid           = dashboardId.split('/')[0];
  const clusterPrefix = clusterId === 'local' ? '' : `/k8s/clusters/${ clusterId }`;
  const url           = `${ clusterPrefix }/api/v1/namespaces/${ config.namespace }/services/http:${ config.service }:${ config.port }/proxy/api/dashboards/uid/${ uid }`;

  try {
    await store.dispatch('cluster/request', { url, redirectUnauthorized: false });
    return true;
  } catch {
    return false;
  }
}
