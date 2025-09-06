<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import { random32 } from '@shell/utils/string';

export default {
  emits:      ['input'],
  components: {
    LabeledInput,
    LabeledSelect,
    Checkbox
  },

  props: {
    value: {
      type:    Array,
      default: () => []
    },

    mode: {
      type:    String,
      default: 'edit'
    },

    serviceTargets: {
      type:    Array,
      default: () => []
    },

    rules: {
      default: () => ({
        serviceName: [],
        port:        []
      }),
      type: Object,
    }
  },

  data() {
    return {
      services: this.value || []
    };
  },

  watch: {
    value: {
      handler(newValue) {
        this.services = newValue || [];
      },
      deep: true
    },

    services: {
      handler(newValue) {
        this.$emit('input', newValue);
      },
      deep: true
    }
  },

  computed: {
    serviceKindOptions() {
      return [
        { label: this.t('traefik.ingressRoute.routes.kind.service'), value: 'Service' },
        { label: this.t('traefik.ingressRoute.routes.kind.traefikService'), value: 'TraefikService' }
      ];
    },

    strategyOptions() {
      return [
        { label: this.t('traefik.ingressRoute.routes.strategy.roundRobin'), value: 'RoundRobin' },
        { label: this.t('traefik.ingressRoute.routes.strategy.wrr'), value: 'WeightedRoundRobin' }
      ];
    }
  },

  beforeUpdate() {
    // Ensure each service has a unique key
    for (const service of this.services) {
      if (!service.vKey) {
        service['vKey'] = random32(1);
      }
    }
  },

  methods: {
    addService() {
      this.services.push({
        vKey:           random32(1),
        name:           '',
        port:           80,
        kind:           'Service',
        weight:         null,
        strategy:       null,
        passHostHeader: false
      });
    },

    removeService(index) {
      this.services.splice(index, 1);
    }
  }
};
</script>

<template>
  <div class="services-section">
    <h5>{{ t('traefik.ingressRoute.routes.service.label') }}</h5>

    <div v-for="(service, i) in services" :key="service.vKey" class="service-row">
      <!-- Basic service configuration -->
      <div class="row mb-10">
        <div class="col span-3">
          <LabeledSelect
            v-model="service.kind"
            :mode="mode"
            :label="t('traefik.ingressRoute.routes.kind.label')"
            :options="serviceKindOptions"
            :tooltip="t('traefik.ingressRoute.routes.kind.tooltip')"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            v-model="service.name"
            :mode="mode"
            :label="t('traefik.ingressRoute.routes.service.label')"
            :options="serviceTargets"
            :tooltip="t('traefik.ingressRoute.routes.service.tooltip')"
            :rules="rules.serviceName"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            v-model.number="service.port"
            :mode="mode"
            type="number"
            :label="t('traefik.ingressRoute.routes.port.label')"
            :placeholder="t('traefik.ingressRoute.routes.port.placeholder')"
            :tooltip="t('traefik.ingressRoute.routes.port.tooltip')"
            :rules="rules.port"
          />
        </div>
        <div class="col span-2">
          <button
            v-if="services.length > 1"
            type="button"
            class="btn role-link remove-btn"
            @click="removeService(i)"
          >
            {{ t('generic.remove') }}
          </button>
        </div>
      </div>

      <!-- Advanced service options -->
      <div class="row">
        <div class="col span-3">
          <LabeledInput
            v-model.number="service.weight"
            :mode="mode"
            type="number"
            :label="t('traefik.ingressRoute.routes.weight.label')"
            :placeholder="t('traefik.ingressRoute.routes.weight.placeholder')"
            :tooltip="t('traefik.ingressRoute.routes.weight.tooltip')"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            v-model="service.strategy"
            :mode="mode"
            :label="t('traefik.ingressRoute.routes.strategy.label')"
            :options="strategyOptions"
            :tooltip="t('traefik.ingressRoute.routes.strategy.tooltip')"
            clearable
          />
        </div>
        <div class="col span-6">
          <Checkbox
            v-model="service.passHostHeader"
            :mode="mode"
            :label="t('traefik.ingressRoute.routes.passHostHeader.label')"
            :tooltip="t('traefik.ingressRoute.routes.passHostHeader.tooltip')"
          />
        </div>
      </div>
    </div>

    <div class="row mt-15">
      <div class="col span-12">
        <button
          type="button"
          class="btn role-secondary"
          @click="addService"
        >
          {{ t('generic.add') }} {{ t('traefik.ingressRoute.routes.service.label') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.services-section {
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