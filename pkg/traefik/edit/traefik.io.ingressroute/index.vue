<script>
import merge from 'lodash/merge';
import { allHash } from '@shell/utils/promise';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { SERVICE, SECRET } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import Labels from '@shell/components/form/Labels';
import Tabbed from '@shell/components/Tabbed';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Banner } from '@components/Banner';
import Routes from './Routes';
import TLSConfiguration from './TLSConfiguration';

export default {
  name:         'CRUIngressRoute',
  inheritAttrs: false,
  components:   {
    CruResource,
    NameNsDescription,
    Routes,
    TLSConfiguration,
    Labels,
    Tab,
    Tabbed,
    LabeledSelect,
    Banner
  },

  mixins: [CreateEditView],

  async fetch() {
    const promises = {
      services:    this.$store.dispatch('cluster/findAll', { type: SERVICE }),
      secrets:     this.$store.dispatch('cluster/findAll', { type: SECRET }),
      middlewares: this.$store.dispatch('cluster/findAll', { type: 'traefik.io.middleware' })
    };

    const hash = await allHash(promises);
    
    this.services = hash.services;
    this.secrets = hash.secrets;
    this.middlewares = hash.middlewares;
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
      services:    [],
      secrets:     [],
      middlewares: []
    };
  },

  computed: {
    entryPointOptions() {
      return [
        { label: this.t('traefik.ingressRoute.entryPoints.websecure'), value: 'websecure' }
      ];
    },

    isView() {
      return this.mode === _VIEW;
    },

    serviceTargets() {
      return this.services
        .filter(service => service.namespace === this.value.metadata.namespace)
        .map(service => ({
          label: service.metadata.name,
          value: service.metadata.name,
          ports: service.spec?.ports || []
        }));
    },

    secretTargets() {
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

    middlewareTargets() {
      return this.middlewares
        .filter(middleware => middleware.metadata.namespace === this.value.metadata.namespace)
        .map(middleware => ({
          label: middleware.metadata.name,
          value: middleware.metadata.name,
          namespace: middleware.metadata.namespace
        }));
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    willSave() {
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

      // Clean up empty routes
      this.value.spec.routes = this.value.spec.routes.filter(route => 
        route.match && route.services?.some(s => s.name)
      );

      // Clean up TLS configuration
      if (this.value.spec.tls && !this.value.spec.tls.secretName && !this.value.spec.tls.certResolver) {
        delete this.value.spec.tls;
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
    :validation-passed="true"
    :errors="errors"
    @error="e => errors = e"
    @finish="save"
    @cancel="done"
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
                v-model:value="value.spec.entryPoints"
                :mode="mode"
                :label="t('traefik.ingressRoute.entryPoints.label')"
                :multiple="true"
                :taggable="true"
                :options="entryPointOptions"
              />
            </div>
          </div>
        </Tab>

        <!-- Routes Tab -->
        <Tab 
          name="routes" 
          :label="t('traefik.ingressRoute.routes.label')" 
          :weight="9"
        >
          <Routes
            :value="value"
            :mode="mode" 
            :service-targets="serviceTargets"
            :middleware-targets="middlewareTargets"
          />
        </Tab>

        <!-- TLS Tab -->
        <Tab 
          name="tls" 
          :label="t('traefik.ingressRoute.tls.label')" 
          :weight="8"
        >
          <TLSConfiguration
            :value="value"
            :mode="mode"
            :secret-targets="secretTargets"
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