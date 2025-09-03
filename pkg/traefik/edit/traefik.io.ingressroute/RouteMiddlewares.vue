<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { random32 } from '@shell/utils/string';

export default {
  emits:      ['input'],
  components: {
    LabeledInput
  },

  props: {
    value: {
      type:    Array,
      default: () => []
    },

    mode: {
      type:    String,
      default: 'edit'
    }
  },

  data() {
    return {
      middlewares: this.value || []
    };
  },

  watch: {
    value: {
      handler(newValue) {
        this.middlewares = newValue || [];
      },
      deep: true
    },

    middlewares: {
      handler(newValue) {
        this.$emit('input', newValue);
      },
      deep: true
    }
  },

  beforeUpdate() {
    // Ensure each middleware has a unique key
    for (const middleware of this.middlewares) {
      if (!middleware.vKey) {
        middleware['vKey'] = random32(1);
      }
    }
  },

  methods: {
    addMiddleware() {
      this.middlewares.push({
        vKey:      random32(1),
        name:      '',
        namespace: ''
      });
    },

    removeMiddleware(index) {
      this.middlewares.splice(index, 1);
    }
  }
};
</script>

<template>
  <div class="middleware-section">
    <h5>{{ t('traefik.ingressRoute.middleware.label') }}</h5>

    <div v-for="(middleware, i) in middlewares" :key="middleware.vKey" class="row mb-10">
      <div class="col span-5">
        <LabeledInput
          v-model="middleware.name"
          :mode="mode"
          :label="t('traefik.ingressRoute.middleware.name.label')"
          :placeholder="t('traefik.ingressRoute.middleware.name.placeholder')"
          :tooltip="t('traefik.ingressRoute.middleware.name.tooltip')"
        />
      </div>
      <div class="col span-5">
        <LabeledInput
          v-model="middleware.namespace"
          :mode="mode"
          :label="t('traefik.ingressRoute.middleware.namespace.label')"
          :placeholder="t('traefik.ingressRoute.middleware.namespace.placeholder')"
          :tooltip="t('traefik.ingressRoute.middleware.namespace.tooltip')"
        />
      </div>
      <div class="col span-2">
        <button 
          type="button" 
          class="btn role-link remove-btn" 
          @click="removeMiddleware(i)"
        >
          {{ t('generic.remove') }}
        </button>
      </div>
    </div>

    <div class="row mt-15">
      <div class="col span-12">
        <button 
          type="button" 
          class="btn role-secondary" 
          @click="addMiddleware"
        >
          {{ t('traefik.ingressRoute.middleware.addMiddleware') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.middleware-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);

  h5 {
    margin-bottom: 15px;
    color: var(--text-color);
  }
}

.remove-btn {
  margin-top: 30px;
}
</style>