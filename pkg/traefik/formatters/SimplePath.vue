<template>
  <span class="path-text">
    {{ pathDisplay || '/' }}
  </span>
</template>

<script>
export default {
  name: 'SimplePathFormatter',

  props: {
    value: {
      type: String,
      default: ''
    },
    row: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    pathDisplay() {
      return this.value || this.row?.pathDisplay || '/';
    }
  }
};
</script>

<style lang="scss" scoped>
.path-text {
  color: var(--body-text);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}
</style>