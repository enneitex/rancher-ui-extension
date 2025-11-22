<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import MiddlewareTypes from '../formatters/MiddlewareTypes.vue';

export default {
  name:       'MiddlewareList',
  components: { PaginatedResourceTable, MiddlewareTypes },

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
    <!-- Custom cell for middleware types using formatter -->
    <template #cell:types="{row}">
      <MiddlewareTypes :row="row" />
    </template>
  </PaginatedResourceTable>
</template>

<style scoped>
/* Styles handled by ResourceTable and MiddlewareTypes formatter */
</style>