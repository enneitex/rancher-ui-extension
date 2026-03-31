<script>
import Loading from '@shell/components/Loading';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import TypeDescription from '@shell/components/TypeDescription';
import ResourceTable from '@shell/components/ResourceTable';
import { Banner } from '@components/Banner';
import { MONITORING } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

const PROBE         = 'monitoring.coreos.com.probe';
const VM_POD_SCRAPE = 'operator.victoriametrics.com.vmpodscrape';
const VM_SVC_SCRAPE = 'operator.victoriametrics.com.vmservicescrape';

export default {
  components: {
    Loading, Tabbed, Tab, ResourceTable, TypeDescription, Banner
  },

  async fetch() {
    const get = (type) => this.$store.getters['cluster/schemaFor'](type);

    this.podMonitorSchema     = get(MONITORING.PODMONITOR);
    this.serviceMonitorSchema = get(MONITORING.SERVICEMONITOR);
    this.probeSchema          = get(PROBE);
    this.vmPodScrapeSchema    = get(VM_POD_SCRAPE);
    this.vmSvcScrapeSchema    = get(VM_SVC_SCRAPE);

    if (this.noSchemas) {
      return;
    }

    const hash = {};
    if (this.podMonitorSchema)     hash.podMonitors     = this.$store.dispatch('cluster/findAll', { type: MONITORING.PODMONITOR });
    if (this.serviceMonitorSchema) hash.serviceMonitors  = this.$store.dispatch('cluster/findAll', { type: MONITORING.SERVICEMONITOR });
    if (this.probeSchema)          hash.probes           = this.$store.dispatch('cluster/findAll', { type: PROBE });
    if (this.vmPodScrapeSchema)    hash.vmPodScrapes     = this.$store.dispatch('cluster/findAll', { type: VM_POD_SCRAPE });
    if (this.vmSvcScrapeSchema)    hash.vmSvcScrapes     = this.$store.dispatch('cluster/findAll', { type: VM_SVC_SCRAPE });

    const res = await allHash(hash);
    this.podMonitors     = res.podMonitors     || [];
    this.serviceMonitors  = res.serviceMonitors  || [];
    this.probes           = res.probes           || [];
    this.vmPodScrapes     = res.vmPodScrapes     || [];
    this.vmSvcScrapes     = res.vmSvcScrapes     || [];
  },

  data() {
    return {
      podMonitors: [], serviceMonitors: [], probes: [], vmPodScrapes: [], vmSvcScrapes: [],
      podMonitorSchema: null, serviceMonitorSchema: null, probeSchema: null,
      vmPodScrapeSchema: null, vmSvcScrapeSchema: null,
      initTab: this.$route.query.resource || VM_POD_SCRAPE,
    };
  },

  computed: {
    noSchemas() {
      return !this.podMonitorSchema && !this.serviceMonitorSchema &&
             !this.probeSchema && !this.vmPodScrapeSchema && !this.vmSvcScrapeSchema;
    },

    createRoute() {
      const activeResource = this.$refs?.tabs?.activeTabName || this.vmPodScrapeSchema?.id;

      return {
        name:   'c-cluster-monitoring-monitor-create',
        params: { cluster: this.$route.params.cluster },
        query:  { resource: activeResource },
      };
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <Banner
    v-else-if="noSchemas"
    color="info"
    :label="t('monitoring.monitors.noCRDs')"
  />
  <div v-else>
    <div class="row header mb-40">
      <h1>{{ t('monitoring.monitors.title') }}</h1>
      <div>
        <button
          class="btn btn-lg role-primary float right"
          @click="$router.push(createRoute)"
        >
          {{ t('resourceList.head.createFromYaml') }}
        </button>
      </div>
    </div>
    <Tabbed
      ref="tabs"
      :default-tab="initTab"
    >
      <Tab
        v-if="vmPodScrapeSchema"
        :name="vmPodScrapeSchema.id"
        :label="t('monitoring.monitors.vmPodScrape.label')"
      >
        <Banner
          color="info"
          :label="t('monitoring.monitors.vmPodScrape.description')"
        />
        <ResourceTable
          :schema="vmPodScrapeSchema"
          :rows="vmPodScrapes"
        />
      </Tab>
      <Tab
        v-if="vmSvcScrapeSchema"
        :name="vmSvcScrapeSchema.id"
        :label="t('monitoring.monitors.vmSvcScrape.label')"
      >
        <Banner
          color="info"
          :label="t('monitoring.monitors.vmSvcScrape.description')"
        />
        <ResourceTable
          :schema="vmSvcScrapeSchema"
          :rows="vmSvcScrapes"
        />
      </Tab>
      <Tab
        v-if="probeSchema"
        :name="probeSchema.id"
        :label="t('monitoring.monitors.probe.label')"
      >
        <Banner
          color="info"
          :label="t('monitoring.monitors.probe.description')"
        />
        <ResourceTable
          :schema="probeSchema"
          :rows="probes"
        />
      </Tab>
      <Tab
        v-if="podMonitorSchema"
        :name="podMonitorSchema.id"
        :label="$store.getters['type-map/labelFor'](podMonitorSchema, 2)"
      >
        <TypeDescription :resource="podMonitorSchema.id" />
        <ResourceTable
          :schema="podMonitorSchema"
          :rows="podMonitors"
        />
      </Tab>
      <Tab
        v-if="serviceMonitorSchema"
        :name="serviceMonitorSchema.id"
        :label="$store.getters['type-map/labelFor'](serviceMonitorSchema, 2)"
      >
        <TypeDescription :resource="serviceMonitorSchema.id" />
        <ResourceTable
          :schema="serviceMonitorSchema"
          :rows="serviceMonitors"
        />
      </Tab>
    </Tabbed>
  </div>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  h1 { flex: 1; }
}
</style>
