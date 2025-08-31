<template>
  <ResourceTabs
    :value="value"
    :mode="mode"
  >
    <!-- Routes Tab -->
    <Tab
      name="routes"
      :label="t('traefik.ingressRoute.routes.label')"
      :weight="10"
    >
      <RoutesTable :value="value" />
    </Tab>

    <!-- TLS Tab -->
    <Tab
      name="tls"
      :label="t('traefik.ingressRoute.tls.label')"
      :weight="9"
    >
      <TLSConfiguration :value="value" />
    </Tab>
  </ResourceTabs>
</template>

<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import RoutesTable from '../components/RoutesTable.vue';
import TLSConfiguration from '../components/TLSConfiguration.vue';

export default {
  name: 'IngressRouteDetail',

  components: {
    ResourceTabs,
    Tab,
    RoutesTable,
    TLSConfiguration
  },

  props: {
    value: {
      type: Object,
      required: true
    },
    mode: {
      type: String,
      default: 'view'
    }
  },

  methods: {
    t(key) {
      return this.$store.getters['i18n/t'](key);
    }
  }
};
</script>

<style lang="scss" scoped>
/* Styles moved to individual components */
</style>