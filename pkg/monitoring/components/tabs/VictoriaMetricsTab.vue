<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import { POD, NODE } from '@shell/config/types';
import {
  loadVMConfigFromCluster,
  loadVMDashboardIdsFromCluster,
  generateVMUrl,
  dashboardExists,
} from '../../utils/victoria-metrics';

const store   = useStore();
const route   = useRoute();
const pending = ref(true);
const notInstalled     = ref(false);
const missingDashboard = ref<string | null>(null);

const detailUrl  = ref('');
const summaryUrl = ref('');
const resource   = ref<any>(null);

type ResourceCategory = 'pod' | 'node' | 'workload';

const resourceCategory = computed<ResourceCategory>(() => {
  const r = route.params.resource as string || '';

  if (r === POD)  return 'pod';
  if (r === NODE) return 'node';

  return 'workload';
});

const graphVars = computed(() => {
  const meta = resource.value?.metadata || {};

  if (resourceCategory.value === 'pod') {
    return { namespace: meta.namespace || '', pod: meta.name || '' };
  }
  if (resourceCategory.value === 'node') {
    return { instance: meta.name || '' };
  }

  return { namespace: meta.namespace || '', workload: meta.name || '' };
});

onMounted(async () => {
  try {
    const { resource: resourceType, id, namespace } = route.params as Record<string, string>;
    const fullId = namespace?.length > 0 ? `${ namespace }/${ id }` : id;
    resource.value = store.getters['cluster/byId'](resourceType, fullId);

    if (!resource.value) {
      notInstalled.value = true;
      return;
    }

    const [config, ids] = await Promise.all([
      loadVMConfigFromCluster(store),
      loadVMDashboardIdsFromCluster(store),
    ]);

    if (!config) {
      notInstalled.value = true;
      return;
    }

    const clusterId = store.getters['currentCluster']?.id;
    const { detailDashboardId: detailId, summaryDashboardId: summaryId } = ids[resourceCategory.value];

    const [detailOk, summaryOk] = await Promise.all([
      dashboardExists(store, clusterId, config, detailId),
      detailId === summaryId ? Promise.resolve(true) : dashboardExists(store, clusterId, config, summaryId),
    ]);

    if (!detailOk) {
      missingDashboard.value = detailId.split('/')[0];
      return;
    }
    if (!summaryOk) {
      missingDashboard.value = summaryId.split('/')[0];
      return;
    }

    detailUrl.value  = generateVMUrl(config.namespace, config.service, config.port, detailId);
    summaryUrl.value = generateVMUrl(config.namespace, config.service, config.port, summaryId);
  } catch (e) {
    console.error(`[vm] ${ resourceCategory.value }Tab init error:`, e);
    notInstalled.value = true;
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <Loading v-if="pending" />
  <Banner
    v-else-if="notInstalled"
    color="info"
    :label="t('victoriaMetrics.notInstalled')"
  />
  <Banner
    v-else-if="missingDashboard"
    color="warning"
    :label="`Dashboard UID '${ missingDashboard }' not found in Grafana. Update ${ resourceCategory }.detailDashboardId / ${ resourceCategory }.summaryDashboardId in ConfigMap kube-monitoring/vmks-monitoring.`"
  />
  <DashboardMetrics
    v-else
    :detail-url="detailUrl"
    :summary-url="summaryUrl"
    :vars="graphVars"
    graph-height="600px"
  />
</template>
