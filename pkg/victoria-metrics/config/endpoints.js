import { VM_DEPLOYMENT_CONFIGS } from '../utils/victoria-metrics';

/**
 * Victoria Metrics endpoint configuration
 * Can be customized per cluster/environment
 */
export class VictoriaMetricsConfig {
  constructor(options = {}) {
    this.namespace = options.namespace || VM_DEPLOYMENT_CONFIGS.standard.namespace;
    this.service = options.service || VM_DEPLOYMENT_CONFIGS.standard.service;
    this.port = options.port || VM_DEPLOYMENT_CONFIGS.standard.port;
    this.dashboardMapping = options.dashboardMapping || {};
    this.customEndpoints = options.customEndpoints || {};
  }

  /**
   * Get configuration for a specific cluster
   * @param {string} clusterId - Cluster ID
   * @returns {Object}
   */
  getClusterConfig(clusterId) {
    // Check if there's a custom config for this cluster
    if (this.customEndpoints[clusterId]) {
      return {
        namespace: this.customEndpoints[clusterId].namespace || this.namespace,
        service: this.customEndpoints[clusterId].service || this.service,
        port: this.customEndpoints[clusterId].port || this.port
      };
    }

    return {
      namespace: this.namespace,
      service: this.service,
      port: this.port
    };
  }

  /**
   * Get dashboard ID mapping for Victoria Metrics
   * @param {string} originalDashboardId - Original Rancher dashboard ID
   * @returns {string}
   */
  getDashboardMapping(originalDashboardId) {
    return this.dashboardMapping[originalDashboardId] || originalDashboardId;
  }

  /**
   * Update configuration for a specific cluster
   * @param {string} clusterId - Cluster ID
   * @param {Object} config - Configuration object
   */
  setClusterConfig(clusterId, config) {
    this.customEndpoints[clusterId] = config;
  }
}

/**
 * Default Victoria Metrics endpoint URLs for different resource types
 */
export const VM_ENDPOINTS = {
  // Pod monitoring URLs (same dashboard names as Rancher)
  pod: {
    detail: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-pod-containers-1/rancher-pod-containers?orgId=1',
    summary: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-pod-1/rancher-pod?orgId=1'
  },

  // Node monitoring URLs (same dashboard names as Rancher)
  node: {
    detail: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-node-detail-1/rancher-node-detail?orgId=1',
    summary: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-node-1/rancher-node?orgId=1'
  },

  // Workload monitoring URLs (same dashboard names as Rancher)
  workload: {
    detail: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-workload-pods-1/rancher-workload-pods?orgId=1',
    summary: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-workload-1/rancher-workload?orgId=1'
  },

  // Cluster monitoring URLs (same dashboard names as Rancher)
  cluster: {
    detail: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-cluster-nodes-1/rancher-cluster-nodes?orgId=1',
    summary: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-cluster-1/rancher-cluster?orgId=1',
    k8s_detail: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-k8s-components-nodes-1/rancher-kubernetes-components-nodes?orgId=1',
    k8s_summary: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-k8s-components-1/rancher-kubernetes-components?orgId=1',
    etcd_detail: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-etcd-nodes-1/rancher-etcd-nodes?orgId=1',
    etcd_summary: '/api/v1/namespaces/{namespace}/services/http:{service}:{port}/proxy/d/rancher-etcd-1/rancher-etcd?orgId=1'
  }
};

/**
 * Generate Victoria Metrics URLs from template
 * @param {string} template - URL template with placeholders
 * @param {Object} config - Configuration with namespace, service, port
 * @param {string} clusterId - Cluster ID
 * @returns {string}
 */
export function generateVMUrl(template, config, clusterId) {
  const clusterPrefix = clusterId === 'local' ? '' : `/k8s/clusters/${clusterId}`;

  return clusterPrefix + template
    .replace('{namespace}', config.namespace)
    .replace('{service}', config.service)
    .replace('{port}', config.port);
}

/**
 * Get Victoria Metrics URLs for a specific resource type
 * @param {string} resourceType - Resource type (pod, node, workload, cluster)
 * @param {string} clusterId - Cluster ID
 * @param {VictoriaMetricsConfig} vmConfig - Victoria Metrics configuration
 * @returns {Object}
 */
export function getVMResourceUrls(resourceType, clusterId, vmConfig) {
  const clusterConfig = vmConfig.getClusterConfig(clusterId);
  const templates = VM_ENDPOINTS[resourceType];

  if (!templates) {
    throw new Error(`Unknown resource type: ${resourceType}`);
  }

  const urls = {};
  Object.entries(templates).forEach(([key, template]) => {
    urls[key] = generateVMUrl(template, clusterConfig, clusterId);
  });

  return urls;
}

/**
 * Environment-based configuration detection
 * Reads from environment variables or cluster annotations
 */
export function detectVMConfiguration() {
  const config = new VictoriaMetricsConfig();

  // Check environment variables
  if (process.env.VM_NAMESPACE) {
    config.namespace = process.env.VM_NAMESPACE;
  }
  if (process.env.VM_SERVICE) {
    config.service = process.env.VM_SERVICE;
  }
  if (process.env.VM_PORT) {
    config.port = process.env.VM_PORT;
  }

  return config;
}

/**
 * Load configuration from cluster ConfigMap or Settings
 * @param {Object} store - Vuex store
 * @param {string} clusterId - Cluster ID
 * @returns {Promise<VictoriaMetricsConfig>}
 */
export async function loadVMConfigFromCluster(store, clusterId) {
  try {
    // Try to load from cluster ConfigMap
    const configMap = await store.dispatch('cluster/find', {
      type: 'configmap',
      id: 'kube-metrics/vmks-grafana'
    });

    if (configMap?.data) {
      return new VictoriaMetricsConfig({
        namespace: configMap.data.namespace,
        service: configMap.data.service,
        port: configMap.data.port,
        customEndpoints: JSON.parse(configMap.data.customEndpoints || '{}'),
        dashboardMapping: JSON.parse(configMap.data.dashboardMapping || '{}')
      });
    }
  } catch (error) {
    console.debug('No Victoria Metrics ConfigMap found, using defaults');
  }

  // Fallback to environment-based configuration
  return detectVMConfiguration();
}

// Global configuration instance
let globalVMConfig = null;

/**
 * Get or initialize global Victoria Metrics configuration
 * @param {Object} store - Vuex store
 * @param {string} clusterId - Cluster ID
 * @returns {Promise<VictoriaMetricsConfig>}
 */
export async function getGlobalVMConfig(store, clusterId) {
  if (!globalVMConfig) {
    globalVMConfig = await loadVMConfigFromCluster(store, clusterId);
  }
  return globalVMConfig;
}

/**
 * Reset global configuration (useful for testing or cluster changes)
 */
export function resetGlobalVMConfig() {
  globalVMConfig = null;
}