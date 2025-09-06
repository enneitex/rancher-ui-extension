<script>
import { Banner } from '@components/Banner';
import { random32 } from '@shell/utils/string';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { removeAt } from '@shell/utils/array';
import Route from './Route';

export default {
  emits: ['validation-changed'],
  components: {
    Banner,
    Route,
    Tab,
    Tabbed
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

    serviceTargets: {
      type:    Array,
      default: () => []
    },

    middlewareTargets: {
      type:    Array,
      default: () => []
    },

    useTabbedHash: {
      type:    Boolean,
      default: undefined
    },

    isTcp: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      routeValidations: {}
    };
  },

  beforeUpdate() {
    // Ensure each route has a unique key for v-for tracking (UI only)
    for (const route of this.value.spec.routes) {
      if (!route.vKey) {
        route['vKey'] = random32(1);
      }
    }
  },

  computed: {
    isValid() {
      // Check if there are routes and all routes are valid
      if (this.value.spec.routes.length === 0) {
        return false;
      }

      // Vérifiez si toutes les routes ont été validées
      const allRoutesValidated = this.value.spec.routes.length === Object.keys(this.routeValidations).length;

      if (!allRoutesValidated) {
        return false;
      }

      // Return true only if all routes have validation status and are valid
      return Object.values(this.routeValidations).every(v => v === true);
    }
  },

  watch: {
    isValid: {
      handler(valid) {
        this.$emit('validation-changed', valid);
      },
      immediate: true
    },
    'value.spec.routes.length'() {
      // Nettoyer les validations obsolètes
      const currentRoutesCount = this.value.spec.routes.length;
      const validationKeys = Object.keys(this.routeValidations);

      // Supprimer les validations pour les routes qui n'existent plus
      validationKeys.forEach(idx => {
        const numericIdx = parseInt(idx, 10);
        if (numericIdx >= currentRoutesCount) {
          delete this.routeValidations[idx];
        }
      });

      this.updateValidationStatus();
    }
  },

  methods: {
    updateValidationStatus() {
      // S'assurer que toutes les routes ont un statut de validation
      // afin que isValid puisse être correctement calculé
      const routesCount = this.value.spec.routes.length;

      for (let i = 0; i < routesCount; i++) {
        // Si une route n'a pas encore de statut de validation (undefined),
        // lui donner un statut initial basé sur la route
        if (this.routeValidations[i] === undefined) {
          const route = this.value.spec.routes[i];
          // Logique simplifiée ici, identique à celle de Route.vue
          const hasMatch = !!route.match;
          const hasValidServices = route.services?.length > 0 &&
                               route.services.every(s => !!s.name && !!s.port);
          this.routeValidations[i] = hasMatch && hasValidServices;
        }
      }

      // Emit current validation status
      this.$emit('validation-changed', this.isValid);
    },

    routeValidationChanged(isValid, index) {
      // Store validation status for the route
      this.routeValidations[index] = isValid;
    },

    addRoute() {
      const newRoute = this.isTcp 
        ? {
            vKey:     random32(1),
            match:    'HostSNI(`*`)',
            services: [{ name: '', port: '' }]
          }
        : {
            vKey:        random32(1),
            match:       '',
            services:    [{ name: '', port: '', kind: 'Service' }],
            middlewares: []
          };

      this.value.spec.routes.push(newRoute);

      // Forcer la mise à jour de la validation pour la nouvelle route
      // La nouvelle route sera initialement considérée comme non validée
      // jusqu'à ce que le composant Route émette un événement de validation
      this.updateValidationStatus();
    },

    removeRoute(index) {
      removeAt(this.value.spec.routes, index);

      // Réinitialiser les validations après suppression d'une route
      const newValidations = {};

      // Réindexer les validations restantes
      Object.keys(this.routeValidations).forEach(oldIdx => {
        const numericIdx = parseInt(oldIdx, 10);

        if (numericIdx < index) {
          // Les routes avant celle supprimée gardent leur index
          newValidations[numericIdx] = this.routeValidations[numericIdx];
        } else if (numericIdx > index) {
          // Les routes après celle supprimée sont décalées de -1
          newValidations[numericIdx - 1] = this.routeValidations[numericIdx];
        }
        // La route à l'index supprimé est ignorée
      });

      // Mettre à jour les validations
      this.routeValidations = newValidations;

      // Forcer la mise à jour de la validation
      this.updateValidationStatus();
    },

    routeLabel(idx) {
      return this.t('traefik.ingressRoute.routes.routeLabel', { index: idx + 1 });
    }
  }
};
</script>

<template>
  <div class="routes-section">
    <div class="row mb-40">
      <div class="col span-12">
        <Tabbed
          :side-tabs="true"
          :show-tabs-add-remove="mode !== 'view'"
          :use-hash="useTabbedHash"
          @addTab="addRoute"
          @removeTab="removeRoute"
        >
          <Tab
            v-for="(route, idx) in value.spec.routes"
            :key="route.vKey"
            :name="'route-' + idx"
            :label="routeLabel(idx)"
            :error="routeValidations[idx] === false"
            :show-header="false"
            class="container-group"
          >
            <Route
              :value="route"
              :mode="mode"
              :index="idx"
              :service-targets="serviceTargets"
              :middleware-targets="middlewareTargets"
              :can-remove="value.spec.routes.length > 1"
              :is-tcp="isTcp"
              @remove="removeRoute(idx)"
              @validation-changed="(valid) => routeValidationChanged(valid, idx)"
            />
          </Tab>
        </Tabbed>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.routes-section {
  margin-bottom: 20px;
}

.container-group {
  padding: 20px;
}
</style>