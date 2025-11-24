<script>
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import { RESOURCE_QUOTA } from '@shell/config/types';
import { formatSi } from '@shell/utils/units';
import ResourceManager from '@shell/mixins/resource-manager';
import QuotaGauge from './QuotaGauge.vue';
import {
  aggregateQuotas,
  getResourceConfig
} from '../utils/quota-utils';

/**
 * NamespaceCapacity component displays resource quota gauges for a namespace
 * Shows CPU, memory, storage, and other resource limits and usage
 *
 * Uses the resource-manager mixin to efficiently fetch namespace-scoped ResourceQuotas
 * following Rancher Dashboard best practices for secondary data loading
 */
export default {
  components: {
    Loading,
    Banner,
    QuotaGauge
  },

  mixins: [ResourceManager],

  props: {
    /**
     * The namespace resource to display quotas for
     * When used as a panel, this prop is named 'resource' by ExtensionPanel
     */
    resource: {
      type:     Object,
      required: true
    }
  },

  data() {
    return { resourceQuotas: [] };
  },

  async fetch() {
    // Configure secondary resource data fetch using resource-manager mixin
    const secondaryResourceDataConfig = {
      namespace: this.resource.id,
      data:      {
        [RESOURCE_QUOTA]: {
          applyTo: [
            {
              var:      'resourceQuotas',
              classify: true  // Apply model to get full ResourceQuota functionality
            }
          ]
        }
      }
    };

    // Fetch ResourceQuotas directly from API filtered by namespace
    // Error handling is done internally by the mixin via console.error
    await this.resourceManagerFetchSecondaryResources(secondaryResourceDataConfig);
  },

  computed: {
    // Alias for compatibility
    value() {
      return this.resource;
    },


    /**
     * Check if there are any resource quotas defined
     */
    hasQuotas() {
      return this.resourceQuotas && this.resourceQuotas.length > 0;
    },

    /**
     * Aggregate all quotas into a single view per resource type
     */
    aggregatedQuotas() {
      if (!this.hasQuotas) {
        return {};
      }

      return aggregateQuotas(this.resourceQuotas);
    },

    /**
     * Get list of resource types to display, sorted by priority
     */
    displayedResourceTypes() {
      const types = Object.keys(this.aggregatedQuotas);

      // Priority order for display
      const priorityOrder = [
        'requests.cpu',
        'limits.cpu',
        'requests.memory',
        'limits.memory',
        'requests.storage',
        'pods',
        'persistentvolumeclaims',
        'services',
        'secrets',
        'configmaps'
      ];

      // Sort by priority, then alphabetically
      return types.sort((a, b) => {
        const aPriority = priorityOrder.indexOf(a);
        const bPriority = priorityOrder.indexOf(b);

        if (aPriority !== -1 && bPriority !== -1) {
          return aPriority - bPriority;
        }
        if (aPriority !== -1) {
          return -1;
        }
        if (bPriority !== -1) {
          return 1;
        }

        return a.localeCompare(b);
      });
    },

    /**
     * Create gauge data for each resource type
     */
    gauges() {
      if (!this.hasQuotas) {
        return [];
      }

      const gauges = [];

      this.displayedResourceTypes.forEach((type) => {
        const aggregated = this.aggregatedQuotas[type];

        if (!aggregated) {
          return;
        }

        // Get config (predefined or dynamically generated)
        const config = getResourceConfig(type);

        // Use labelKey for predefined resources (with i18n), displayName for dynamic resources
        const label = config.labelKey ? this.t(config.labelKey) : config.displayName || type;

        // Create gauge data directly from aggregated values (already parsed)
        let gaugeData;

        if (config?.isCpu) {
          gaugeData = {
            total:  aggregated.hard,
            useful: aggregated.used,
            units:  aggregated.hard === 1 ? 'Core' : 'Cores'
          };
        } else if (config?.isMemory) {
          const totalFormatted = formatSi(aggregated.hard, {
            increment:      1024,
            addSuffixSpace: false,
            suffix:         'iB',
            firstSuffix:    'B'
          });
          const usedFormatted = formatSi(aggregated.used, {
            increment:      1024,
            addSuffixSpace: false,
            suffix:         'iB',
            firstSuffix:    'B'
          });

          gaugeData = {
            total:           parseFloat(totalFormatted),
            useful:          parseFloat(usedFormatted),
            formattedTotal:  totalFormatted,
            formattedUseful: usedFormatted
          };
        } else if (config?.isStorage) {
          const totalFormatted = formatSi(aggregated.hard, {
            increment:      1024,
            addSuffixSpace: false
          });
          const usedFormatted = formatSi(aggregated.used, {
            increment:      1024,
            addSuffixSpace: false
          });

          gaugeData = {
            total:           aggregated.hard,
            useful:          aggregated.used,
            formattedTotal:  totalFormatted,
            formattedUseful: usedFormatted
          };
        } else if (config?.isCount) {
          gaugeData = {
            total:  aggregated.hard,
            useful: aggregated.used
          };
        } else {
          // Unknown type
          gaugeData = {
            total:  aggregated.hard,
            useful: aggregated.used
          };
        }

        gauges.push({
          type,
          label,
          data: gaugeData
        });
      });

      return gauges;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="!hasQuotas">
    <Banner color="info">
      {{ t('quota.messages.noQuotas') }}
    </Banner>
  </div>
  <div
    v-else
    class="namespace-capacity"
  >
    <h3 class="mb-10">
      {{ t('quota.panel.title') }}
    </h3>
    <div class="gauges-grid">
      <QuotaGauge
        v-for="gauge in gauges"
        :key="gauge.type"
        :name="gauge.label"
        :gauge-data="gauge.data"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .namespace-capacity {
    h2 {
      font-size: 18px;
      font-weight: 500;
    }

    .gauges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
  }
</style>
