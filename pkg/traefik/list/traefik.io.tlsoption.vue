<script>
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import CompactList from '../formatters/CompactList.vue';

export default {
  name:       'TLSOptionList',
  components: { PaginatedResourceTable, CompactList },

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
  </PaginatedResourceTable>
</template>

<style scoped>
/* Styles handled by ResourceTable */
</style>