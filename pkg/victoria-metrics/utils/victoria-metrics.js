import { haveV2Monitoring } from '@shell/utils/monitoring';
import { ENDPOINTS } from '@shell/config/types';
import { isEmpty } from '@shell/utils/object';

// Victoria Metrics namespace configuration
export const VICTORIA_METRICS_NAMESPACE = 'kube-metrics';
export const VICTORIA_METRICS_SERVICE = 'vmks-grafana';
export const VICTORIA_METRICS_PORT = '80';

// Configuration for different Victoria Metrics deployment patterns
export const VM_DEPLOYMENT_CONFIGS = {
  // Standard single-cluster Victoria Metrics
  standard: {
    namespace: VICTORIA_METRICS_NAMESPACE,
    service: VICTORIA_METRICS_SERVICE,
    port: VICTORIA_METRICS_PORT
  },
  // Project-level Victoria Metrics (similar to Rancher pattern)
  project: {
    namespace: (projectId) => `victoria-metrics-project-${projectId}`,
    service: (projectId) => `victoria-metrics-project-${projectId}-grafana`,
    port: VICTORIA_METRICS_PORT
  },
  // Custom configuration
  custom: {
    namespace: process.env.VM_NAMESPACE || VICTORIA_METRICS_NAMESPACE,
    service: process.env.VM_SERVICE || VICTORIA_METRICS_SERVICE,
    port: process.env.VM_PORT || VICTORIA_METRICS_PORT
  }
};

/**
 * Check if Victoria Metrics is available in the cluster
 * @param {Object} store - Vuex store
 * @param {string} namespace - Namespace to check (default: victoria-metrics-system)
 * @param {string} service - Service name to check
 * @returns {Promise<boolean>}
 */
export async function hasVictoriaMetrics(store, namespace = VICTORIA_METRICS_NAMESPACE, service = VICTORIA_METRICS_SERVICE) {
  console.log('[VM] Checking Victoria Metrics availability', { namespace, service });

  try {
    if (!store.getters['cluster/schemaFor'](ENDPOINTS)) {
      console.log('[VM] No ENDPOINTS schema found');
      return false;
    }

    const endpoints = await store.dispatch('cluster/findAll', { type: ENDPOINTS }) || [];
    console.log('[VM] Found endpoints:', endpoints.map(ep => ep.id));

    const endpointId = `${namespace}/${service}`;
    console.log('[VM] Looking for endpoint ID:', endpointId);

    const endpoint = endpoints.find((ep) => ep.id === endpointId);
    console.log('[VM] Found endpoint:', endpoint ? endpoint.id : 'NOT FOUND');

    const hasSubsets = endpoint && !isEmpty(endpoint) && !isEmpty(endpoint.subsets);
    console.log('[VM] Endpoint has subsets:', hasSubsets, endpoint?.subsets);

    return hasSubsets;
  } catch (error) {
    console.warn('[VM] Error checking Victoria Metrics availability:', error);
    return false;
  }
}

/**
 * Detect available monitoring solutions
 * @param {Object} store - Vuex store
 * @returns {Promise<Object>} Object with detection results
 */
export async function detectMonitoring(store) {
  console.log('[VM] Detecting available monitoring solutions...');

  const prometheusAvailable = haveV2Monitoring(store.getters);
  console.log('[VM] Prometheus available:', prometheusAvailable);

  const victoriaMetricsAvailable = await hasVictoriaMetrics(store);
  console.log('[VM] Victoria Metrics available:', victoriaMetricsAvailable);

  const detection = {
    prometheus: prometheusAvailable,
    victoriaMetrics: victoriaMetricsAvailable,
    preferred: 'none'
  };

  // Prefer Victoria Metrics if available, fallback to Prometheus
  if (detection.victoriaMetrics) {
    detection.preferred = 'victoria-metrics';
  } else if (detection.prometheus) {
    detection.preferred = 'prometheus';
  }

  console.log('[VM] Final detection:', detection);
  return detection;
}

/**
 * Generate Victoria Metrics dashboard URL
 * @param {string} clusterId - Cluster ID
 * @param {string} dashboardId - Grafana dashboard ID
 * @param {string} dashboardName - Dashboard name
 * @param {Object} config - VM deployment configuration
 * @param {Object} params - Additional URL parameters
 * @returns {string}
 */
export function generateVictoriaMetricsUrl(clusterId, dashboardId, dashboardName, config = VM_DEPLOYMENT_CONFIGS.standard, params = {}) {
  const { namespace, service, port } = config;
  const clusterPrefix = clusterId === 'local' ? '' : `/k8s/clusters/${clusterId}`;

  let baseUrl = `${clusterPrefix}/api/v1/namespaces/${namespace}/services/http:${service}:${port}/proxy/d/${dashboardId}/${dashboardName}`;

  // Add default parameters
  const defaultParams = {
    orgId: 1,
    kiosk: '',
    '_dash.hideTimePicker': 'true',
    ...params
  };

  const searchParams = new URLSearchParams();
  Object.entries(defaultParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, value);
    }
  });

  return `${baseUrl}?${searchParams.toString()}`;
}

// Conversion functions removed - using direct Victoria Metrics URLs with same dashboard names as Rancher

// Dashboard mapping removed - using same dashboard names as Rancher for direct comparison

/**
 * Check if Victoria Metrics dashboard exists
 * @param {Object} store - Vuex store
 * @param {string} clusterId - Cluster ID
 * @param {string} dashboardUrl - Dashboard URL to check
 * @param {Object} vmConfig - Victoria Metrics configuration
 * @returns {Promise<boolean>}
 */
export async function vmDashboardExists(store, clusterId, dashboardUrl, vmConfig = VM_DEPLOYMENT_CONFIGS.standard) {
  console.log('[VM] Checking dashboard existence:', { clusterId, dashboardUrl, vmConfig });

  try {
    // Extract dashboard ID from the direct VM URL (no conversion needed)
    console.log('[VM] Using direct VM URL:', dashboardUrl);
    const urlMatch = dashboardUrl.match(/\/proxy\/d\/([^\/]+)\//);
    if (!urlMatch) {
      console.log('[VM] Could not extract dashboard ID from URL');
      return false;
    }

    const dashboardId = urlMatch[1];
    const { namespace, service, port } = vmConfig;
    const clusterPrefix = clusterId === 'local' ? '' : `/k8s/clusters/${clusterId}`;
    const checkUrl = `${clusterPrefix}/api/v1/namespaces/${namespace}/services/http:${service}:${port}/proxy/api/dashboards/uid/${dashboardId}`;

    console.log('[VM] Checking dashboard at URL:', checkUrl);
    await store.dispatch('cluster/request', { url: checkUrl, redirectUnauthorized: false });
    console.log('[VM] Dashboard exists!');
    return true;
  } catch (error) {
    console.log('[VM] Dashboard does not exist:', error.message);
    return false;
  }
}

/**
 * Check if all Victoria Metrics dashboards exist
 * @param {Object} store - Vuex store
 * @param {string} clusterId - Cluster ID
 * @param {Array<string>} dashboardUrls - Array of dashboard URLs to check
 * @param {Object} vmConfig - Victoria Metrics configuration
 * @returns {Promise<boolean>}
 */
export async function allVmDashboardsExist(store, clusterId, dashboardUrls, vmConfig = VM_DEPLOYMENT_CONFIGS.standard) {
  const existPromises = dashboardUrls.map((url) => vmDashboardExists(store, clusterId, url, vmConfig));
  const results = await Promise.all(existPromises);
  return results.every((exists) => exists);
}

/**
 * Get the appropriate monitoring configuration based on detection
 * @param {Object} store - Vuex store
 * @returns {Promise<Object>} Monitoring configuration
 */
export async function getMonitoringConfig(store) {
  const detection = await detectMonitoring(store);

  return {
    type: detection.preferred,
    available: detection,
    vmConfig: VM_DEPLOYMENT_CONFIGS.standard,
    dashboardExists: detection.preferred === 'victoria-metrics' ? allVmDashboardsExist : null
  };
}