<script>
import merge from 'lodash/merge';
import { allHashSettled } from '@shell/utils/promise';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { SECRET } from '@shell/config/types';
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
import { Checkbox } from '@components/Form/Checkbox';
import ArrayList from '@shell/components/form/ArrayList';
import ArrayListSelect from '@shell/components/form/ArrayListSelect';
import { Card } from '@components/Card';

export default {
  name: 'CRUTLSOption',
  inheritAttrs: false,
  emits: ['input'],
  components: {
    CruResource,
    NameNsDescription,
    Labels,
    Tab,
    Tabbed,
    LabeledSelect,
    Banner,
    Loading,
    Checkbox,
    ArrayList,
    ArrayListSelect,
    Card
  },

  mixins: [CreateEditView, FormValidation, ResourceManager],

  async fetch() {
    // Configuration pour le ResourceManager
    const namespace = this.value?.metadata?.namespace || null;

    const secondaryResourceDataConfig = {
      namespace,
      data: {
        [SECRET]: {
          applyTo: [
            { var: 'secrets', classify: true }
          ]
        }
      }
    };

    // Charger les ressources namespaced avec ResourceManager
    await this.resourceManagerFetchSecondaryResources(secondaryResourceDataConfig);
  },

  data() {
    const emptySpec = {
      minVersion: '',
      maxVersion: '',
      cipherSuites: [],
      clientAuth: {
        clientAuthType: 'NoClientCert',
        secretNames: []
      },
      alpnProtocols: [],
      curvePreferences: [],
      sniStrict: false,
      disableSessionTickets: false,
      preferServerCipherSuites: false
    };

    if (this.mode === _CREATE) {
      this.value['spec'] = merge(this.value.spec, emptySpec);
    } else {
      // Ensure existing spec structure for edit mode - preserve existing values
      this.value.spec = this.value.spec || {};
      this.value.spec.cipherSuites = this.value.spec.cipherSuites || [];
      this.value.spec.alpnProtocols = this.value.spec.alpnProtocols || [];
      this.value.spec.curvePreferences = this.value.spec.curvePreferences || [];

      // Only initialize clientAuth if it doesn't exist
      if (!this.value.spec.clientAuth) {
        this.value.spec.clientAuth = {
          clientAuthType: 'NoClientCert',
          secretNames: []
        };
      } else {
        // Ensure secretNames array exists
        this.value.spec.clientAuth.secretNames = this.value.spec.clientAuth.secretNames || [];
      }
    }

    return {
      // Ressources chargées par ResourceManager
      secrets: [],

      // État du composant
      errors: [],

      // Liste des chemins gérés par les composants enfants
      fvReportedValidationPaths: [
        'spec.minVersion',
        'spec.maxVersion',
        'spec.clientAuth.clientAuthType',
        'spec.clientAuth.secretNames'
      ],

      // FormValidation ruleSets
      fvFormRuleSets: [
        {
          path: 'metadata.name',
          rules: ['required'],
          translationKey: 'nameNsDescription.name.label'
        },
        {
          path: 'metadata.namespace',
          rules: ['required'],
          translationKey: 'nameNsDescription.namespace.label'
        }
      ]
    };
  },

  computed: {
    // Computed for tab error indicators
    tabErrors() {
      return {
        tlsVersions: this.fvGetPathErrors(['spec.minVersion', 'spec.maxVersion']).length > 0,
        cipherSuites: this.fvGetPathErrors(['spec.cipherSuites', 'spec.preferServerCipherSuites']).length > 0,
        clientAuth: this.fvGetPathErrors(['spec.clientAuth.clientAuthType', 'spec.clientAuth.secretNames']).length > 0,
        advanced: this.fvGetPathErrors(['spec.sniStrict', 'spec.disableSessionTickets']).length > 0
      };
    },

    isView() {
      return this.mode === _VIEW;
    },
    validationPassed() {
      // Validate both through FormValidation and the component validation events
      return this.fvFormIsValid;
    },

    validationErrors() {
      const errors = [];

      // Include errors from FormValidation
      return [...this.fvUnreportedValidationErrors, ...errors, ...this.errors];
    },

    secretTargets() {
      return this.secrets
        .filter(secret => secret._type === 'kubernetes.io/tls')
        .map(secret => ({
          label: secret.metadata.name,
          value: secret.metadata.name
        }));
    },

    requiresClientCerts() {
      const authType = this.value.spec?.clientAuth?.clientAuthType;
      return ['RequireAnyClientCert', 'VerifyClientCertIfGiven', 'RequireAndVerifyClientCert'].includes(authType);
    },

    tlsVersionOptions() {
      return this.value?.tlsVersions || [
        { value: 'VersionTLS10', label: 'TLS 1.0' },
        { value: 'VersionTLS11', label: 'TLS 1.1' },
        { value: 'VersionTLS12', label: 'TLS 1.2' },
        { value: 'VersionTLS13', label: 'TLS 1.3' },
      ];
    },

    clientAuthTypeOptions() {
      return this.value?.clientAuthTypes || [
        {
          value: 'NoClientCert',
          label: 'No Client Certificate',
          description: 'No client certificate required'
        },
        {
          value: 'RequestClientCert',
          label: 'Request Client Certificate',
          description: 'Client certificate is requested but not required'
        },
        {
          value: 'RequireAnyClientCert',
          label: 'Require Any Client Certificate',
          description: 'Client certificate is required but not validated'
        },
        {
          value: 'VerifyClientCertIfGiven',
          label: 'Verify Client Certificate If Given',
          description: 'Client certificate is verified if provided'
        },
        {
          value: 'RequireAndVerifyClientCert',
          label: 'Require and Verify Client Certificate',
          description: 'Client certificate is required and validated'
        }
      ];
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  watch: {
    // Watch namespace changes to reload resources
    async 'value.metadata.namespace'(neu) {
      if (neu && !this.$fetchState.pending) {
        const config = {
          namespace: neu,
          data: {
            [SECRET]: {
              applyTo: [{ var: 'secrets', classify: true }]
            }
          }
        };

        await this.resourceManagerFetchSecondaryResources(config);
      }
    }
  },

  methods: {
    willSave() {
      // Nettoyer les valeurs par défaut si elles ne sont pas définies
      if (!this.value.spec) {
        this.value.spec = {};
      }

      // Clean up empty arrays and undefined values
      const spec = this.value.spec;

      // Remove empty strings for TLS versions (allow them to be undefined)
      if (spec.minVersion === '') {
        delete spec.minVersion;
      }
      if (spec.maxVersion === '') {
        delete spec.maxVersion;
      }

      // Clean up empty arrays
      if (spec.cipherSuites && spec.cipherSuites.length === 0) {
        delete spec.cipherSuites;
      }
      if (spec.alpnProtocols && spec.alpnProtocols.length === 0) {
        delete spec.alpnProtocols;
      }
      if (spec.curvePreferences && spec.curvePreferences.length === 0) {
        delete spec.curvePreferences;
      }

      // Clean up boolean defaults
      if (spec.sniStrict === false) {
        delete spec.sniStrict;
      }
      if (spec.disableSessionTickets === false) {
        delete spec.disableSessionTickets;
      }
      if (spec.preferServerCipherSuites === false) {
        delete spec.preferServerCipherSuites;
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
        <!-- TLS Versions Tab -->
        <Tab
          name="tls-versions"
          :label="t('traefik.tlsOption.tabs.tlsVersions')"
          :weight="10"
          :error="tabErrors.tlsVersions"
        >
          <div class="row">
            <div class="col span-12">
              <Banner
                color="info"
                :label="t('traefik.tlsOption.tlsVersions.description')"
              />
            </div>
          </div>

          <div class="row mt-20">
            <div class="col span-12">
              <Card class="tls-versions-card" :show-actions="false">
                <template #title>
                  <h4 class="card-title">
                    <i class="icon icon-lock" />
                    {{ t('traefik.tlsOption.tabs.tlsVersions') }}
                  </h4>
                </template>
                <template #body>
                  <div class="row">
                    <div class="col span-6">
                      <LabeledSelect
                        v-model:value="value.spec.minVersion"
                        :label="t('traefik.tlsOption.minVersion.label')"
                        :options="tlsVersionOptions"
                        :mode="mode"
                        :tooltip="t('traefik.tlsOption.minVersion.tooltip')"
                        option-key="value"
                        option-label="label"
                        :searchable="false"
                        :clearable="true"
                        :rules="fvGetAndReportPathRules('spec.minVersion')"
                      />
                    </div>
                    <div class="col span-6">
                      <LabeledSelect
                        v-model:value="value.spec.maxVersion"
                        :label="t('traefik.tlsOption.maxVersion.label')"
                        :options="tlsVersionOptions"
                        :mode="mode"
                        :tooltip="t('traefik.tlsOption.maxVersion.tooltip')"
                        option-key="value"
                        option-label="label"
                        :searchable="false"
                        :clearable="true"
                        :rules="fvGetAndReportPathRules('spec.maxVersion')"
                      />
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </Tab>

        <!-- Cipher Suites Tab -->
        <Tab
          name="cipher-suites"
          :label="t('traefik.tlsOption.tabs.cipherSuites')"
          :weight="9"
          :error="tabErrors.cipherSuites"
        >
          <div class="row">
            <div class="col span-12">
              <Banner
                color="info"
                :label="t('traefik.tlsOption.cipherSuites.description')"
              />
            </div>
          </div>

          <div class="row mt-20">
            <div class="col span-12">
              <Card class="cipher-suites-card" :show-actions="false">
                <template #title>
                  <h4 class="card-title">
                    <i class="icon icon-shield" />
                    {{ t('traefik.tlsOption.cipherSuites.label') }}
                  </h4>
                </template>
                <template #body>
                  <ArrayList
                    v-model:value="value.spec.cipherSuites"
                    :title="t('traefik.tlsOption.cipherSuites.label')"
                    :mode="mode"
                    :add-label="t('traefik.tlsOption.cipherSuites.add')"
                    :placeholder="t('traefik.tlsOption.cipherSuites.placeholder')"
                    :tooltip="t('traefik.tlsOption.cipherSuites.tooltip')"
                    :initial-empty-row="false"
                    default-add-value=""
                    add-allowed
                  />

                  <div class="mt-20">
                    <Checkbox
                      v-model:value="value.spec.preferServerCipherSuites"
                      :label="t('traefik.tlsOption.preferServerCipherSuites.label')"
                      :mode="mode"
                      :tooltip="t('traefik.tlsOption.preferServerCipherSuites.tooltip')"
                    />
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </Tab>

        <!-- Client Authentication Tab -->
        <Tab
          name="client-auth"
          :label="t('traefik.tlsOption.tabs.clientAuth')"
          :weight="8"
          :error="tabErrors.clientAuth"
        >
          <div class="row">
            <div class="col span-12">
              <Banner
                color="info"
                :label="t('traefik.tlsOption.clientAuth.description')"
              />
            </div>
          </div>

          <div class="row mt-20">
            <div class="col span-12">
              <Card class="client-auth-card" :show-actions="false">
                <template #title>
                  <h4 class="card-title">
                    <i class="icon icon-user" />
                    {{ t('traefik.tlsOption.clientAuth.label') }}
                  </h4>
                </template>
                <template #body>
                  <div class="row">
                    <div class="col span-12">
                      <LabeledSelect
                        v-model:value="value.spec.clientAuth.clientAuthType"
                        :label="t('traefik.tlsOption.clientAuth.type.label')"
                        :options="clientAuthTypeOptions"
                        :mode="mode"
                        :tooltip="t('traefik.tlsOption.clientAuth.type.tooltip')"
                        option-key="value"
                        option-label="label"
                        :searchable="false"
                        :rules="fvGetAndReportPathRules('spec.clientAuth.clientAuthType')"
                      />
                    </div>
                  </div>

                  <div
                    class="row mt-20"
                  >
                    <div class="col span-12">
                      <ArrayListSelect
                        v-model:value="value.spec.clientAuth.secretNames"
                        :options="secretTargets"
                        :array-list-props="{
                          title: t('traefik.tlsOption.clientAuth.secrets.label'),
                          addLabel: t('traefik.tlsOption.clientAuth.secrets.add'),
                          mode: mode
                        }"
                        :select-props="{
                          placeholder: t('traefik.tlsOption.clientAuth.secrets.placeholder'),
                          searchable: true,
                          clearable: true
                        }"
                        :loading="!secrets || $fetchState.pending"
                        :disabled="mode === 'view'"
                      />
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </Tab>

        <!-- Advanced Options Tab -->
        <Tab
          name="advanced"
          :label="t('traefik.tlsOption.tabs.advanced')"
          :weight="7"
          :error="tabErrors.advanced"
        >
          <div class="row">
            <div class="col span-12">
              <Banner
                color="info"
                :label="t('traefik.tlsOption.advanced.description')"
              />
            </div>
          </div>

          <div class="row mt-20">
            <div class="col span-12">
              <Card class="advanced-options-card" :show-actions="false">
                <template #title>
                  <h4 class="card-title">
                    <i class="icon icon-settings" />
                    {{ t('traefik.tlsOption.tabs.advanced') }}
                  </h4>
                </template>
                <template #body>
                  <!-- ALPN Protocols -->
                  <div class="mb-20">
                    <h5>{{ t('traefik.tlsOption.alpnProtocols.label') }}</h5>
                    <ArrayList
                      v-model:value="value.spec.alpnProtocols"
                      :title="t('traefik.tlsOption.alpnProtocols.label')"
                      :mode="mode"
                      :add-label="t('traefik.tlsOption.alpnProtocols.add')"
                      :placeholder="t('traefik.tlsOption.alpnProtocols.placeholder')"
                      :tooltip="t('traefik.tlsOption.alpnProtocols.tooltip')"
                      :initial-empty-row="false"
                      default-add-value=""
                      add-allowed
                    />
                  </div>

                  <!-- Curve Preferences -->
                  <div class="mb-20">
                    <h5>{{ t('traefik.tlsOption.curvePreferences.label') }}</h5>
                    <ArrayList
                      v-model:value="value.spec.curvePreferences"
                      :title="t('traefik.tlsOption.curvePreferences.label')"
                      :mode="mode"
                      :add-label="t('traefik.tlsOption.curvePreferences.add')"
                      :placeholder="t('traefik.tlsOption.curvePreferences.placeholder')"
                      :tooltip="t('traefik.tlsOption.curvePreferences.tooltip')"
                      :initial-empty-row="false"
                      default-add-value=""
                      add-allowed
                    />
                  </div>

                  <!-- Boolean Options -->
                  <div class="row">
                    <div class="col span-6">
                      <Checkbox
                        v-model:value="value.spec.sniStrict"
                        :label="t('traefik.tlsOption.sniStrict.label')"
                        :mode="mode"
                        :tooltip="t('traefik.tlsOption.sniStrict.tooltip')"
                      />
                    </div>
                    <div class="col span-6">
                      <Checkbox
                        v-model:value="value.spec.disableSessionTickets"
                        :label="t('traefik.tlsOption.disableSessionTickets.label')"
                        :mode="mode"
                        :tooltip="t('traefik.tlsOption.disableSessionTickets.tooltip')"
                      />
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </Tab>

        <!-- Labels & Annotations Tab -->
        <Tab
          name="labels"
          label-key="generic.labelsAndAnnotations"
          :weight="0"
        >
          <Labels
            :value="value"
            :mode="mode"
          />
        </Tab>
      </Tabbed>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--input-label);

  .icon {
    color: var(--primary);
    font-size: 1.1em;
  }
}

.tls-versions-card,
.cipher-suites-card,
.client-auth-card,
.advanced-options-card {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);

}

h5 {
  color: var(--input-label);
  margin-bottom: 10px;
  font-weight: 500;
}

.mt-20 {
  margin-top: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>