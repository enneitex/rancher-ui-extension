<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  emits:      ['update:value'],
  components: {
    LabeledInput,
    LabeledSelect
  },

  props: {
    value: {
      type:     Object,
      required: true,
      default:  () => ({ name: '', port: '', kind: 'Service' })
    },

    serviceTargets: {
      type:    Array,
      default: () => []
    },

    mode: {
      type:    String,
      default: 'edit'
    },

    isTcp: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      serviceName: this.value.name || '',
      servicePort: this.value.port || '',
      serviceKind: this.value.kind || 'Service'
    };
  },

  computed: {
    // Validation du service - vérifie si le service existe (K8s Service OU TraefikService)
    serviceTargetStatus() {
      const serviceName = this.serviceName?.label || this.serviceName;
      const isValueAnOption = !serviceName || this.serviceTargets.find((target) => serviceName === target.value);

      return isValueAnOption ? null : 'warning';
    },

    // Tooltip du service - affiche un message d'erreur si le service n'existe pas
    serviceTargetTooltip() {
      if (this.serviceTargetStatus === 'warning') {
        return this.t('traefik.ingressRoute.routes.service.doesntExist');
      }

      return this.t('traefik.ingressRoute.routes.service.tooltip');
    },

    // Options de ports pour le service sélectionné
    portOptions() {
      const selectedService = this.serviceTargets.find(s => s.value === this.serviceName);

      if (!selectedService || !selectedService.ports) {
        return [];
      }

      return selectedService.ports.map(port => ({
        label: port.name ? `${ port.name } (${ port.port })` : port.port,
        value: port.name || port.port
      }));
    },

    // Vérifie si le service sélectionné est un TraefikService
    isTraefikService() {
      const selectedService = this.serviceTargets.find(s => s.value === this.serviceName);

      return selectedService?.kind === 'TraefikService';
    }
  },

  watch: {
    // Synchroniser les changements de valeur (quand modifié depuis l'extérieur, ex: YAML)
    'value.name'(neu) {
      if (neu !== this.serviceName) {
        this.serviceName = neu;
      }
    },
    'value.port'(neu) {
      if (neu !== this.servicePort) {
        this.servicePort = neu;
      }
    },
    'value.kind'(neu) {
      if (neu !== this.serviceKind) {
        this.serviceKind = neu;
      }
    }
  },

  methods: {
    update() {
      // Ensure values are primitives (not objects from select)
      const serviceName = typeof this.serviceName === 'string' ? this.serviceName : this.serviceName?.label || this.serviceName?.value || '';
      const servicePort = typeof this.servicePort === 'string' || typeof this.servicePort === 'number' ? this.servicePort : this.servicePort?.label || this.servicePort?.value || '';

      const out = {
        name: serviceName,
        port: servicePort,
        kind: this.serviceKind
      };

      this.$emit('update:value', out);
    },

    updateServiceName(newServiceName) {
      // Ensure serviceName is always a string (handle both string and {label: "value"} objects)
      const serviceNameValue = typeof newServiceName === 'string' ? newServiceName : newServiceName?.label || newServiceName?.value || '';

      this.serviceName = serviceNameValue;

      // Find the selected service in serviceTargets to auto-fill port and kind
      const selectedService = this.serviceTargets.find(s => s.value === serviceNameValue);

      if (selectedService) {
        // Auto-detect and set the service kind (Service or TraefikService)
        this.serviceKind = selectedService.kind || 'Service';

        // Auto-fill port only for K8s Services (not TraefikService)
        if (selectedService.kind === 'Service' && selectedService.ports && selectedService.ports.length > 0) {
          const firstPort = selectedService.ports[0];
          // Auto-select first port (prefer name over port number)
          this.servicePort = firstPort.name || firstPort.port || '';
        } else if (selectedService.kind === 'TraefikService') {
          // TraefikServices don't have ports in the IngressRoute reference
          this.servicePort = '';
        }
      }

      this.update();
    },

    updateServicePort(newServicePort) {
      // Ensure port is always a string or number (handle both string and {label: "value"} objects)
      const portValueClean = typeof newServicePort === 'string' || typeof newServicePort === 'number' ? newServicePort : newServicePort?.label || newServicePort?.value || '';

      this.servicePort = portValueClean;
      this.update();
    }
  }
};
</script>

<template>
  <div class="row mb-10">
    <div :class="isTraefikService ? 'col span-12' : 'col span-6'">
      <LabeledSelect
        v-model:value="serviceName"
        :taggable="true"
        :searchable="true"
        :mode="mode"
        :label="t('traefik.ingressRoute.routes.service.label')"
        :tooltip="serviceTargetTooltip"
        :placeholder="t('traefik.ingressRoute.routes.service.placeholder')"
        :options="serviceTargets"
        :required="true"
        :status="serviceTargetStatus"
        :hover-tooltip="true"
        :error="serviceName ? '' : t('validation.required', { key: t('traefik.ingressRoute.routes.service.label') })"
        @update:model-value="updateServiceName"
      />
    </div>
    <div
      v-if="!isTraefikService"
      class="col span-6"
    >
      <LabeledSelect
        v-model:value="servicePort"
        :taggable="true"
        :searchable="true"
        :mode="mode"
        :label="t('traefik.ingressRoute.routes.port.label')"
        :placeholder="t('traefik.ingressRoute.routes.port.placeholder')"
        :tooltip="t('traefik.ingressRoute.routes.port.tooltip')"
        :options="portOptions"
        :required="true"
        :error="servicePort ? '' : t('validation.required', { key: t('traefik.ingressRoute.routes.port.label') })"
        @update:model-value="updateServicePort"
      />
    </div>
  </div>
</template>
