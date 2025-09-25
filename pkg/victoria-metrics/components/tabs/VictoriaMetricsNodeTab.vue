<script setup lang="ts">
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import VictoriaMetricsWrapper from '../VictoriaMetricsWrapper.vue';
import { detectMonitoring, allVmDashboardsExist } from '../../utils/victoria-metrics';
import { getVMResourceUrls, getGlobalVMConfig } from '../../config/endpoints';

const store = useStore();
let route: any = null;

const resource = ref<any>(null);
const vmConfig = ref<any>(null);
const monitoringDetection = ref<any>(null);

const fetchState = reactive({ pending: true });

// VM URLs
const NODE_VM_DETAIL_URL = ref('');
const NODE_VM_SUMMARY_URL = ref('');

// Flags
const showVMMetrics = ref(false);

const graphVars = computed(() => {
  if (!resource.value) return {};
  
  return {
    instance: resource.value.metadata?.name || ''
  };
});

function determineResource() {
  if (route?.params?.resource && route?.params?.id) {
    const id = route?.params.namespace ? `${route?.params.namespace}/${route?.params.id}` : route?.params.id;
    resource.value = store.getters['cluster/byId'](route?.params.resource, id);
  }
}

async function fetchVictoriaMetrics() {
  if (!resource.value) return;

  try {
    fetchState.pending = true;
    const clusterId = store.getters['currentCluster'].id;
    
    vmConfig.value = await getGlobalVMConfig(store, clusterId);
    monitoringDetection.value = await detectMonitoring(store);
    
    if (monitoringDetection.value?.victoriaMetrics) {
      const vmUrls = getVMResourceUrls('node', clusterId, vmConfig.value);
      NODE_VM_DETAIL_URL.value = vmUrls.detail;
      NODE_VM_SUMMARY_URL.value = vmUrls.summary;
      
      showVMMetrics.value = await allVmDashboardsExist(
        store, 
        clusterId, 
        [NODE_VM_DETAIL_URL.value, NODE_VM_SUMMARY_URL.value],
        vmConfig.value.getClusterConfig(clusterId)
      );
    }
  } catch (error) {
    console.warn('Error setting up Victoria Metrics for Node:', error);
    showVMMetrics.value = false;
  } finally {
    fetchState.pending = false;
  }
}

onMounted(async () => {
  const instance = getCurrentInstance();
  if (instance?.proxy?.$route) {
    route = instance.proxy.$route;
  }

  determineResource();
  await fetchVictoriaMetrics();
});
</script>

<template>
  <div class="victoria-metrics-node-tab">
    <div v-if="fetchState.pending" class="loading">
      <i class="icon icon-lg icon-spinner icon-spin m-20" />
    </div>
    
    <div v-else-if="!showVMMetrics" class="no-metrics">
      <div class="text-center p-20">
        <p class="text-muted">
          Victoria Metrics dashboards not available for this node.
        </p>
      </div>
    </div>
    
    <div v-else>
      <VictoriaMetricsWrapper
        :detail-url="NODE_VM_DETAIL_URL"
        :summary-url="NODE_VM_SUMMARY_URL"
        :vars="graphVars"
        graph-height="600px"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.victoria-metrics-node-tab {
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }
  
  .no-metrics {
    min-height: 200px;
  }
}
</style>