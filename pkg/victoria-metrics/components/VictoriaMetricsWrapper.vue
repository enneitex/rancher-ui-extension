<script>
import DashboardOptions from '@shell/components/DashboardOptions';
import VictoriaMetricsDashboard from './VictoriaMetricsDashboard.vue';
import { mapGetters } from 'vuex';
import { detectMonitoring, allVmDashboardsExist } from '../utils/victoria-metrics';

export default {
  name: 'VictoriaMetricsWrapper',
  components: { 
    DashboardOptions, 
    VictoriaMetricsDashboard 
  },
  props: {
    detailUrl: {
      type: String,
      required: true,
    },
    summaryUrl: {
      type: String,
      default: '',
    },
    vars: {
      type: Object,
      default: () => ({})
    },
    graphHeight: {
      type: String,
      required: true
    },
    hasSummaryAndDetail: {
      type: Boolean,
      default: true,
    },
    modifyPrefix: {
      type: Boolean,
      default: true
    }
  },

  async fetch() {
    const clusterId = this.$store.getters['currentCluster'].id;
    
    // Detect available monitoring systems
    this.monitoringDetection = await detectMonitoring(this.$store);
    
    // Check if Victoria Metrics dashboards exist
    if (this.monitoringDetection.victoriaMetrics) {
      const urls = [this.detailUrl];
      if (this.summaryUrl) {
        urls.push(this.summaryUrl);
      }
      
      this.vmDashboardsExist = await allVmDashboardsExist(this.$store, clusterId, urls);
    }
    
    this.ready = true;
  },

  data() {
    return {
      graphOptions: {
        range: '5m', 
        refreshRate: '30s', 
        type: 'detail'
      },
      monitoringDetection: null,
      vmDashboardsExist: false,
      ready: false
    };
  },

  computed: {
    ...mapGetters(['prefs/theme']),
    
    graphBackgroundColor() {
      return this.theme === 'dark' ? '#2e3035' : '#f3f4f9';
    },
    
    theme() {
      return this['prefs/theme'];
    },
    
    shouldUseVictoriaMetrics() {
      return this.ready && 
             this.monitoringDetection?.victoriaMetrics && 
             this.vmDashboardsExist;
    },
    
    shouldUsePrometheus() {
      return this.ready && 
             this.monitoringDetection?.prometheus && 
             !this.shouldUseVictoriaMetrics;
    },
    
    shouldShowMetrics() {
      return this.shouldUseVictoriaMetrics || this.shouldUsePrometheus;
    }
  }
};
</script>

<template>
  <div
    v-if="shouldShowMetrics"
    class="victoria-metrics-wrapper"
    :class="!hasSummaryAndDetail && 'external-link-pull-left'"
  >
    <div class="graph-options mb-10">
      <DashboardOptions
        v-model:value="graphOptions"
        :has-summary-and-detail="hasSummaryAndDetail"
      />
    </div>
    
    <div class="info">
      <slot />
    </div>
    
    <div
      class="graphs"
      :style="{height: graphHeight}"
    >
      <VictoriaMetricsDashboard
        v-if="graphOptions.type === 'detail'"
        key="'detail'"
        class="col span-12 detail"
        :background-color="graphBackgroundColor"
        :theme="theme"
        :refresh-rate="graphOptions.refreshRate"
        :range="graphOptions.range"
        :url="detailUrl"
        :vars="vars"
        :modify-prefix="modifyPrefix"
      />
      
      <VictoriaMetricsDashboard
        v-else-if="summaryUrl"
        key="'summary'"
        class="col span-12 summary"
        :background-color="graphBackgroundColor"
        :theme="theme"
        :refresh-rate="graphOptions.refreshRate"
        :range="graphOptions.range"
        :url="summaryUrl"
        :vars="vars"
        :modify-prefix="modifyPrefix"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.victoria-metrics-wrapper {
  & :deep() {
    .external-link {
      position: absolute;
      left: 200px;
      top: -45px;
    }

    .frame {
      top: 0;
    }
  }
}

.victoria-metrics-wrapper.external-link-pull-left {
  & :deep() {
    .external-link {
      position: absolute;
      left: 10px;
      top: -47px;
    }
  }
}
</style>