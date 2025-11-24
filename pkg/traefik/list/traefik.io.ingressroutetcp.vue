<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import RoutesList from '../formatters/RoutesList.vue';

export default {
  name:       'IngressRouteTCPList',
  components: { PaginatedResourceTable, RoutesList },

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
  }
};
</script>

<template>
  <PaginatedResourceTable
    :schema="schema"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  >
    <!-- Custom cell for routes using formatter -->
    <template #cell:routes="{row}">
      <RoutesList :row="row" />
    </template>

    <!-- Custom cell for ingress class -->
    <template #cell:ingressClass="{row}">
      {{ row.ingressClass }}
    </template>
  </PaginatedResourceTable>
</template>

<style scoped>
/* Styles handled by the formatters */
</style>