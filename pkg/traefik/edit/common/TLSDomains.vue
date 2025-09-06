<script>
import { _EDIT } from '@shell/config/query-params';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import TLSDomain from './TLSDomain';

export default {
  emits: ['validation-changed'],

  components: {
    ArrayListGrouped,
    TLSDomain
  },

  props: {
    value: {
      type:    Object,
      required: true
    },

    mode: {
      type:    String,
      default: _EDIT
    }
  },

  data() {
    return {
      domainValidations: {},
      defaultAddValue: {
        main: '',
        sans: []
      }
    };
  },

  mounted() {
    // Ensure tls object exists
    if (!this.value.spec.tls) {
      this.value.spec.tls = {};
    }

    // Ensure domains array exists
    if (!this.value.spec.tls.domains) {
      this.value.spec.tls.domains = [];
    }
  },

  computed: {
    isValid() {
      // If no domains, consider valid (domains are optional)
      if (!this.value.spec.tls.domains || this.value.spec.tls.domains.length === 0) {
        return true;
      }

      // Check if all domains have been validated
      const allDomainsValidated = this.value.spec.tls.domains.length === Object.keys(this.domainValidations).length;

      if (!allDomainsValidated) {
        return false;
      }

      // Return true only if all domains have validation status and are valid
      return Object.values(this.domainValidations).every(v => v === true);
    }
  },

  methods: {
    domainValidationChanged(isValid, index) {
      // Store validation status for the domain
      this.domainValidations[index] = isValid;
      this.updateValidationStatus();
    },

    updateValidationStatus() {
      this.$emit('validation-changed', this.isValid);
    },

    handleRemove(index) {
      // Clean up validation state when domain is removed
      delete this.domainValidations[index];
      // Re-index validations
      const newValidations = {};
      Object.keys(this.domainValidations).forEach(key => {
        const idx = parseInt(key);
        if (idx > index) {
          newValidations[idx - 1] = this.domainValidations[key];
        } else if (idx < index) {
          newValidations[idx] = this.domainValidations[key];
        }
      });
      this.domainValidations = newValidations;
    }
  },

  watch: {
    isValid: {
      handler(valid) {
        this.$emit('validation-changed', valid);
      },
      immediate: true
    },

    'value.spec.tls.domains.length'() {
      this.updateValidationStatus();
    }
  }
};
</script>

<template>
  <div>
    <ArrayListGrouped
      v-model:value="value.spec.tls.domains"
      :add-label="t('traefik.ingressRoute.tls.domains.addDomain')"
      :default-add-value="defaultAddValue"
      :mode="mode"
      :initial-empty-row="false"
      @remove="handleRemove"
    >
      <template #default="props">
        <TLSDomain
          :value="props.row.value"
          :index="props.i"
          :mode="mode"
          @remove="props.remove"
          @validation-changed="(valid, index) => domainValidationChanged(valid, index)"
        />
      </template>
    </ArrayListGrouped>
  </div>
</template>

<style lang="scss" scoped>
// Use default ArrayListGrouped styling
</style>