<script>
import ResourceTable from '@shell/components/ResourceTable';
import { STATE, NAME, NAMESPACE, AGE } from '@shell/config/table-headers';
import CompactList from '../formatters/CompactList.vue';

export default {
  name:       'TLSOptionList',
  components: { ResourceTable, CompactList },

  props: {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    headers() {
      return [
        STATE,
        NAME,
        NAMESPACE,
        {
          name:     'minVersion',
          labelKey: 'traefik.tlsOption.minVersion.label',
          value:    'spec.minVersion',
          sort:     'spec.minVersion',
        },
        {
          name:     'maxVersion',
          labelKey: 'traefik.tlsOption.maxVersion.label',
          value:    'spec.maxVersion',
          sort:     'spec.maxVersion',
        },
        {
          name:      'cipherSuites',
          labelKey:  'traefik.tlsOption.cipherSuites.label',
          value:     'spec.cipherSuites',
          sort:      false,
        },
        AGE
      ];
    },

    rows() {
      return this.$store.getters['cluster/all'](this.resource) || [];
    }
  }
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="rows"
    :headers="headers"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  >
    <!-- Custom cell for min version with dash when empty -->
    <template #cell:minVersion="{row}">
      <span>{{ row.spec?.minVersion || '—' }}</span>
    </template>

    <!-- Custom cell for max version with dash when empty -->
    <template #cell:maxVersion="{row}">
      <span>{{ row.spec?.maxVersion || '—' }}</span>
    </template>

    <!-- Custom cell for cipher suites using compact list -->
    <template #cell:cipherSuites="{row}">
      <CompactList :value="row.spec?.cipherSuites" />
    </template>
  </ResourceTable>
</template>

<style scoped>
/* Styles handled by ResourceTable */
</style>