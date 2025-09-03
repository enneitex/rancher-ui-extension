<script>
import { Banner } from '@components/Banner';
import { random32 } from '@shell/utils/string';
import Route from './Route';

export default {
  components: {
    Banner,
    Route
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
    }
  },

  beforeUpdate() {
    // Ensure each route has a unique key for v-for tracking (UI only)
    for (const route of this.value.spec.routes) {
      if (!route.vKey) {
        route['vKey'] = random32(1);
      }
    }
  },

  methods: {
    addRoute() {
      const newRoute = {
        vKey:        random32(1),
        match:       '',
        services:    [{ name: '', port: '', kind: 'Service' }],
        middlewares: []
      };

      this.value.spec.routes.push(newRoute);
    },

    removeRoute(index) {
      this.value.spec.routes.splice(index, 1);
    }
  }
};
</script>

<template>
  <div class="routes-section">
    <div class="row">
      <div class="col span-12">
        <Banner 
          color="info" 
          :label="t('traefik.ingressRoute.routes.title')"
        />
      </div>
    </div>

    <div v-for="(route, i) in value.spec.routes" :key="route.vKey" class="route-wrapper">
      <Route
        :value="route"
        :mode="mode"
        :index="i"
        :service-targets="serviceTargets"
        :middleware-targets="middlewareTargets"
        :can-remove="value.spec.routes.length > 1"
        @remove="removeRoute(i)"
      />
    </div>

    <div class="row mt-20">
      <div class="col span-12">
        <button 
          type="button" 
          class="btn role-secondary" 
          @click="addRoute"
        >
          {{ t('traefik.ingressRoute.routes.addRoute') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.route-wrapper {
  margin-bottom: 20px;
}
</style>