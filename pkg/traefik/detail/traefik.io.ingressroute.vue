<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import RoutesTable from '../components/RoutesTable.vue';
import TLSConfiguration from '../components/TLSConfiguration.vue';
import EntryPoints from '../components/EntryPoints.vue';

export default {
  name: 'IngressRouteDetail',

  components: {
    ResourceTabs,
    Tab,
    RoutesTable,
    TLSConfiguration,
    EntryPoints
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

  data() {
    return {
      relationshipsInitialized: false
    };
  },

  async mounted() {
    // Initialize relationships once on mount
    if (this.value && typeof this.value.refreshRelationships === 'function') {
      this.value.refreshRelationships();
      this.relationshipsInitialized = true;

      // Wait for next render cycle without forcing update
      await this.$nextTick();
    }
  },

  computed: {
    // Check if we have valid relationships
    hasValidRelationships() {
      // Access the getter to ensure reactivity
      const relationships = this.value?.relationships || this.value?.metadata?.relationships;
      return Array.isArray(relationships) && relationships.length > 0;
    }
  },

  watch: {
    // Watch for value changes and refresh relationships
    value: {
      handler(newValue) {
        // Only refresh if value changed and not already initialized
        if (newValue &&
            typeof newValue.refreshRelationships === 'function' &&
            !this.relationshipsInitialized) {
          newValue.refreshRelationships();
          this.relationshipsInitialized = true;
        }
      },
      immediate: false  // Avoid execution before mounted
    }
  },

  methods: {
    t(key) {
      return this.$store.getters['i18n/t'](key);
    }
  }
};
</script>

<template>
  <div>
    <!-- EntryPoints section at the top -->
    <EntryPoints :value="value" :mode="mode" />
    
    <ResourceTabs
      :value="value"
      :mode="mode"
      :need-related="hasValidRelationships"
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
  </div>
</template>

<style lang="scss" scoped>
/* Styles moved to individual components */
</style>