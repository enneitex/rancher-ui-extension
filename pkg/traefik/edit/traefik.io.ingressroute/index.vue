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
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import Routes from './Routes';
import TLSConfiguration from './TLSConfiguration';
import IngressClassTab from './IngressClassTab.vue';

export default {
  name:         'CRUIngressRoute',
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
        'traefik.io.middleware': {
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
      entryPoints: ['websecure'],
      routes: [{
        match:       '',
        services:    [{ name: '', port: '', kind: 'Service' }],
        middlewares: []
      }]
    };

    if (this.mode === _CREATE) {
      this.value['spec'] = merge(this.value.spec, emptySpec);
    } else {
      // Ensure existing spec structure for edit mode
      this.value.spec = this.value.spec || {};
      this.value.spec.entryPoints = this.value.spec.entryPoints || ['websecure'];
      this.value.spec.routes = this.value.spec.routes || [];
      if (this.value.spec.routes.length === 0) {
        this.value.spec.routes.push({
          match:       '',
          services:    [{ name: '', port: '', kind: 'Service' }],
          middlewares: []
        });
      }
    }

    return {
      // Ressources chargées par ResourceManager (automatiquement filtrées par namespace)
      services:       [],
      secrets:        [],
      middlewares:    [],
      tlsOptions:     [],
      tlsStores:      [],
      
      // Ressources non-namespaced
      ingressClasses: [],
      
      // État du composant
      errors:         [],
      routesValid:    false,
      tlsValid:       true,

      // Liste des chemins gérés par les composants enfants
      fvReportedValidationPaths: [
        'spec.routes.match',
        'spec.routes.services.name',
        'spec.routes.services.port',
        'spec.entryPoints'
      ],

      // FormValidation ruleSets
      fvFormRuleSets: [
        // Routes validation - pour toutes les routes
        {
          path: 'spec.routes.match',
          rules: ['required'],
          translationKey: 'traefik.ingressRoute.routes.match.label'
        },
        // Service validation - pour tous les services dans toutes les routes
        {
          path: 'spec.routes.services.name',
          rules: ['required'],
          translationKey: 'traefik.ingressRoute.routes.service.label'
        },
        {
          path: 'spec.routes.services.port',
          rules: ['required'],
          translationKey: 'traefik.ingressRoute.routes.port.label'
        },
        // Entry Points validation
        {
          path: 'spec.entryPoints',
          rules: ['required'],
          translationKey: 'traefik.ingressRoute.entryPoints.label'
        }
      ]
    };
  },

  computed: {
    // Override doneParams to exclude 'product' parameter
    doneParams() {
      return {
        cluster: this.$route.params.cluster,
        resource: this.$route.params.resource || this.value.type
      };
    },

    // Computed for tab error indicators
    tabErrors() {
      return {
        entrypoints: !this.entryPointsValid,
        routes:      !this.routesValid || this.fvGetPathErrors(['spec.routes.match', 'spec.routes.services.name', 'spec.routes.services.port']).length > 0,
        tls:         !this.tlsValid
      };
    },

    entryPointOptions() {
      return [
        { label: this.t('traefik.ingressRoute.entryPoints.websecure'), value: 'websecure' }
      ];
    },

    isView() {
      return this.mode === _VIEW;
    },

    entryPointsValid() {
      // Vérifie que spec.entryPoints est un tableau contenant 'websecure'
      return Array.isArray(this.value.spec.entryPoints) &&
             this.value.spec.entryPoints.includes('websecure');
    },

    // Use the FormValidation mixin for validation
    validationPassed() {
      // Validate both through FormValidation and the component validation events
      return this.fvFormIsValid && this.routesValid && this.tlsValid && this.entryPointsValid;
    },

    validationErrors() {
      const errors = [];

      // Include errors from FormValidation
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

    middlewareTargets() {
      return this.middlewares
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
        // Surveiller les routes pour mettre à jour les validations si nécessaire
        this.routesValid = routes && routes.length > 0 && routes.every(route => !!route.match);
      },
      deep: true,
      immediate: true
    },

    // Watch namespace changes to reload resources
    async 'value.metadata.namespace'(neu) {
      if (neu && !this.$fetchState.pending) {
        // Configuration avec le nouveau namespace
        const config = {
          namespace: neu,
          data: {
            [SERVICE]: {
              applyTo: [{ var: 'services', classify: true }]
            },
            [SECRET]: {
              applyTo: [{ var: 'secrets', classify: true }]
            },
            'traefik.io.middleware': {
              applyTo: [{ var: 'middlewares', classify: true }]
            },
            'traefik.io.tlsoption': {
              applyTo: [{ var: 'tlsOptions', classify: true }]
            },
            'traefik.io.tlsstore': {
              applyTo: [{ var: 'tlsStores', classify: true }]
            }
          }
        };
        
        // Recharger les ressources pour le nouveau namespace
        await this.resourceManagerFetchSecondaryResources(config);
      }
    }
  },

  methods: {

    willSave() {
      // IngressClassTab component already manages the ingress class annotation directly
      // No need for additional processing here

      // Clean up vKey from all nested objects before saving
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

      // Ne pas nettoyer les routes avec match vide pour permettre à l'API
      // de générer des erreurs de validation appropriées

      // Traitement TLS configuration
      // Si tls n'a pas de champs remplis (mais existe),
      // garder spec.tls comme un objet vide plutôt que de le supprimer
      if (this.value.spec.tls) {
        const hasTlsContent = !!(this.value.spec.tls.secretName ||
                              this.value.spec.tls.certResolver ||
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
          :label="t('traefik.ingressRoute.entryPoints.label')"
          :weight="10"
          :error="tabErrors.entrypoints"
        >
          <div class="row">
            <div class="col span-12">
              <Banner
                color="info"
                :label="t('traefik.ingressRoute.entryPoints.description')"
              />
            </div>
          </div>

          <div v-if="!entryPointsValid" class="row mb-10">
            <div class="col span-12">
              <Banner
                color="error"
                :label="t('traefik.ingressRoute.validation.entryPointsRequired')"
              />
            </div>
          </div>

          <div class="row">
            <div class="col span-12">
              <LabeledSelect
                v-model:value="value.spec.entryPoints"
                :mode="mode"
                :label="t('traefik.ingressRoute.entryPoints.label')"
                :multiple="true"
                :taggable="true"
                :options="entryPointOptions"
                :error="!entryPointsValid ? t('traefik.ingressRoute.validation.entryPointsRequired') : null"
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
          <Loading v-if="isLoadingSecondaryResources" />
          <Routes
            v-else
            :value="value"
            :mode="mode"
            :service-targets="serviceTargets"
            :middleware-targets="middlewareTargets"
            @validation-changed="val => routesValid = val"
          />
        </Tab>

        <!-- TLS Tab -->
        <Tab
          name="tls"
          :label="t('traefik.ingressRoute.tls.label')"
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