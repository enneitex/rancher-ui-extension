<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Banner } from '@components/Banner';

export default {
  name: 'IngressClassTab',
  
  emits: ['update'],
  
  components: {
    LabeledSelect,
    Banner
  },

  props: {
    value: {
      type:     Object,
      required: true
    },

    mode: {
      type:    String,
      default: 'edit'
    },

    ingressClasses: {
      type:    Array,
      default: () => []
    }
  },
  
  computed: {
    // Direct computed property following Rancher patterns
    currentIngressClass: {
      get() {
        return this.value?.metadata?.annotations?.['kubernetes.io/ingress.class'] || '';
      },
      set(val) {
        // Ensure the value object has the required structure (following Rancher pattern)
        if (!this.value.metadata) {
          this.value.metadata = {};
        }
        
        if (!this.value.metadata.annotations) {
          this.value.metadata.annotations = {};
        }
        
        if (val && val !== '') {
          // Direct assignment following Rancher pattern
          this.value.metadata.annotations['kubernetes.io/ingress.class'] = val;
        } else {
          // Direct delete following Rancher pattern  
          delete this.value.metadata.annotations['kubernetes.io/ingress.class'];
        }
        
        // Emit update event to notify parent
        this.$emit('update');
      }
    },
    
    ingressClassOptions() {
      const options = this.ingressClasses.map(ingressClass => ({
        label: ingressClass.metadata.name,
        value: ingressClass.metadata.name
      }));

      // Add an option for "None" to allow clearing the annotation
      return [
        { label: this.t('traefik.ingressRoute.ingressClass.none'), value: '' },
        ...options
      ];
    },

    hasIngressClasses() {
      return this.ingressClasses && this.ingressClasses.length > 0;
    }
  }
};
</script>

<template>
  <div class="ingress-class-tab">
    <div class="row mb-20">
      <div class="col span-12">
        <Banner 
          color="info" 
          :label="t('traefik.ingressRoute.ingressClass.description')"
        />
      </div>
    </div>

    <div v-if="!hasIngressClasses && mode !== 'view'" class="row mb-20">
      <div class="col span-12">
        <Banner
          color="warning"
          :label="t('traefik.ingressRoute.ingressClass.noIngressClasses')"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-12">
        <LabeledSelect
          v-model:value="currentIngressClass"
          :mode="mode"
          :label="t('traefik.ingressRoute.ingressClass.label')"
          :placeholder="t('traefik.ingressRoute.ingressClass.placeholder')"
          :tooltip="t('traefik.ingressRoute.ingressClass.tooltip')"
          :options="ingressClassOptions"
          :disabled="!hasIngressClasses && mode !== 'view'"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ingress-class-tab {
  .row {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>