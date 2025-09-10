<script>
import ResourceTable from '@shell/components/ResourceTable';
import { STATE, NAME, NAMESPACE, AGE } from '@shell/config/table-headers';
import MiddlewareTypes from '../formatters/MiddlewareTypes.vue';

export default {
  name:       'MiddlewareList',
  components: { ResourceTable, MiddlewareTypes },


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
          name:     'types',
          labelKey: 'traefik.middleware.types.label',
          value:    'spec',
          sort:     false,
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
    <!-- Custom cell for middleware types using formatter -->
    <template #cell:types="{row}">
      <MiddlewareTypes :row="row" />
    </template>
  </ResourceTable>
</template>

<style scoped>
/* Styles handled by ResourceTable and MiddlewareTypes formatter */
</style>