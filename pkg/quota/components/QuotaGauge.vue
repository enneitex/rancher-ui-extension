<script>
import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import SimpleBox from '@shell/components/SimpleBox';

/**
 * QuotaGauge displays a resource quota gauge similar to HardwareResourceGauge
 * but adapted for namespace ResourceQuotas
 */
export default {
  components: { ConsumptionGauge, SimpleBox },

  props: {
    /**
     * Resource type label to display
     */
    name: {
      type:     String,
      required: true
    },

    /**
     * Gauge data with total and useful (used) values
     */
    gaugeData: {
      type:     Object,
      required: true,
      validator(value) {
        return typeof value.total === 'number' && typeof value.useful === 'number';
      }
    }
  },

  computed: {
    /**
     * Color stops for the percentage bar
     * 0-30%: success (green)
     * 30-70%: warning (yellow)
     * 70-100%: error (red)
     */
    colorStops() {
      return {
        0: '--success', 30: '--warning', 70: '--error'
      };
    },

    /**
     * Calculate percentage of quota used
     */
    percentage() {
      if (this.gaugeData.total === 0) {
        return '0%';
      }

      const pct = (this.gaugeData.useful / this.gaugeData.total * 100).toFixed(2);

      return `${ pct }%`;
    },

    /**
     * Format numbers for display (max 2 decimal places)
     */
    maxDecimalPlaces() {
      return (n) => Math.round(n * 100) / 100;
    }
  }
};
</script>

<template>
  <SimpleBox class="quota-gauge">
    <div class="chart">
      <h3>
        {{ name }}
      </h3>
      <div class="gauge">
        <ConsumptionGauge
          :capacity="gaugeData.total"
          :used="gaugeData.useful"
          :color-stops="colorStops"
        >
          <template #title>
            <span>
              {{ t('quota.messages.used') }}
              <span class="values text-muted">
                <span v-if="gaugeData.formattedUseful">
                  {{ gaugeData.formattedUseful }}
                </span>
                <span v-else>
                  {{ maxDecimalPlaces(gaugeData.useful) }}
                </span>
                /
                <span v-if="gaugeData.formattedTotal">
                  {{ gaugeData.formattedTotal }}
                </span>
                <span v-else>
                  {{ maxDecimalPlaces(gaugeData.total) }} {{ gaugeData.units || '' }}
                </span>
              </span>
            </span>
            <span>
              {{ percentage }}
            </span>
          </template>
        </ConsumptionGauge>
      </div>
    </div>
  </SimpleBox>
</template>

<style lang="scss" scoped>
  .quota-gauge {
    position: relative;
    display: flex;
    flex-direction: column;

    .gauge {
      margin-top: 10px;
    }

    .values {
      font-size: 12px;
      padding-left: 10px;
    }

    h3 {
      margin-bottom: 10px;
    }
  }
</style>
