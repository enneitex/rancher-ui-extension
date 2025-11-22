<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import RoutesTable from '../components/RoutesTable.vue';
import TLSConfiguration from '../components/TLSConfiguration.vue';

export default {
  name: 'IngressRouteTCPDetail',

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
    <ResourceTabs
      :value="value"
      :mode="mode"
      :need-related="hasValidRelationships"
    >
      <!-- Routes Tab -->
      <Tab
        name="routes"
        :label="t('traefik.ingressRouteTCP.route.label')"
        :weight="10"
      >
        <RoutesTable :value="value" :is-tcp="true" />
      </Tab>

      <!-- TLS Tab -->
      <Tab
        name="tls"
        :label="t('traefik.ingressRouteTCP.tls.label')"
        :weight="9"
      >
        <TLSConfiguration :value="value" :is-tcp="true" />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
/* Styles moved to individual components */
</style>