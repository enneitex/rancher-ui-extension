<template>
  <span
    v-if="ownerRef"
    v-clean-tooltip="tooltipContent"
    class="managed-by-owner"
  >
    <i class="icon icon-checkmark" />
  </span>
  <span
    v-else
    class="text-muted"
  >
    &mdash;
  </span>
</template>

<script>
export default {
  name: 'ManagedByOwner',

  props: {
    value: { type: Object, default: null },
    row:   { type: Object, default: null },
  },

  computed: {
    ownerRef() {
      return (this.value || this.row)?.metadata?.ownerReferences?.[0] ?? null;
    },

    tooltipContent() {
      return this.t('monitoring.managedByOwner.tooltip', {
        kind: this.ownerRef.kind,
        name: this.ownerRef.name,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.managed-by-owner {
  cursor: help;
}
</style>
