<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="fvFormIsValid"
    :errors="fvUnreportedValidationErrors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <div class="row">
      <div class="col span-12">
        <NameNsDescription
          :value="value"
          :mode="mode"
          :register-before-hook="registerBeforeHook"
          :rules="{
            name: fvGetAndReportPathRules('metadata.name'),
            namespace: fvGetAndReportPathRules('metadata.namespace'),
            description: []
          }"
        />
      </div>
    </div>

    <Tabbed :side-tabs="true">
      <!-- Entry Points Tab -->
      <Tab 
        name="entrypoints" 
        :label="t('traefik.ingressRoute.entryPoints.label')" 
        :weight="10"
        :error="tabErrors.entryPoints"
      >
        <div class="row">
          <div class="col span-12">
            <Banner 
              color="info" 
              :label="t('traefik.ingressRoute.entryPoints.description')"
            />
          </div>
        </div>
        
        <div class="row">
          <div class="col span-12">
            <LabeledSelect
              v-model="value.spec.entryPoints"
              :mode="mode"
              :label="t('traefik.ingressRoute.entryPoints.label')"
              :multiple="true"
              :taggable="true"
              :options="entryPointOptions"
              :rules="fvGetAndReportPathRules('spec.entryPoints')"
            />
          </div>
        </div>
      </Tab>

      <!-- Routes Tab -->
      <Tab 
        name="routes" 
        :label="t('traefik.ingressRoute.routes.label')" 
        :weight="9"
        :error="tabErrors.routes"
      >
        <div class="row">
          <div class="col span-12">
            <Banner 
              color="info" 
              :label="t('traefik.ingressRoute.routes.title')"
            />
          </div>
        </div>

        <div v-for="(route, i) in value.spec.routes" :key="i" class="row route-section">
          <div class="col span-12">
            <div class="route-card">
              <div class="route-header">
                <h4>{{ t('generic.route') }} {{ i + 1 }}</h4>
                <button 
                  v-if="value.spec.routes.length > 1"
                  type="button" 
                  class="btn role-link" 
                  @click="removeRoute(i)"
                >
                  {{ t('generic.remove') }}
                </button>
              </div>

              <!-- Match Rule -->
              <div class="row">
                <div class="col span-12">
                  <LabeledInput
                    v-model="route.match"
                    :mode="mode"
                    :label="t('traefik.ingressRoute.routes.match.label')"
                    :placeholder="t('traefik.ingressRoute.routes.match.placeholder')"
                    :tooltip="t('traefik.ingressRoute.routes.match.tooltip')"
                    :rules="fvGetAndReportPathRules(`spec.routes.${i}.match`)"
                  />
                </div>
              </div>

              <!-- Priority (optional) -->
              <div class="row">
                <div class="col span-6">
                  <LabeledInput
                    v-model.number="route.priority"
                    :mode="mode"
                    type="number"
                    :label="t('traefik.ingressRoute.routes.priority.label')"
                    :placeholder="t('traefik.ingressRoute.routes.priority.placeholder')"
                    :tooltip="t('traefik.ingressRoute.routes.priority.tooltip')"
                  />
                </div>
              </div>

              <!-- Services -->
              <div class="services-section">
                <h5>{{ t('traefik.ingressRoute.routes.service.label') }}</h5>
                <div v-for="(service, j) in route.services" :key="j" class="service-row">
                  <div class="row">
                    <div class="col span-4">
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
                        :options="serviceOptions"
                        :tooltip="t('traefik.ingressRoute.routes.service.tooltip')"
                        :rules="fvGetAndReportPathRules(`spec.routes.${i}.services.${j}.name`)"
                      />
                    </div>
                    <div class="col span-2">
                      <LabeledInput
                        v-model.number="service.port"
                        :mode="mode"
                        type="number"
                        :label="t('traefik.ingressRoute.routes.port.label')"
                        :placeholder="t('traefik.ingressRoute.routes.port.placeholder')"
                        :tooltip="t('traefik.ingressRoute.routes.port.tooltip')"
                        :rules="fvGetAndReportPathRules(`spec.routes.${i}.services.${j}.port`)"
                      />
                    </div>
                    <div class="col span-2">
                      <button 
                        v-if="route.services.length > 1"
                        type="button" 
                        class="btn role-link" 
                        @click="removeService(i, j)"
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
                    <div class="col span-3">
                      <Checkbox
                        v-model="service.passHostHeader"
                        :mode="mode"
                        :label="t('traefik.ingressRoute.routes.passHostHeader.label')"
                        :tooltip="t('traefik.ingressRoute.routes.passHostHeader.tooltip')"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  class="btn role-secondary" 
                  @click="addService(i)"
                >
                  {{ t('generic.add') }} {{ t('traefik.ingressRoute.routes.service.label') }}
                </button>
              </div>

              <!-- Middleware -->
              <div class="middleware-section">
                <h5>{{ t('traefik.ingressRoute.middleware.label') }}</h5>
                <div v-for="(middleware, k) in route.middlewares" :key="k" class="row">
                  <div class="col span-5">
                    <LabeledInput
                      v-model="middleware.name"
                      :mode="mode"
                      :label="t('traefik.ingressRoute.middleware.name.label')"
                      :rules="fvGetAndReportPathRules(`spec.routes.${i}.middlewares.${k}.name`)"
                    />
                  </div>
                  <div class="col span-5">
                    <LabeledInput
                      v-model="middleware.namespace"
                      :mode="mode"
                      :label="t('traefik.ingressRoute.middleware.namespace.label')"
                      :tooltip="t('traefik.ingressRoute.middleware.namespace.tooltip')"
                    />
                  </div>
                  <div class="col span-2">
                    <button 
                      type="button" 
                      class="btn role-link" 
                      @click="removeMiddleware(i, k)"
                    >
                      {{ t('generic.remove') }}
                    </button>
                  </div>
                </div>

                <button 
                  type="button" 
                  class="btn role-secondary" 
                  @click="addMiddleware(i)"
                >
                  {{ t('traefik.ingressRoute.middleware.addMiddleware') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="button" 
          class="btn role-secondary" 
          @click="addRoute"
        >
          {{ t('traefik.ingressRoute.routes.addRoute') }}
        </button>
      </Tab>

      <!-- TLS Tab -->
      <Tab 
        name="tls" 
        :label="t('traefik.ingressRoute.tls.label')" 
        :weight="8"
        :error="tabErrors.tls"
      >
        <div class="row">
          <div class="col span-12">
            <Checkbox
              v-model="tlsEnabled"
              :mode="mode"
              :label="t('traefik.ingressRoute.tls.enable')"
            />
          </div>
        </div>

        <template v-if="tlsEnabled">
          <!-- TLS Secret -->
          <div class="row">
            <div class="col span-6">
              <LabeledSelect
                v-model="value.spec.tls.secretName"
                :mode="mode"
                :label="t('traefik.ingressRoute.tls.secretName.label')"
                :placeholder="t('traefik.ingressRoute.tls.secretName.placeholder')"
                :tooltip="t('traefik.ingressRoute.tls.secretName.tooltip')"
                :options="secretOptions"
                :rules="tlsSecretRules"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model="value.spec.tls.options.name"
                :mode="mode"
                :label="t('traefik.ingressRoute.tls.options.label')"
                :tooltip="t('traefik.ingressRoute.tls.options.tooltip')"
              />
            </div>
          </div>

          <!-- Certificate Resolver -->
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                v-model="value.spec.tls.certResolver"
                :mode="mode"
                :label="t('traefik.ingressRoute.tls.certResolver.label')"
                :placeholder="t('traefik.ingressRoute.tls.certResolver.placeholder')"
                :tooltip="t('traefik.ingressRoute.tls.certResolver.tooltip')"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model="value.spec.tls.store.name"
                :mode="mode"
                :label="t('traefik.ingressRoute.tls.store.label')"
                :tooltip="t('traefik.ingressRoute.tls.store.tooltip')"
              />
            </div>
          </div>

          <!-- Domains -->
          <div class="domains-section">
            <h5>{{ t('traefik.ingressRoute.tls.domains.label') }}</h5>
            <div v-for="(domain, l) in value.spec.tls.domains" :key="l" class="row">
              <div class="col span-5">
                <LabeledInput
                  v-model="domain.main"
                  :mode="mode"
                  :label="t('traefik.ingressRoute.tls.domains.main.label')"
                  :placeholder="t('traefik.ingressRoute.tls.domains.main.placeholder')"
                  :rules="fvGetAndReportPathRules(`spec.tls.domains.${l}.main`)"
                />
              </div>
              <div class="col span-5">
                <LabeledInput
                  v-model="domain.sans"
                  :mode="mode"
                  :label="t('traefik.ingressRoute.tls.domains.sans.label')"
                  :placeholder="t('traefik.ingressRoute.tls.domains.sans.placeholder')"
                  :tooltip="t('traefik.ingressRoute.tls.domains.sans.tooltip')"
                />
              </div>
              <div class="col span-2">
                <button 
                  type="button" 
                  class="btn role-link" 
                  @click="removeDomain(l)"
                >
                  {{ t('generic.remove') }}
                </button>
              </div>
            </div>

            <button 
              type="button" 
              class="btn role-secondary" 
              @click="addDomain"
            >
              {{ t('traefik.ingressRoute.tls.domains.addDomain') }}
            </button>
          </div>
        </template>
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { Banner } from '@components/Banner';
import { allHash } from '@shell/utils/promise';

export default {
  name: 'IngressRouteEdit',

  components: {
    CruResource,
    NameNsDescription,
    Tabbed,
    Tab,
    LabeledInput,
    LabeledSelect,
    Checkbox,
    Banner
  },

  mixins: [CreateEditView, FormValidation],

  async fetch() {
    const promises = {
      services: this.$store.dispatch('cluster/findAll', { type: 'service' }),
      secrets: this.$store.dispatch('cluster/findAll', { type: 'secret' })
    };

    try {
      const hash = await allHash(promises);
      this.services = hash.services || [];
      this.secrets = hash.secrets || [];
    } catch (e) {
      console.error('Error fetching resources:', e);
    }
  },

  data() {
    return {
      services: [],
      secrets: [],
      fvFormRuleSets: [
        {
          path: 'metadata.name',
          rules: ['required'],
          translationKey: 'nameNsDescription.name.label'
        },
        {
          path: 'spec.entryPoints',
          rules: ['required'],
          translationKey: 'traefik.ingressRoute.entryPoints.label'
        },
        {
          path: 'spec.routes.match',
          rules: ['required'],
          translationKey: 'traefik.ingressRoute.routes.match.label'
        }
      ]
    };
  },

  computed: {
    entryPointOptions() {
      return [
        { label: this.t('traefik.ingressRoute.entryPoints.web'), value: 'web' },
        { label: this.t('traefik.ingressRoute.entryPoints.websecure'), value: 'websecure' },
        { label: this.t('traefik.ingressRoute.entryPoints.traefik'), value: 'traefik' }
      ];
    },

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
    },

    serviceOptions() {
      return this.services
        .filter(service => service.namespace === this.value.metadata.namespace)
        .map(service => ({
          label: service.metadata.name,
          value: service.metadata.name
        }));
    },

    secretOptions() {
      return this.secrets
        .filter(secret => 
          secret.namespace === this.value.metadata.namespace && 
          secret._type === 'kubernetes.io/tls'
        )
        .map(secret => ({
          label: secret.metadata.name,
          value: secret.metadata.name
        }));
    },

    tlsEnabled: {
      get() {
        return !!this.value.spec.tls;
      },
      set(enabled) {
        if (enabled) {
          this.$set(this.value.spec, 'tls', {
            secretName: '',
            domains: [],
            options: {},
            store: {}
          });
        } else {
          this.$delete(this.value.spec, 'tls');
        }
      }
    },

    tlsSecretRules() {
      if (this.tlsEnabled && !this.value.spec.tls?.certResolver) {
        return ['required'];
      }
      return [];
    },

    tabErrors() {
      return {
        entryPoints: !!this.fvGetPathErrors(['spec.entryPoints'])?.length,
        routes: !!this.fvGetPathErrors(['spec.routes'])?.length,
        tls: !!this.fvGetPathErrors(['spec.tls'])?.length
      };
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
    this.initializeDefaults();
  },

  methods: {
    initializeDefaults() {
      if (!this.value.spec) {
        this.$set(this.value, 'spec', {});
      }

      if (!this.value.spec.entryPoints) {
        this.$set(this.value.spec, 'entryPoints', ['web']);
      }

      if (!this.value.spec.routes || this.value.spec.routes.length === 0) {
        this.$set(this.value.spec, 'routes', [{
          match: '',
          services: [{
            name: '',
            port: 80,
            kind: 'Service'
          }],
          middlewares: []
        }]);
      }
    },

    willSave() {
      // Clean up empty values before saving
      this.value.spec.routes = this.value.spec.routes.filter(route => 
        route.match && route.services?.some(s => s.name)
      );

      // Clean up TLS configuration
      if (this.value.spec.tls && !this.value.spec.tls.secretName && !this.value.spec.tls.certResolver) {
        delete this.value.spec.tls;
      }
    },

    addRoute() {
      this.value.spec.routes.push({
        match: '',
        services: [{
          name: '',
          port: 80,
          kind: 'Service'
        }],
        middlewares: []
      });
    },

    removeRoute(index) {
      this.value.spec.routes.splice(index, 1);
    },

    addService(routeIndex) {
      this.value.spec.routes[routeIndex].services.push({
        name: '',
        port: 80,
        kind: 'Service'
      });
    },

    removeService(routeIndex, serviceIndex) {
      this.value.spec.routes[routeIndex].services.splice(serviceIndex, 1);
    },

    addMiddleware(routeIndex) {
      if (!this.value.spec.routes[routeIndex].middlewares) {
        this.$set(this.value.spec.routes[routeIndex], 'middlewares', []);
      }
      this.value.spec.routes[routeIndex].middlewares.push({
        name: '',
        namespace: this.value.metadata.namespace
      });
    },

    removeMiddleware(routeIndex, middlewareIndex) {
      this.value.spec.routes[routeIndex].middlewares.splice(middlewareIndex, 1);
    },

    addDomain() {
      if (!this.value.spec.tls.domains) {
        this.$set(this.value.spec.tls, 'domains', []);
      }
      this.value.spec.tls.domains.push({
        main: '',
        sans: []
      });
    },

    removeDomain(index) {
      this.value.spec.tls.domains.splice(index, 1);
    }
  }
};
</script>

<style lang="scss" scoped>
.route-section {
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
.middleware-section,
.domains-section {
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
</style>