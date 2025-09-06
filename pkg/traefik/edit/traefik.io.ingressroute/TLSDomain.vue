<script>
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  emits:      ['remove', 'validation-changed'],
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

  computed: {
    sansAsString: {
      get() {
        return Array.isArray(this.value.sans) ? this.value.sans.join(', ') : '';
      },
      set(val) {
        this.value.sans = val ? val.split(',').map(s => s.trim()).filter(s => s) : [];
      }
    },

    isValid() {
      // A domain entry is valid if at least main domain is provided
      return !!this.value.main;
    }
  },

  watch: {
    isValid: {
      handler(valid) {
        this.$emit('validation-changed', valid, this.index);
      },
      immediate: true
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
        v-model:value="value.main"
        :mode="mode"
        :label="t('traefik.ingressRoute.tls.domains.main.label')"
        :placeholder="t('traefik.ingressRoute.tls.domains.main.placeholder')"
        :rules="rules"
        :required="true"
        :error="!value.main ? t('validation.required', { key: t('traefik.ingressRoute.tls.domains.main.label') }) : ''"
      />
    </div>
    <div class="col span-5">
      <LabeledInput
        v-model:value="sansAsString"
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