<script>
import merge from 'lodash/merge';
import { allHashSettled } from '@shell/utils/promise';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { SERVICE, SECRET } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import ResourceManager from '@shell/mixins/resource-manager';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import Labels from '@shell/components/form/Labels';
import Tabbed from '@shell/components/Tabbed';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import Routes from '../../components/Routes';
import TLSConfiguration from '../common/TLSConfiguration';
import IngressClassTab from '../../components/IngressClassTab.vue';

export default {
  name:         'CRUIngressRouteTCP',
  inheritAttrs: false,
  emits:        ['input'],
  components:   {
    CruResource,
    NameNsDescription,
    Routes,
    TLSConfiguration,
    Labels,
    Tab,
    Tabbed,
    LabeledSelect,
    LabeledInput,
    Banner,
    Loading,
    IngressClassTab
  },

  mixins: [CreateEditView, FormValidation, ResourceManager],

  async fetch() {
    // Configuration pour le ResourceManager
    const namespace = this.value?.metadata?.namespace || null;

    const secondaryResourceDataConfig = {
      namespace,
      data: {
        [SERVICE]: {
          applyTo: [
            { var: 'services', classify: true }
          ]
        },
        [SECRET]: {
          applyTo: [
            { var: 'secrets', classify: true }
          ]
        },
        'traefik.io.middlewaretcp': {
          applyTo: [
            { var: 'middlewares', classify: true }
          ]
        },
        'traefik.io.tlsoption': {
          applyTo: [
            { var: 'tlsOptions', classify: true }
          ]
        },
        'traefik.io.tlsstore': {
          applyTo: [
            { var: 'tlsStores', classify: true }
          ]
        }
      }
    };

    // Charger les ressources namespaced avec ResourceManager
    await this.resourceManagerFetchSecondaryResources(secondaryResourceDataConfig);

    // Charger les ressources non-namespaced séparément
    const promises = {
      ingressClasses: this.$store.dispatch('cluster/findAll', { type: 'networking.k8s.io.ingressclass', opt: { force: true } })
    };

    const hash = await allHashSettled(promises);

    if (hash.ingressClasses?.status === 'fulfilled') {
      this.ingressClasses = hash.ingressClasses.value || [];
    }
  },

  data() {
    const emptySpec = {
      entryPoints: [],
      routes: [{
        match:       'HostSNI(`*`)',
        services:    [{ name: '', port: '', kind: 'Service' }],
        middlewares: []
      }]
    };

    if (this.mode === _CREATE) {
      this.value['spec'] = merge(this.value.spec, emptySpec);
    } else {
      // Ensure existing spec structure for edit mode
      this.value.spec = this.value.spec || {};
      this.value.spec.entryPoints = this.value.spec.entryPoints || [];
      this.value.spec.routes = this.value.spec.routes || [];
      if (this.value.spec.routes.length === 0) {
        this.value.spec.routes.push({
          match:       'HostSNI(`*`)',
          services:    [{ name: '', port: '', kind: 'Service' }],
          middlewares: []
        });
      }
    }

    return {
      // Ressources chargées par ResourceManager
      services:       [],
      secrets:        [],
      middlewaretcps: [],
      tlsOptions:     [],
      tlsStores:      [],

      // Ressources non-namespaced
      ingressClasses: [],

      // État du composant
      errors:         [],
      routesValid:    false,
      tlsValid:       true,

      // Entry points as comma-separated string for UI
      entryPointsString: (this.value.spec.entryPoints || []).join(', '),

      // FormValidation configuration
      fvReportedValidationPaths: [
        'spec.routes.match',
        'spec.routes.services.name',
        'spec.routes.services.port',
        'spec.entryPoints'
      ],

      fvFormRuleSets: [
        // Match validation
        {
          path: 'spec.routes.match',
          rules: ['required'],
          translationKey: 'traefik.ingressRouteTCP.route.match.label'
        },
        // Service validation
        {
          path: 'spec.routes.services.name',
          rules: ['required'],
          translationKey: 'traefik.ingressRouteTCP.route.service.label'
        },
        {
          path: 'spec.routes.services.port',
          rules: ['required'],
          translationKey: 'traefik.ingressRouteTCP.route.port.label'
        },
        // Entry Points validation
        {
          path: 'spec.entryPoints',
          rules: ['required'],
          translationKey: 'traefik.ingressRouteTCP.entryPoints.label'
        }
      ]
    };
  },

  computed: {
    // Computed for tab error indicators
    tabErrors() {
      return {
        entrypoints: !this.entryPointsValid,
        routes:      !this.routesValid || this.fvGetPathErrors(['spec.routes.match', 'spec.routes.services.name', 'spec.routes.services.port']).length > 0,
        tls:         !this.tlsValid
      };
    },


    isView() {
      return this.mode === _VIEW;
    },

    entryPointsValid() {
      return this.value.spec.entryPoints && this.value.spec.entryPoints.length > 0;
    },

    // Use the FormValidation mixin for validation
    validationPassed() {
      return this.fvFormIsValid && this.routesValid && this.tlsValid && this.entryPointsValid;
    },

    validationErrors() {
      const errors = [];
      return [...this.fvUnreportedValidationErrors, ...errors, ...this.errors];
    },

    serviceTargets() {
      return this.services
        .map(service => ({
          label: service.metadata.name,
          value: service.metadata.name,
          ports: service.spec?.ports || []
        }));
    },

    secretTargets() {
      return this.secrets
        .filter(secret => secret._type === 'kubernetes.io/tls')
        .map(secret => ({
          label: secret.metadata.name,
          value: secret.metadata.name
        }));
    },

    middlewareTcpTargets() {
      return this.middlewaretcps
        .map(middleware => ({
          label: middleware.metadata.name,
          value: middleware.metadata.name,
          namespace: middleware.metadata.namespace
        }));
    },

    tlsOptionsTargets() {
      return this.tlsOptions
        .map(tlsOption => ({
          label: tlsOption.metadata.name,
          value: tlsOption.metadata.name
        }));
    },

    tlsStoresTargets() {
      return this.tlsStores
        .map(tlsStore => ({
          label: tlsStore.metadata.name,
          value: tlsStore.metadata.name
        }));
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  watch: {
    'value.spec.routes': {
      handler(routes) {
        // Watch routes to update validations if necessary
        this.routesValid = routes && routes.length > 0 && routes.every(route => !!route.match);
      },
      deep: true,
      immediate: true
    },

    // Watch entryPointsString and sync with array
    entryPointsString(val) {
      if (val) {
        // Split by comma and trim whitespace
        this.value.spec.entryPoints = val.split(',').map(ep => ep.trim()).filter(ep => ep);
      } else {
        this.value.spec.entryPoints = [];
      }
    },

    // Watch namespace changes to reload resources
    async 'value.metadata.namespace'(neu) {
      if (neu && !this.$fetchState.pending) {
        const config = {
          namespace: neu,
          data: {
            [SERVICE]: {
              applyTo: [{ var: 'services', classify: true }]
            },
            [SECRET]: {
              applyTo: [{ var: 'secrets', classify: true }]
            },
            'traefik.io.middlewaretcp': {
              applyTo: [{ var: 'middlewaretcps', classify: true }]
            },
            'traefik.io.tlsoption': {
              applyTo: [{ var: 'tlsOptions', classify: true }]
            },
            'traefik.io.tlsstore': {
              applyTo: [{ var: 'tlsStores', classify: true }]
            }
          }
        };

        await this.resourceManagerFetchSecondaryResources(config);
      }
    }
  },

  methods: {
    willSave() {
      // IngressClassTab component already manages the ingress class annotation directly

      // Clean up vKey from all routes
      this.value.spec.routes.forEach(route => {
        delete route.vKey;
        if (route.services) {
          route.services.forEach(service => {
            delete service.vKey;
            // Ensure service.name and service.port are primitives, not objects
            if (typeof service.name === 'object') {
              service.name = service.name?.label || service.name?.value || '';
            }
            if (typeof service.port === 'object') {
              service.port = service.port?.label || service.port?.value || '';
            }
          });
        }
        if (route.middlewares) {
          route.middlewares.forEach(middleware => delete middleware.vKey);
        }
      });

      // Clean up vKey from TLS domains
      if (this.value.spec.tls?.domains) {
        this.value.spec.tls.domains.forEach(domain => delete domain.vKey);
      }

      // Handle TLS configuration
      if (this.value.spec.tls) {
        const hasTlsContent = !!(this.value.spec.tls.secretName ||
                              this.value.spec.tls.certResolver ||
                              this.value.spec.tls.passthrough ||
                              (this.value.spec.tls.options && this.value.spec.tls.options.name) ||
                              (this.value.spec.tls.store && this.value.spec.tls.store.name) ||
                              (this.value.spec.tls.domains && this.value.spec.tls.domains.length > 0));

        // Si aucun contenu TLS, s'assurer que c'est un objet vide
        if (!hasTlsContent) {
          this.value.spec.tls = {};
        }
      } else {
        // Si tls n'existe pas, créer un objet vide
        this.value.spec.tls = {};
      }
    }
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="validationPassed"
    :errors="validationErrors"
    @error="e => errors = e"
    @finish="save"
  >
    <div v-if="value">
      <div>
        <NameNsDescription
          v-if="!isView"
          :value="value"
          :mode="mode"
        />
      </div>

      <Tabbed :side-tabs="true">
        <!-- Entry Points Tab -->
        <Tab
          name="entrypoints"
          :label="t('traefik.ingressRouteTCP.entryPoints.label')"
          :weight="10"
          :error="tabErrors.entrypoints"
        >
          <div class="row">
            <div class="col span-12">
              <Banner
                color="info"
                :label="t('traefik.ingressRouteTCP.entryPoints.description')"
              />
            </div>
          </div>

          <div v-if="!entryPointsValid" class="row mb-10">
            <div class="col span-12">
              <Banner
                color="error"
                :label="t('traefik.ingressRouteTCP.validation.entryPointsRequired')"
              />
            </div>
          </div>

          <div class="row">
            <div class="col span-12">
              <LabeledInput
                v-model:value="entryPointsString"
                :mode="mode"
                :label="t('traefik.ingressRouteTCP.entryPoints.label')"
                :placeholder="t('traefik.ingressRouteTCP.entryPoints.placeholder')"
                :tooltip="t('traefik.ingressRouteTCP.entryPoints.tooltip')"
                :error="!entryPointsValid ? t('traefik.ingressRouteTCP.validation.entryPointsRequired') : null"
              />
            </div>
          </div>
        </Tab>

        <!-- Routes Tab -->
        <Tab
          name="routes"
          :label="t('traefik.ingressRouteTCP.route.label')"
          :weight="9"
          :error="tabErrors.routes"
        >
          <Loading v-if="isLoadingSecondaryResources" />
          <Routes
            v-else
            :value="value"
            :mode="mode"
            :service-targets="serviceTargets"
            :middleware-targets="middlewareTcpTargets"
            @validation-changed="val => routesValid = val"
          />
        </Tab>

        <!-- TLS Tab -->
        <Tab
          name="tls"
          :label="t('traefik.ingressRouteTCP.tls.label')"
          :weight="8"
          :error="tabErrors.tls"
        >
          <Loading v-if="isLoadingSecondaryResources" />
          <TLSConfiguration
            v-else
            :value="value"
            :mode="mode"
            :secret-targets="secretTargets"
            :tls-options-targets="tlsOptionsTargets"
            :tls-stores-targets="tlsStoresTargets"
            :namespace="value.metadata.namespace"
            :support-passthrough="true"
            :is-tcp="true"
            @tls-validation-changed="val => tlsValid = val"
          />
        </Tab>

        <!-- IngressClass Tab -->
        <Tab
          name="ingress-class"
          :label="t('traefik.ingressRoute.ingressClass.tab')"
          :weight="7"
        >
          <IngressClassTab
            :value="value"
            :mode="mode"
            :ingress-classes="ingressClasses"
          />
        </Tab>

        <!-- Labels & Annotations -->
        <Tab
          name="labels-and-annotations"
          label-key="generic.labelsAndAnnotations"
          :weight="-1"
        >
          <Labels
            default-container-class="labels-and-annotations-container"
            :value="value"
            :mode="mode"
            :display-side-by-side="false"
          />
        </Tab>
      </Tabbed>
    </div>
  </CruResource>
</template>