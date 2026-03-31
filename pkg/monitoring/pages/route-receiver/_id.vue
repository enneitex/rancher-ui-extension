<script>
/**
 * The Route and Receiver resources are deprecated. Going forward,
 * routes and receivers should be configured within AlertmanagerConfigs.
 */
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name: 'VmRouteReceiverDetail',

  components: { ResourceDetail },

  data() {
    return { resource: null };
  },

  created() {
    this.resource = this.$route.query.resource;
  },
};
</script>

<template>
  <ResourceDetail :resource-override="resource" />
</template>
