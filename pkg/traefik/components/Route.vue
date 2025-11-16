<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { Banner } from '@components/Banner';
import ServiceRow from './ServiceRow';

export default {
  emits:      ['remove', 'validation-changed'],
  components: {
    LabeledInput,
    LabeledSelect,
    ArrayListGrouped,
    Banner,
    ServiceRow
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

    serviceTargets: {
      type:    Array,
      default: () => []
    },

    middlewareTargets: {
      type:    Array,
      default: () => []
    },

    mode: {
      type:    String,
      default: 'edit'
    },

    canRemove: {
      type:    Boolean,
      default: true
    },

    isTcp: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {};
  },

  created() {
    // Initialize empty arrays if not present
    if (!this.value.services) {
      this.value.services = [];
    }
    // TCP routes don't have middlewares
    if (!this.isTcp && !this.value.middlewares) {
      this.value.middlewares = [];
    }
  },

  computed: {
    routeTitle() {
      return this.t('traefik.route') + ' ' + (this.index + 1);
    },

    isValid() {
      const validMatch = !!this.value.match;
      const validServices = this.value.services?.length > 0 &&
      this.value.services.every(s => {
        // Service name is always required
        if (!s.name) return false;

        // Port is only required for K8s Services, not for TraefikService
        const selectedService = this.serviceTargets.find(svc => svc.value === s.name);
        if (selectedService?.kind === 'TraefikService') {
          return true; // TraefikService doesn't need port
        }

        return !!s.port; // K8s Service needs port
      });

      return validMatch && validServices;
    },

    matchError() {
      return !this.value.match ? this.t('validation.required', { key: this.t('traefik.ingressRoute.routes.match.label') }) : '';
    },

    hasOrOperators() {
      return this.value.match && this.value.match.includes('||');
    },

    // Liste des options de middlewares pour le sélecteur
    middlewareOptions() {
      return this.middlewareTargets.map(middleware => ({
        label: middleware.label,
        value: middleware.value
      }));
    }
  },

  watch: {
    isValid: {
      handler(valid) {
        this.$emit('validation-changed', valid);
      },
      immediate: true
    },
  },

  methods: {
    remove() {
      this.$emit('remove');
    },

    focus() {
      this.$refs.match.focus();
    }
  }
};
</script>

<template>
  <div class="route-card">
    <div class="route-header">
      <h4>{{ routeTitle }}</h4>
      <button
        v-if="canRemove"
        type="button"
        class="btn role-link"
        @click="remove"
      >
        {{ t('generic.remove') }}
      </button>
    </div>

    <!-- Match Rule -->
    <div class="row mb-15">
      <div class="col span-12">
        <LabeledInput
          ref="match"
          v-model:value="value.match"
          :mode="mode"
          :label="t('traefik.ingressRoute.routes.match.label')"
          :placeholder="t('traefik.ingressRoute.routes.match.placeholder')"
          :tooltip="t('traefik.ingressRoute.routes.match.tooltip')"
          :required="true"
          :error="matchError"
        />
      </div>
    </div>

    <!-- Warning for multiple OR operators -->
    <div v-if="hasOrOperators && mode !== 'view'" class="row mb-15">
      <div class="col span-12">
        <Banner
          color="warning"
          :label="t('traefik.ingressRoute.routes.match.warningMultipleOr')"
        />
      </div>
    </div>


    <!-- Services Section -->
    <div class="services-section">
      <h5>{{ t('traefik.ingressRoute.routes.service.label') }}</h5>

      <ArrayListGrouped
        v-model:value="value.services"
        :mode="mode"
        :add-label="`${t('generic.add')} ${t('traefik.ingressRoute.routes.service.label')}`"
        :default-add-value="isTcp ? { name: '', port: '' } : { name: '', port: '', kind: 'Service' }"
        :initial-empty-row="false"
        @add="() => {}"
      >
        <template #default="{ row }">
          <ServiceRow
            v-model:value="row.value"
            :service-targets="serviceTargets"
            :mode="mode"
            :is-tcp="isTcp"
          />
        </template>
      </ArrayListGrouped>
    </div>

    <!-- Middlewares Section -->
    <div class="middleware-section">
      <h5>{{ isTcp ? t('traefik.ingressRouteTCP.middleware.label') : t('traefik.ingressRoute.middleware.label') }}</h5>

      <Banner
        v-if="mode !== 'view' && middlewareTargets.length === 0"
        color="info"
        :label="isTcp ? t('traefik.ingressRouteTCP.middleware.noMiddlewaresAvailable') : t('traefik.ingressRoute.middleware.noMiddlewaresAvailable')"
      />

      <ArrayListGrouped
        v-if="middlewareTargets.length > 0"
        v-model:value="value.middlewares"
        :mode="mode"
        :add-label="`${t('generic.add')} ${isTcp ? t('traefik.ingressRouteTCP.middleware.label') : t('traefik.ingressRoute.middleware.label')}`"
        :default-add-value="{ name: '', namespace: '' }"
        :initial-empty-row="false"
        @add="() => {}"
      >
        <template #default="{ row }">
          <div class="row mb-10">
            <div class="col span-12">
              <LabeledSelect
                v-model:value="row.value.name"
                :mode="mode"
                :label="t('traefik.ingressRoute.middleware.name.label')"
                :placeholder="t('traefik.ingressRoute.middleware.name.placeholder')"
                :tooltip="t('traefik.ingressRoute.middleware.name.tooltip')"
                :options="middlewareOptions"
                @update:model-value="(value) => {
                  row.value.name = value;
                  const target = middlewareTargets.find(m => m.value === value);
                  if (target) {
                    row.value.namespace = target.namespace;
                  }
                }"
              />
            </div>
          </div>
        </template>
      </ArrayListGrouped>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.route-wrapper {
  margin-bottom: 20px;
}

.route-card {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 20px;
  background: var(--box-bg);
}

.route-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h4 {
    margin: 0;
    color: var(--primary);
  }
}

.services-section,
.middleware-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);

  h5 {
    margin-bottom: 15px;
    color: var(--text-color);
  }
}

.service-row {
  margin-bottom: 15px;
  padding: 15px;
  background: var(--accent-btn);
  border-radius: var(--border-radius);
}

.remove-btn {
  margin-top: 30px;
}
</style>