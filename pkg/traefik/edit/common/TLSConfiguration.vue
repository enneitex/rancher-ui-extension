<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import TLSDomains from './TLSDomains';
import { random32 } from '@shell/utils/string';
import { get, set, remove } from '@shell/utils/object';

export default {
  emits: ['tls-validation-changed'],

  components: {
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    Checkbox,
    Banner,
    TLSDomains
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

    secretTargets: {
      type:    Array,
      default: () => []
    },

    tlsOptionsTargets: {
      type:    Array,
      default: () => []
    },

    tlsStoresTargets: {
      type:    Array,
      default: () => []
    },

    namespace: {
      type: String,
      default: 'default'
    },

    supportPassthrough: {
      type: Boolean,
      default: false
    },

    isTcp: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      tlsMode: false, // État direct pour le mode TLS (true = enabled, false = disabled)
      passthrough: false // État pour le TLS Passthrough (TCP uniquement)
    };
  },

  mounted() {
    // Always ensure spec.tls exists
    if (!this.value.spec.tls) {
      this.value.spec.tls = {};
    }

    // Ensure domains is always an array
    if (!Array.isArray(this.value.spec.tls.domains)) {
      this.value.spec.tls.domains = [];
    }

    // Initialize passthrough state
    this.passthrough = !!this.value.spec.tls.passthrough;

    // Initialiser le tlsMode en fonction de l'état actuel
    this.initTlsMode();
    this.ensureDomainKeys();
  },

  computed: {
    // Évalue si TLS a des champs configurés
    hasTlsFields() {
      const tls = this.value.spec.tls;
      if (!tls) return false;

      return !!(
        tls.secretName ||
        tls.certResolver ||
        tls.passthrough ||
        (tls.options && tls.options.name) ||
        (tls.store && tls.store.name) ||
        (tls.domains && tls.domains.length > 0)
      );
    },

    // Validation du formulaire TLS
    isValid() {
      // Toujours valide si TLS est désactivé
      // Si TLS est activé, au moins un champ doit être rempli
      return !this.tlsMode || this.hasTlsFields;
    },

    // TLS Secret Name Value Helper
    tlsSecretValue() {
      return get(this.value, 'spec.tls.secretName') || '';
    },

    // TLS Certificate Resolver Value Helper
    tlsCertResolverValue() {
      return get(this.value, 'spec.tls.certResolver') || '';
    },

    // TLS Options Value Helper
    tlsOptionsValue() {
      return get(this.value, 'spec.tls.options.name') || '';
    },

    // TLS Store Value Helper
    tlsStoreValue() {
      return get(this.value, 'spec.tls.store.name') || '';
    },

    // Helper pour l'affichage des sans
    sansAsString() {
      return (domain) => {
        return Array.isArray(domain.sans) ? domain.sans.join(', ') : '';
      };
    }
  },

  methods: {
    // Initialise l'état tlsMode en fonction des données existantes
    initTlsMode() {
      // Si TLS a des champs renseignés, considérer comme activé
      this.tlsMode = this.hasTlsFields;
    },

    // Gère le changement de mode TLS (enable/disable)
    tlsModeChanged(enabled) {
      if (!enabled) {
        // Clear all TLS fields but keep the object empty
        this.value.spec.tls = {};
      } else {
        // Ensure TLS object exists with domains array
        if (!this.value.spec.tls) {
          this.value.spec.tls = {};
        }
        // Ensure domains is always an array
        if (!Array.isArray(this.value.spec.tls.domains)) {
          this.value.spec.tls.domains = [];
        }
      }

      // Emit validation status
      this.$emit('tls-validation-changed', this.isValid);
    },

    // Set TLS Secret Name
    updateSecretName(val) {
      if (!this.value.spec.tls) {
        this.value.spec.tls = {};
      }

      // Ensure domains is always an array when updating TLS fields
      if (!Array.isArray(this.value.spec.tls.domains)) {
        this.value.spec.tls.domains = [];
      }

      if (val) {
        set(this.value, 'spec.tls.secretName', val);
      } else {
        remove(this.value, 'spec.tls.secretName');
      }
    },

    // Set TLS Certificate Resolver
    updateCertResolver(val) {
      if (!this.value.spec.tls) {
        this.value.spec.tls = {};
      }

      // Ensure domains is always an array when updating TLS fields
      if (!Array.isArray(this.value.spec.tls.domains)) {
        this.value.spec.tls.domains = [];
      }

      if (val) {
        set(this.value, 'spec.tls.certResolver', val);
      } else {
        remove(this.value, 'spec.tls.certResolver');
      }
    },

    // Set TLS Options using Rancher utilities
    ensureOptionsObject(val) {
      // Ensure domains is always an array when updating TLS fields
      if (!Array.isArray(this.value.spec.tls?.domains)) {
        if (!this.value.spec.tls) {
          this.value.spec.tls = {};
        }
        this.value.spec.tls.domains = [];
      }

      if (val) {
        set(this.value, 'spec.tls.options.name', val);
      } else {
        remove(this.value, 'spec.tls.options');
      }
    },

    // Set TLS Store using Rancher utilities
    ensureStoreObject(val) {
      // Ensure domains is always an array when updating TLS fields
      if (!Array.isArray(this.value.spec.tls?.domains)) {
        if (!this.value.spec.tls) {
          this.value.spec.tls = {};
        }
        this.value.spec.tls.domains = [];
      }

      if (val) {
        set(this.value, 'spec.tls.store.name', val);
      } else {
        remove(this.value, 'spec.tls.store');
      }
    },

    ensureDomainKeys() {
      // Ensure all domains have vKey for UI tracking
      if (this.value.spec.tls?.domains) {
        for (const domain of this.value.spec.tls.domains) {
          if (!domain.vKey) {
            domain.vKey = random32(1);
          }
        }
      }
    },

    // Handle TLS Passthrough toggle
    updatePassthrough(enabled) {
      if (!this.value.spec.tls) {
        this.value.spec.tls = {};
      }

      if (enabled) {
        this.value.spec.tls.passthrough = true;
      } else {
        delete this.value.spec.tls.passthrough;
      }

      // Emit validation status
      this.$emit('tls-validation-changed', this.isValid);
    }
  },

  updated() {
    this.ensureDomainKeys();
  },

  watch: {
    isValid: {
      handler(valid) {
        this.$emit('tls-validation-changed', valid);
      },
      immediate: true
    },

    // Si les données TLS changent, réinitialiser l'état tlsMode
    hasTlsFields: {
      handler(hasFields) {
        // Si on a des champs mais que le mode est désactivé, activer le mode
        if (hasFields && !this.tlsMode) {
          this.tlsMode = true;
        }
      }
    },

    // Quand tlsMode change, émettre l'événement de validation
    tlsMode(enabled) {
      // Si TLS est désactivé, c'est toujours valide
      // Si TLS est activé, dépend des champs remplis
      const isValid = !enabled || this.hasTlsFields;
      this.$emit('tls-validation-changed', isValid);
    },

    // Watch passthrough changes
    passthrough(enabled) {
      this.updatePassthrough(enabled);
    }
  }
};
</script>

<template>
  <div class="tls-configuration">
    <!-- RadioGroup for enabling/disabling TLS -->
    <div class="row mb-20">
      <div class="col span-12">
        <RadioGroup
          v-model:value="tlsMode"
          name="tls-mode"
          :options="[false, true]"
          :labels="[t('traefik.ingressRoute.tls.mode.disabled'), t('traefik.ingressRoute.tls.mode.enabled')]"
          :mode="mode"
          @update:value="tlsModeChanged"
        />
      </div>
    </div>

    <Banner
      v-if="!tlsMode && mode !== 'view'"
      color="info"
      :label="isTcp ? t('traefik.ingressRouteTCP.tls.notConfigured') : t('traefik.ingressRoute.tls.notConfigured')"
    />

    <!-- Validation message if TLS enabled but no fields filled -->
    <Banner
      v-if="tlsMode && !hasTlsFields && mode !== 'view'"
      color="warning"
      :label="t('traefik.ingressRoute.tls.validation.atLeastOne')"
    />

    <!-- TLS Configuration - visible when mode is enabled -->
    <template v-if="tlsMode">

      <div v-if="supportPassthrough" class="row mb-20">
        <div class="col span-12">
          <Checkbox
            v-model:value="passthrough"
            :mode="mode"
            :label="t('traefik.ingressRouteTCP.tls.passthrough.label')"
            :tooltip="t('traefik.ingressRouteTCP.tls.passthrough.tooltip')"
          />
        </div>
      </div>

      <!-- TLS Secret and Options -->
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            :value="tlsSecretValue"
            :mode="mode"
            :label="t('traefik.ingressRoute.tls.secretName.label')"
            :placeholder="t('traefik.ingressRoute.tls.secretName.placeholder')"
            :tooltip="t('traefik.ingressRoute.tls.secretName.tooltip')"
            :options="secretTargets"
            :clearable="true"
            @update:value="updateSecretName"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            :value="tlsOptionsValue"
            :mode="mode"
            :label="t('traefik.ingressRoute.tls.options.label')"
            :placeholder="t('traefik.ingressRoute.tls.options.placeholder')"
            :tooltip="t('traefik.ingressRoute.tls.options.tooltip')"
            :options="tlsOptionsTargets"
            :clearable="true"
            @update:value="ensureOptionsObject"
          />
        </div>
      </div>

      <!-- Certificate Resolver and Store -->
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            :value="tlsCertResolverValue"
            :mode="mode"
            :label="t('traefik.ingressRoute.tls.certResolver.label')"
            :placeholder="t('traefik.ingressRoute.tls.certResolver.placeholder')"
            :tooltip="t('traefik.ingressRoute.tls.certResolver.tooltip')"
            @update:value="updateCertResolver"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            :value="tlsStoreValue"
            :mode="mode"
            :label="t('traefik.ingressRoute.tls.store.label')"
            :placeholder="t('traefik.ingressRoute.tls.store.placeholder')"
            :tooltip="t('traefik.ingressRoute.tls.store.tooltip')"
            :options="tlsStoresTargets"
            :clearable="true"
            @update:value="ensureStoreObject"
          />
        </div>
      </div>

      <!-- Domains Section -->
      <div class="domains-section">
        <h5>{{ t('traefik.ingressRoute.tls.domains.label') }}</h5>
        <TLSDomains
          :value="value"
          :mode="mode"
          :namespace="namespace"
        />
      </div>

    </template>
  </div>
</template>

<style lang="scss">
/* Ensure global radio button styles are not scoped out */

.domains-section {
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