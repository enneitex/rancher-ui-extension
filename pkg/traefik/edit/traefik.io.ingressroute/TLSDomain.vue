<script>
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  emits:      ['update', 'remove'],
  components: {
    LabeledInput
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    index: {
      type:     Number,
      required: true
    },

    mode: {
      type:    String,
      default: 'edit'
    },

    rules: {
      default: () => [],
      type:    Array
    }
  },

  data() {
    return {
      localDomain: { ...this.value }
    };
  },

  watch: {
    value: {
      handler(newValue) {
        this.localDomain = { ...newValue };
      },
      deep: true
    },

    localDomain: {
      handler(newValue) {
        this.$emit('update', newValue);
      },
      deep: true
    }
  },

  computed: {
    sansAsString: {
      get() {
        return Array.isArray(this.localDomain.sans) ? this.localDomain.sans.join(', ') : '';
      },
      set(value) {
        this.localDomain.sans = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
      }
    }
  },

  methods: {
    remove() {
      this.$emit('remove');
    }
  }
};
</script>

<template>
  <div class="domain-row row mb-10">
    <div class="col span-5">
      <LabeledInput
        v-model="localDomain.main"
        :mode="mode"
        :label="t('traefik.ingressRoute.tls.domains.main.label')"
        :placeholder="t('traefik.ingressRoute.tls.domains.main.placeholder')"
        :rules="rules"
      />
    </div>
    <div class="col span-5">
      <LabeledInput
        v-model="sansAsString"
        :mode="mode"
        :label="t('traefik.ingressRoute.tls.domains.sans.label')"
        :placeholder="t('traefik.ingressRoute.tls.domains.sans.placeholder')"
        :tooltip="t('traefik.ingressRoute.tls.domains.sans.tooltip')"
      />
    </div>
    <div class="col span-2">
      <button 
        type="button" 
        class="btn role-link remove-btn" 
        @click="remove"
      >
        {{ t('generic.remove') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.remove-btn {
  margin-top: 30px;
}
</style>