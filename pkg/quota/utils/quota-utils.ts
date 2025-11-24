import { parseSi, formatSi, createMemoryValues } from '@shell/utils/units';

/**
 * Resource type configuration for ResourceQuotas
 */
export interface ResourceTypeConfig {
  key: string;
  labelKey?: string;
  displayName?: string;
  isCpu?: boolean;
  isMemory?: boolean;
  isStorage?: boolean;
  isCount?: boolean;
  isDynamic?: boolean;
}

/**
 * Parsed resource type information
 */
export interface ParsedResourceType {
  rawType: string;
  resourceName: string;
  apiGroup?: string;
  isCount: boolean;
  displayName: string;
}

/**
 * Gauge data structure for ConsumptionGauge
 */
export interface GaugeData {
  total: number;
  useful: number;
  units?: string;
  formattedTotal?: string;
  formattedUseful?: string;
}

/**
 * Format a resource name to a human-readable display name
 * Examples:
 *   "jobs" -> "Jobs"
 *   "cronjobs" -> "CronJobs"
 *   "persistentvolumeclaims" -> "Persistent Volume Claims"
 */
export function formatResourceName(name: string): string {
  // Handle special cases with known formatting
  const specialCases: Record<string, string> = {
    cronjobs:               'CronJobs',
    persistentvolumeclaims: 'PersistentVolumeClaims',
    configmaps:             'ConfigMaps',
    replicationcontrollers: 'Replication Controllers',
    resourcequotas:         'Resource Quotas',
    limitranges:            'Limit Ranges',
    serviceaccounts:        'Service Accounts',
    networkpolicies:        'Network Policies'
  };

  if (specialCases[name.toLowerCase()]) {
    return specialCases[name.toLowerCase()];
  }

  // For simple cases, just capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Parse a resource type string to extract meaningful information
 * Handles formats like:
 *   - "count/jobs.batch" -> { resourceName: "jobs", apiGroup: "batch", isCount: true }
 *   - "count/cronjobs.batch" -> { resourceName: "cronjobs", apiGroup: "batch", isCount: true }
 *   - "pods" -> { resourceName: "pods", isCount: false }
 *   - "requests.cpu" -> { resourceName: "cpu", isCount: false }
 */
export function parseResourceType(type: string): ParsedResourceType {
  let resourceName = type;
  let apiGroup: string | undefined;
  let isCount = false;

  // Check for count/ prefix
  if (type.startsWith('count/')) {
    isCount = true;
    resourceName = type.substring(6); // Remove "count/" prefix
  }

  // Extract API group if present (e.g., "jobs.batch" -> name: "jobs", group: "batch")
  const dotIndex = resourceName.indexOf('.');

  if (dotIndex > 0) {
    apiGroup = resourceName.substring(dotIndex + 1);
    resourceName = resourceName.substring(0, dotIndex);
  }

  const displayName = formatResourceName(resourceName);

  return {
    rawType: type,
    resourceName,
    apiGroup,
    isCount,
    displayName
  };
}

/**
 * Get resource configuration, either from predefined types or dynamically generated
 */
export function getResourceConfig(type: string): ResourceTypeConfig {
  // Check if we have a predefined config
  const predefined = RESOURCE_TYPES[type];

  if (predefined) {
    return predefined;
  }

  // Parse the resource type to generate a dynamic config
  const parsed = parseResourceType(type);

  return {
    key:         type,
    displayName: parsed.displayName,
    isCount:     parsed.isCount,
    isDynamic:   true
  };
}

/**
 * Known resource types in ResourceQuotas with their display configuration
 */
export const RESOURCE_TYPES: Record<string, ResourceTypeConfig> = {
  'requests.cpu': {
    key:      'requests.cpu',
    labelKey: 'quota.labels.requestsCpu',
    isCpu:    true
  },
  'limits.cpu': {
    key:      'limits.cpu',
    labelKey: 'quota.labels.limitsCpu',
    isCpu:    true
  },
  'requests.memory': {
    key:      'requests.memory',
    labelKey: 'quota.labels.requestsMemory',
    isMemory: true
  },
  'limits.memory': {
    key:      'limits.memory',
    labelKey: 'quota.labels.limitsMemory',
    isMemory: true
  },
  'requests.storage': {
    key:       'requests.storage',
    labelKey:  'quota.labels.requestsStorage',
    isStorage: true
  },
  'pods': {
    key:      'pods',
    labelKey: 'quota.labels.pods',
    isCount:  true
  },
  'persistentvolumeclaims': {
    key:      'persistentvolumeclaims',
    labelKey: 'quota.labels.persistentVolumeClaims',
    isCount:  true
  },
  'services': {
    key:      'services',
    labelKey: 'quota.labels.services',
    isCount:  true
  },
  'secrets': {
    key:      'secrets',
    labelKey: 'quota.labels.secrets',
    isCount:  true
  },
  'configmaps': {
    key:      'configmaps',
    labelKey: 'quota.labels.configMaps',
    isCount:  true
  }
};

/**
 * Extract quota data for a specific resource type from a ResourceQuota
 */
export function extractQuotaData(quota: any, resourceType: string): { used: string | number; hard: string | number } | null {
  const used = quota?.status?.used?.[resourceType];
  const hard = quota?.status?.hard?.[resourceType] || quota?.spec?.hard?.[resourceType];

  if (!hard) {
    return null;
  }

  return {
    used: used || '0',
    hard
  };
}

/**
 * Get all available resource types from a ResourceQuota
 */
export function getResourceTypes(quota: any): string[] {
  const hardKeys = Object.keys(quota?.spec?.hard || {});
  const statusHardKeys = Object.keys(quota?.status?.hard || {});

  return [...new Set([...hardKeys, ...statusHardKeys])];
}

/**
 * Create gauge data for ConsumptionGauge component
 */
export function createGaugeData(quota: any, resourceType: string): GaugeData | null {
  const quotaData = extractQuotaData(quota, resourceType);

  if (!quotaData) {
    return null;
  }

  const config = RESOURCE_TYPES[resourceType];

  if (!config) {
    // Unknown resource type, use basic parsing
    return {
      total:  parseFloat(quotaData.hard as string) || 0,
      useful: parseFloat(quotaData.used as string) || 0
    };
  }

  // CPU resources (in millicores)
  if (config.isCpu) {
    const total = parseSi(quotaData.hard as string, {});
    const used = parseSi(quotaData.used as string, {});

    return {
      total,
      useful: used,
      units:  total === 1 ? 'Core' : 'Cores'
    };
  }

  // Memory resources
  if (config.isMemory) {
    const memoryValues = createMemoryValues(quotaData.hard as string, quotaData.used as string);
    const totalParsed = parseSi(quotaData.hard as string, {});
    const usedParsed = parseSi(quotaData.used as string, {});
    const formattedTotal = formatSi(totalParsed, {
      increment:      1024,
      addSuffixSpace: false,
      suffix:         'iB',
      firstSuffix:    'B'
    });
    const formattedUseful = formatSi(usedParsed, {
      increment:      1024,
      addSuffixSpace: false,
      suffix:         'iB',
      firstSuffix:    'B'
    });

    return {
      total:           memoryValues.total,
      useful:          memoryValues.useful,
      units:           memoryValues.units,
      formattedTotal,
      formattedUseful
    };
  }

  // Storage resources
  if (config.isStorage) {
    const total = parseSi(quotaData.hard as string, {});
    const used = parseSi(quotaData.used as string, {});
    const formattedTotal = formatSi(total, {
      increment:      1024,
      addSuffixSpace: false
    });
    const formattedUseful = formatSi(used, {
      increment:      1024,
      addSuffixSpace: false
    });

    return {
      total,
      useful: used,
      formattedTotal,
      formattedUseful
    };
  }

  // Count resources (pods, services, etc.)
  if (config.isCount) {
    return {
      total:  parseInt(quotaData.hard as string, 10) || 0,
      useful: parseInt(quotaData.used as string, 10) || 0
    };
  }

  // Fallback for unknown types
  return {
    total:  parseFloat(quotaData.hard as string) || 0,
    useful: parseFloat(quotaData.used as string) || 0
  };
}

/**
 * Aggregate multiple ResourceQuotas into a single data structure
 * Automatically detects resource types (including dynamic count/ resources)
 */
export function aggregateQuotas(quotas: any[]): Record<string, { used: string | number; hard: string | number }> {
  const aggregated: Record<string, { used: number; hard: number }> = {};

  quotas.forEach((quota) => {
    const types = getResourceTypes(quota);

    types.forEach((type) => {
      const data = extractQuotaData(quota, type);

      if (!data) {
        return;
      }

      // Use getResourceConfig to handle both predefined and dynamic resources
      const config = getResourceConfig(type);
      let usedValue = 0;
      let hardValue = 0;

      if (config?.isCpu || config?.isMemory || config?.isStorage) {
        usedValue = parseSi(data.used as string, {});
        hardValue = parseSi(data.hard as string, {});
      } else {
        // For count resources and other types, parse as float/int
        usedValue = parseFloat(data.used as string) || 0;
        hardValue = parseFloat(data.hard as string) || 0;
      }

      if (!aggregated[type]) {
        aggregated[type] = { used: 0, hard: 0 };
      }

      aggregated[type].used += usedValue;
      aggregated[type].hard += hardValue;
    });
  });

  return aggregated;
}
