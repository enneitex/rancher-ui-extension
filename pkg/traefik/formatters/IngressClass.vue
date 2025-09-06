<template>
  <span>{{ ingressClass }}</span>
</template>

<script>
export default {
  name: 'IngressClassFormatter',
  
  props: {
    value: {
      type: [String, Object],
      default: null
    },
    row: {
      type: Object,
      default: () => ({})
    }
  },
  
  computed: {
    ingressClass() {
      // Try to get the ingress class from the annotation
      return this.row?.metadata?.annotations?.['kubernetes.io/ingress.class'] || '-';
    }
  }
};
</script>