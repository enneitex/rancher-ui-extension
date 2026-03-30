<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import {
  loadVMConfigFromCluster,
  loadVMDashboardIdsFromCluster,
  hasVictoriaMetrics,
  generateVMUrl,
  allVmDashboardsExist,
} from '../../utils/victoria-metrics';

const store  = useStore();
const route  = useRoute();
const pending = ref(true);
const reason  = ref<'not-installed' | 'not-reachable' | null>(null);

const detailUrl  = ref('');
const summaryUrl = ref('');
const resource   = ref<any>(null);

const graphVars = computed(() => ({
  namespace: resource.value?.metadata?.namespace || '',
  pod:       resource.value?.metadata?.name      || '',
}));

onMounted(async () => {
  const { resource: resourceType, id, namespace } = route.params as Record<string, string>;
  const fullId = namespace ? `${namespace}/${id}` : id;
  resource.value = store.getters['cluster/byId'](resourceType, fullId);

  if (!resource.value) {
    reason.value = 'not-installed';
    pending.value = false;
    return;
  }

  const clusterId = store.getters['currentCluster']?.id;

  const [config, ids] = await Promise.all([
    loadVMConfigFromCluster(store),
    loadVMDashboardIdsFromCluster(store),
  ]);

  console.debug('[vm] resolved config:', `namespace=${config.namespace}`, `service=${config.service}`, `port=${config.port}`, `source=${config.source}`);

  const installed = await hasVictoriaMetrics(store, config.namespace, config.service);
  if (!installed) {
    reason.value = 'not-installed';
    pending.value = false;
    return;
  }

  detailUrl.value  = generateVMUrl(config.namespace, config.service, config.port, ids.pod.detailDashboardId);
  summaryUrl.value = generateVMUrl(config.namespace, config.service, config.port, ids.pod.summaryDashboardId);

  const reachable = await allVmDashboardsExist(
    store,
    clusterId,
    [detailUrl.value, summaryUrl.value],
    config
  );
  if (!reachable) {
    reason.value = 'not-reachable';
    pending.value = false;
    return;
  }

  reason.value  = null;
  pending.value = false;
});
</script>

<template>
  <Loading v-if="pending" />
  <Banner
    v-else-if="reason === 'not-installed'"
    color="info"
    :label="t('victoriaMetrics.notInstalled')"
  />
  <Banner
    v-else-if="reason === 'not-reachable'"
    color="warning"
    :label="t('victoriaMetrics.notReachable')"
  />
  <DashboardMetrics
    v-else
    :detail-url="detailUrl"
    :summary-url="summaryUrl"
    :vars="graphVars"
    graph-height="600px"
  />
</template>
