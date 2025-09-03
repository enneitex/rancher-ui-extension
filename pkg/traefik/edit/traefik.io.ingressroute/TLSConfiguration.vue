<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import { random32 } from '@shell/utils/string';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    Checkbox
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
    }
  },

  beforeUpdate() {
    // Ensure domains have vKey for UI tracking
    if (this.value.spec.tls?.domains) {
      for (const domain of this.value.spec.tls.domains) {
        if (!domain.vKey) {
          domain['vKey'] = random32(1);
        }
      }
    }
  },

  computed: {
    tlsEnabled: {
      get() {
        return !!this.value.spec.tls;
      },
      set(enabled) {
        if (enabled) {
          this.$set(this.value.spec, 'tls', {
            secretName:   '',
            domains:      [],
            options:      {},
            store:        {},
            certResolver: ''
          });
        } else {
          this.$delete(this.value.spec, 'tls');
        }
      }
    },

    sansAsString() {
      return (domain) => {
        return Array.isArray(domain.sans) ? domain.sans.join(', ') : '';
      };
    }
  },

  methods: {
    addDomain() {
      if (!this.value.spec.tls.domains) {
        this.$set(this.value.spec.tls, 'domains', []);
      }
      this.value.spec.tls.domains.push({
        vKey: random32(1),
        main: '',
        sans: []
      });
    },

    removeDomain(index) {
      this.value.spec.tls.domains.splice(index, 1);
    },

    updateDomainSans(domain, value) {
      domain.sans = value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
    }
  }
};
</script>

<template>
  <div class="tls-configuration">
    <!-- TLS Enable Checkbox -->
    <div class="row mb-20">
      <div class="col span-12">
        <Checkbox
          v-model:value="tlsEnabled"
          :mode="mode"
          :label="t('traefik.ingressRoute.tls.enable')"
        />
      </div>
    </div>

    <template v-if="tlsEnabled">
      <!-- TLS Secret and Options -->
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="value.spec.tls.secretName"
            :mode="mode"
            :label="t('traefik.ingressRoute.tls.secretName.label')"
            :placeholder="t('traefik.ingressRoute.tls.secretName.placeholder')"
            :tooltip="t('traefik.ingressRoute.tls.secretName.tooltip')"
            :options="secretTargets"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.tls.options.name"
            :mode="mode"
            :label="t('traefik.ingressRoute.tls.options.label')"
            :tooltip="t('traefik.ingressRoute.tls.options.tooltip')"
          />
        </div>
      </div>

      <!-- Certificate Resolver and Store -->
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.tls.certResolver"
            :mode="mode"
            :label="t('traefik.ingressRoute.tls.certResolver.label')"
            :placeholder="t('traefik.ingressRoute.tls.certResolver.placeholder')"
            :tooltip="t('traefik.ingressRoute.tls.certResolver.tooltip')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.tls.store.name"
            :mode="mode"
            :label="t('traefik.ingressRoute.tls.store.label')"
            :tooltip="t('traefik.ingressRoute.tls.store.tooltip')"
          />
        </div>
      </div>

      <!-- Domains Section -->
      <div class="domains-section">
        <h5>{{ t('traefik.ingressRoute.tls.domains.label') }}</h5>
        
        <div v-for="(domain, i) in value.spec.tls.domains" :key="domain.vKey" class="row mb-10">
          <div class="col span-5">
            <LabeledInput
              v-model:value="domain.main"
              :mode="mode"
              :label="t('traefik.ingressRoute.tls.domains.main.label')"
              :placeholder="t('traefik.ingressRoute.tls.domains.main.placeholder')"
            />
          </div>
          <div class="col span-5">
            <LabeledInput
              :model-value="sansAsString(domain)"
              :mode="mode"
              :label="t('traefik.ingressRoute.tls.domains.sans.label')"
              :placeholder="t('traefik.ingressRoute.tls.domains.sans.placeholder')"
              :tooltip="t('traefik.ingressRoute.tls.domains.sans.tooltip')"
              @update:model-value="updateDomainSans(domain, $event)"
            />
          </div>
          <div class="col span-2">
            <button 
              type="button" 
              class="btn role-link remove-btn" 
              @click="removeDomain(i)"
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
              @click="addDomain"
            >
              {{ t('traefik.ingressRoute.tls.domains.addDomain') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
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