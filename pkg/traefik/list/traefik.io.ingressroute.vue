<script>
import ResourceTable from '@shell/components/ResourceTable';
import { STATE, NAME, NAMESPACE, AGE } from '@shell/config/table-headers';
import RoutesList from '../formatters/RoutesList.vue';
import IngressClass from '../formatters/IngressClass.vue';

export default {
  name:       'IngressRouteList',
  components: { ResourceTable, RoutesList, IngressClass },

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
          name:     'routes',
          labelKey: 'traefik.headers.routes',
          value:    'targetRoutes',
          sort:     false,
        },
        {
          name:      'ingressClass',
          labelKey:  'traefik.ingressRoute.ingressClass.label',
          value:     'ingressClass',
          sort:      'ingressClass',
        },
        {
          name:     'entryPoints',
          labelKey: 'traefik.headers.entryPoints',
          value:    'spec.entryPoints',
          sort:     'spec.entryPoints',
          formatter: 'List',
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
    <!-- Custom cell for routes using formatter -->
    <template #cell:routes="{row}">
      <RoutesList :row="row" />
    </template>
  </ResourceTable>
</template>

<style scoped>
/* Styles handled by the IngressHosts formatter component */
</style>