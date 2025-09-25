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
const POD_VM_DETAIL_URL = ref('');
const POD_VM_SUMMARY_URL = ref('');

// Flags
const showVMMetrics = ref(false);

const graphVars = computed(() => {
  if (!resource.value) return {};
  
  return {
    namespace: resource.value.metadata?.namespace || '',
    pod: resource.value.metadata?.name || ''
  };
});

function determineResource() {
  if (route?.params?.resource && route?.params?.id) {
    const id = route?.params.namespace ? `${route?.params.namespace}/${route?.params.id}` : route?.params.id;
    resource.value = store.getters['cluster/byId'](route?.params.resource, id);
  }
}

async function fetchVictoriaMetrics() {
  console.log('[VM Pod Tab] Starting Victoria Metrics fetch...');
  
  if (!resource.value) {
    console.log('[VM Pod Tab] No resource found');
    return;
  }

  console.log('[VM Pod Tab] Resource:', resource.value.metadata?.name, resource.value.metadata?.namespace);

  try {
    fetchState.pending = true;
    const clusterId = store.getters['currentCluster'].id;
    console.log('[VM Pod Tab] Cluster ID:', clusterId);
    
    // Initialize Victoria Metrics configuration
    vmConfig.value = await getGlobalVMConfig(store, clusterId);
    console.log('[VM Pod Tab] VM Config:', vmConfig.value);
    
    // Detect monitoring systems
    monitoringDetection.value = await detectMonitoring(store);
    console.log('[VM Pod Tab] Monitoring detection:', monitoringDetection.value);
    
    // Only proceed if Victoria Metrics is available
    if (monitoringDetection.value?.victoriaMetrics) {
      console.log('[VM Pod Tab] Victoria Metrics detected, generating URLs...');
      const vmUrls = getVMResourceUrls('pod', clusterId, vmConfig.value);
      POD_VM_DETAIL_URL.value = vmUrls.detail;
      POD_VM_SUMMARY_URL.value = vmUrls.summary;
      
      console.log('[VM Pod Tab] Generated URLs:', vmUrls);
      
      // Check if VM dashboards exist
      showVMMetrics.value = await allVmDashboardsExist(
        store, 
        clusterId, 
        [POD_VM_DETAIL_URL.value, POD_VM_SUMMARY_URL.value],
        vmConfig.value.getClusterConfig(clusterId)
      );
      
      console.log('[VM Pod Tab] Show VM metrics:', showVMMetrics.value);
    } else {
      console.log('[VM Pod Tab] Victoria Metrics not available');
    }
  } catch (error) {
    console.warn('[VM Pod Tab] Error setting up Victoria Metrics for Pod:', error);
    showVMMetrics.value = false;
  } finally {
    fetchState.pending = false;
    console.log('[VM Pod Tab] Fetch completed, showVMMetrics:', showVMMetrics.value);
  }
}

onMounted(async () => {
  console.log('[VM Pod Tab] Component mounted');
  
  // Get route from Vue instance
  const instance = getCurrentInstance();
  if (instance?.proxy?.$route) {
    route = instance.proxy.$route;
    console.log('[VM Pod Tab] Route found:', route.params);
  } else {
    console.log('[VM Pod Tab] No route found');
  }

  determineResource();
  console.log('[VM Pod Tab] Resource determined:', resource.value?.metadata?.name);
  
  await fetchVictoriaMetrics();
});
</script>

<template>
  <div class="victoria-metrics-pod-tab">
    <div v-if="fetchState.pending" class="loading">
      <i class="icon icon-lg icon-spinner icon-spin m-20" />
    </div>
    
    <div v-else-if="!showVMMetrics" class="no-metrics">
      <div class="text-center p-20">
        <p class="text-muted">
          Victoria Metrics dashboards not available for this pod.
        </p>
      </div>
    </div>
    
    <div v-else>
      <VictoriaMetricsWrapper
        :detail-url="POD_VM_DETAIL_URL"
        :summary-url="POD_VM_SUMMARY_URL"
        :vars="graphVars"
        graph-height="600px"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.victoria-metrics-pod-tab {
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