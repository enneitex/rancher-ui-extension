<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { random32 } from '@shell/utils/string';

export default {
  emits:      ['remove'],
  components: {
    LabeledInput,
    LabeledSelect
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

    mode: {
      type:    String,
      default: 'edit'
    },

    canRemove: {
      type:    Boolean,
      default: true
    }
  },

  beforeUpdate() {
    // Ensure services have vKey for UI tracking
    if (this.value.services) {
      for (const service of this.value.services) {
        if (!service.vKey) {
          service['vKey'] = random32(1);
        }
      }
    }

    // Ensure middlewares have vKey for UI tracking
    if (this.value.middlewares) {
      for (const middleware of this.value.middlewares) {
        if (!middleware.vKey) {
          middleware['vKey'] = random32(1);
        }
      }
    }
  },

  computed: {
    routeTitle() {
      return this.t('generic.route') + ' ' + (this.index + 1);
    },

  },

  methods: {
    remove() {
      this.$emit('remove');
    },

    focus() {
      this.$refs.match.focus();
    },

    addService() {
      if (!this.value.services) {
        this.$set(this.value, 'services', []);
      }
      this.value.services.push({
        vKey:           random32(1),
        name: '',
        port: '',
        kind: 'Service'
      });
    },

    removeService(index) {
      this.value.services.splice(index, 1);
    },

    addMiddleware() {
      if (!this.value.middlewares) {
        this.$set(this.value, 'middlewares', []);
      }
      this.value.middlewares.push({
        vKey:      random32(1),
        name:      '',
        namespace: ''
      });
    },

    removeMiddleware(index) {
      this.value.middlewares.splice(index, 1);
    },

    updateServiceName(service, serviceName) {
      // Ensure serviceName is always a string (handle both string and {label: "value"} objects)
      const serviceNameValue = typeof serviceName === 'string' ? serviceName : serviceName?.label || serviceName?.value || '';
      service.name = serviceNameValue;

      // Find the selected service in serviceTargets to auto-fill port
      const selectedService = this.serviceTargets.find(s => s.value === serviceNameValue);
      if (selectedService && selectedService.ports && selectedService.ports.length > 0) {
        const firstPort = selectedService.ports[0];
        // Auto-select first port (prefer name over port number)
        service.port = firstPort.name || firstPort.port || '';
      }
    },

    updateServicePort(service, portValue) {
      // Ensure port is always a string or number (handle both string and {label: "value"} objects)
      const portValueClean = typeof portValue === 'string' || typeof portValue === 'number' ? portValue : portValue?.label || portValue?.value || '';
      service.port = portValueClean;
    },

    getPortOptions(service) {
      const selectedService = this.serviceTargets.find(s => s.value === service.name);
      if (!selectedService || !selectedService.ports) {
        return [];
      }
      
      return selectedService.ports.map(port => ({
        label: port.name ? `${port.name} (${port.port})` : port.port,
        value: port.name || port.port
      }));
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
        />
      </div>
    </div>


    <!-- Services Section -->
    <div class="services-section">
      <h5>{{ t('traefik.ingressRoute.routes.service.label') }}</h5>

      <div v-for="(service, i) in value.services" :key="service.vKey" class="service-row">
        <!-- Basic service configuration -->
        <div class="row mb-10">
          <div class="col span-5">
            <LabeledSelect
              v-model:value="service.name"
              :mode="mode"
              :label="t('traefik.ingressRoute.routes.service.label')"
              :tooltip="t('traefik.ingressRoute.routes.service.tooltip')"
              :placeholder="t('traefik.ingressRoute.routes.service.placeholder')"
              :options="serviceTargets"
              @update:model-value="updateServiceName(service, $event)"
            />
          </div>
          <div class="col span-5">
            <LabeledSelect
              v-model:value="service.port"
              :mode="mode"
              :label="t('traefik.ingressRoute.routes.port.label')"
              :placeholder="t('traefik.ingressRoute.routes.port.placeholder')"
              :tooltip="t('traefik.ingressRoute.routes.port.tooltip')"
              :options="getPortOptions(service)"
              @update:model-value="updateServicePort(service, $event)"
            />
          </div>
          <div class="col span-2">
            <button 
              v-if="value.services.length > 1"
              type="button" 
              class="btn role-link remove-btn" 
              @click="removeService(i)"
            >
              {{ t('generic.remove') }}
            </button>
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

    <!-- Middlewares Section -->
    <div class="middleware-section">
      <h5>{{ t('traefik.ingressRoute.middleware.label') }}</h5>

      <div v-for="(middleware, i) in value.middlewares" :key="middleware.vKey" class="row mb-10">
        <div class="col span-5">
          <LabeledInput
            v-model:value="middleware.name"
            :mode="mode"
            :label="t('traefik.ingressRoute.middleware.name.label')"
            :placeholder="t('traefik.ingressRoute.middleware.name.placeholder')"
            :tooltip="t('traefik.ingressRoute.middleware.name.tooltip')"
          />
        </div>
        <div class="col span-5">
          <LabeledInput
            v-model:value="middleware.namespace"
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