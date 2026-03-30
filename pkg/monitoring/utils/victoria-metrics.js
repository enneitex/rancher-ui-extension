import { ENDPOINTS, CONFIG_MAP } from '@shell/config/types';

const DEFAULT_NAMESPACE = 'kube-monitoring';
const DEFAULT_SERVICE   = 'vmks-grafana';
const DEFAULT_PORT      = '8080';

const CONFIGMAP_ID = `${DEFAULT_NAMESPACE}/vmks-grafana`;

export const DEFAULT_MONITORING_NAMESPACE = 'kube-monitoring';
export const DEFAULT_LINKS_CONFIGMAP      = 'vmks-monitoring';

const MONITORING_CONFIGMAP_ID = `${DEFAULT_MONITORING_NAMESPACE}/${DEFAULT_LINKS_CONFIGMAP}`;

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

/**
 * Parse a Kubernetes proxy URL to extract namespace and service name.
 * Handles: /api/v1/namespaces/{ns}/services/https?:{svc}:{port}/proxy/...
 *
 * @param {string} url
 * @returns {{namespace: string, service: string} | null}
 */
function extractNsSvcFromProxyUrl(url) {
  if (!url) return null;
  const match = url.match(/\/namespaces\/([^/]+)\/services\/https?:([^:]+):/);
  if (!match) return null;
  return { namespace: match[1], service: match[2] };
}

/**
 * Load Grafana service coordinates from the optional ConfigMap.
 * Returns hardcoded defaults when the ConfigMap is absent or keys are missing.
 *
 * @param {Object} store - Vuex store
 * @returns {Promise<{namespace: string, service: string, port: string, source: string}>}
 */
export async function loadVMConfigFromCluster(store) {
  const defaults = {
    namespace: DEFAULT_NAMESPACE,
    service:   DEFAULT_SERVICE,
    port:      DEFAULT_PORT,
    source:    'default',
  };

  try {
    const cm = await store.dispatch('cluster/find', { type: CONFIG_MAP, id: CONFIGMAP_ID });

    if (!cm || !cm.data) {
      return defaults;
    }

    const dnsLabel = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;
    const namespace = dnsLabel.test(cm.data.namespace || '') ? cm.data.namespace : DEFAULT_NAMESPACE;
    const service   = dnsLabel.test(cm.data.service   || '') ? cm.data.service   : DEFAULT_SERVICE;
    const port      = /^\d{1,5}$/.test(cm.data.port   || '') ? cm.data.port      : DEFAULT_PORT;

    return {
      namespace,
      service,
      port,
      source: 'configmap',
    };
  } catch (e) {
    console.debug('[vm] ConfigMap not found, using defaults:', e?.message);
    return defaults;
  }
}

/**
 * Load tool links and dashboard IDs from the vmks-monitoring ConfigMap.
 * Returns empty links and hardcoded dashboard ID defaults when ConfigMap is absent.
 *
 * @param {Object} store - Vuex store
 * @returns {Promise<{links: {grafana: string, vmagent: string, vmalert: string, alertmanager: string}, dashboardIds: object}>}
 */
export async function loadVMMonitoringConfig(store) {
  const defaults = {
    links: {
      grafana:      '',
      vmagent:      '',
      vmalert:      '',
      alertmanager: '',
    },
    dashboardIds: DEFAULT_DASHBOARD_IDS,
  };

  try {
    const cm = await store.dispatch('cluster/find', { type: CONFIG_MAP, id: MONITORING_CONFIGMAP_ID });

    if (!cm || !cm.data) {
      return defaults;
    }

    const d = cm.data;

    return {
      links: {
        grafana:      d['grafana.url']      || '',
        vmagent:      d['vmagent.url']      || '',
        vmalert:      d['vmalert.url']      || '',
        alertmanager: d['alertmanager.url'] || '',
      },
      dashboardIds: {
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
      },
    };
  } catch (e) {
    console.debug('[vm] Monitoring ConfigMap not found, using defaults:', e?.message);
    return defaults;
  }
}

/**
 * Thin wrapper — returns only the dashboard IDs from loadVMMonitoringConfig.
 * Used by tab components. On first mount both ConfigMaps are fetched; Rancher caches
 * cluster/find results so subsequent calls in the same session are deduplicated.
 *
 * @param {Object} store - Vuex store
 * @returns {Promise<{pod: object, node: object, workload: object}>}
 */
export async function loadVMDashboardIdsFromCluster(store) {
  return (await loadVMMonitoringConfig(store)).dashboardIds;
}

/**
 * Check whether a Grafana service endpoint exists and has ready subsets.
 *
 * @param {Object} store - Vuex store
 * @param {string} namespace
 * @param {string} service
 * @returns {Promise<boolean>}
 */
export async function hasVictoriaMetrics(store, namespace, service) {
  try {
    if (!store.getters['cluster/schemaFor'](ENDPOINTS)) {
      console.debug('[vm] No ENDPOINTS schema');
      return false;
    }

    const endpoint = await store.dispatch('cluster/find', {
      type: ENDPOINTS,
      id:   `${namespace}/${service}`,
    });

    const ready = !!(endpoint?.subsets?.some(s => s.addresses?.length > 0));
    console.debug(`[vm] hasVictoriaMetrics ${namespace}/${service}:`, ready);
    return ready;
  } catch (e) {
    console.debug('[vm] hasVictoriaMetrics error:', e?.message);
    return false;
  }
}

/**
 * Build a bare proxy path for DashboardMetrics (NO cluster prefix, NO query params).
 * DashboardMetrics → GrafanaDashboard → computeDashboardUrl adds both.
 *
 * @param {string} namespace
 * @param {string} service
 * @param {string} port
 * @param {string} dashboardId  e.g. "rancher-pod-containers-1/rancher-pod-containers"
 * @returns {string}
 */
export function generateVMUrl(namespace, service, port, dashboardId) {
  return `/api/v1/namespaces/${namespace}/services/http:${service}:${port}/proxy/d/${dashboardId}`;
}

/**
 * Probe the Grafana dashboards API for each URL.
 * Uses cluster/request (raw HTTP) with a manual cluster prefix.
 * Returns true only when all dashboards respond successfully.
 *
 * @param {Object} store - Vuex store
 * @param {string} clusterId
 * @param {string[]} barePaths  - bare proxy paths (no prefix, no query)
 * @param {{namespace: string, service: string, port: string}} config
 * @returns {Promise<boolean>}
 */
export async function allVmDashboardsExist(store, clusterId, barePaths, config) {
  if (!clusterId) {
    console.debug('[vm] allVmDashboardsExist: no clusterId');
    return false;
  }
  const clusterPrefix = clusterId === 'local' ? '' : `/k8s/clusters/${clusterId}`;
  const { namespace, service, port } = config;

  for (const barePath of barePaths) {
    const uidMatch = barePath.match(/\/proxy\/d\/([^/?#]+)/);
    if (!uidMatch) {
      console.debug('[vm] Could not extract dashboard UID from:', barePath);
      return false;
    }

    const uid      = uidMatch[1];
    const probeUrl = `${clusterPrefix}/api/v1/namespaces/${namespace}/services/http:${service}:${port}/proxy/api/dashboards/uid/${uid}`;

    try {
      await store.dispatch('cluster/request', { url: probeUrl, redirectUnauthorized: false });
    } catch (e) {
      console.debug('[vm] Dashboard probe failed for UID', uid, ':', e?.message);
      return false;
    }
  }

  return true;
}

export { extractNsSvcFromProxyUrl };
