<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="fvFormIsValid"
    :errors="fvUnreportedValidationErrors"
    :description="t('traefik.tlsOption.description')"
    @error="e=>errors = e"
    @finish="save"
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
      <!-- TLS Configuration Tab -->
      <Tab
        name="tls-config"
        :label="t('generic.configuration')"
        :weight="10"
        :error="tabErrors.config"
      >
        <div class="row">
          <div class="col span-12">
            <Banner
              color="info"
              :label="t('traefik.tlsOption.description')"
            />
          </div>
        </div>

        <!-- TLS Version Configuration -->
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="value.spec.minVersion"
              :mode="mode"
              :label="t('traefik.tlsOption.minVersion.label')"
              :tooltip="t('traefik.tlsOption.minVersion.tooltip')"
              :options="tlsVersionOptions"
              :clearable="true"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model="value.spec.maxVersion"
              :mode="mode"
              :label="t('traefik.tlsOption.maxVersion.label')"
              :tooltip="t('traefik.tlsOption.maxVersion.tooltip')"
              :options="tlsVersionOptions"
              :clearable="true"
            />
          </div>
        </div>

        <!-- Cipher Suites -->
        <div class="row">
          <div class="col span-12">
            <h4>{{ t('traefik.tlsOption.cipherSuites.label') }}</h4>
            <Banner
              color="warning"
              :label="t('traefik.tlsOption.cipherSuites.tooltip')"
            />
          </div>
        </div>

        <div class="row">
          <div class="col span-12">
            <LabeledSelect
              v-model="value.spec.cipherSuites"
              :mode="mode"
              :label="t('traefik.tlsOption.cipherSuites.label')"
              :tooltip="t('traefik.tlsOption.cipherSuites.tooltip')"
              :options="cipherSuiteOptions"
              :multiple="true"
              :taggable="true"
              :searchable="true"
            />
          </div>
        </div>

        <!-- Curve Preferences -->
        <div class="row">
          <div class="col span-12">
            <h4>Curve Preferences</h4>
            <LabeledSelect
              v-model="value.spec.curvePreferences"
              :mode="mode"
              label="Elliptic Curve Preferences"
              tooltip="Preferred elliptic curves for ECDHE cipher suites"
              :options="curveOptions"
              :multiple="true"
              :taggable="true"
              :searchable="true"
            />
          </div>
        </div>

        <!-- Client Authentication -->
        <div class="row">
          <div class="col span-12">
            <h4>{{ t('traefik.tlsOption.clientAuth.label') }}</h4>
          </div>
        </div>

        <div class="row">
          <div class="col span-12">
            <LabeledSelect
              v-model="value.spec.clientAuth.clientAuthType"
              :mode="mode"
              :label="t('traefik.tlsOption.clientAuth.type.label')"
              :options="clientAuthTypeOptions"
              :clearable="true"
            />
          </div>
        </div>

        <!-- CA Files for Client Auth -->
        <div v-if="value.spec.clientAuth && value.spec.clientAuth.clientAuthType && value.spec.clientAuth.clientAuthType !== 'NoClientCert'" class="row">
          <div class="col span-12">
            <ArrayList
              v-model="value.spec.clientAuth.caFiles"
              :mode="mode"
              :title="t('traefik.tlsOption.clientAuth.caFiles.label')"
              :tooltip="t('traefik.tlsOption.clientAuth.caFiles.tooltip')"
              :initial-empty-row="true"
              :add-label="'Add CA File'"
            />
          </div>
        </div>

        <!-- Client Auth Secret (alternative to CA Files) -->
        <div v-if="value.spec.clientAuth && value.spec.clientAuth.clientAuthType && value.spec.clientAuth.clientAuthType !== 'NoClientCert'" class="row">
          <div class="col span-12">
            <Banner
              color="info"
              label="Alternative: You can also store CA certificates in a Kubernetes Secret and reference it instead of using CA files."
            />
            <LabeledSelect
              v-model="value.spec.clientAuth.secretName"
              :mode="mode"
              label="CA Secret (Optional)"
              tooltip="Kubernetes secret containing CA certificates for client authentication"
              :options="secretOptions"
              :clearable="true"
            />
          </div>
        </div>

        <!-- SSLAPI Configuration -->
        <div class="row">
          <div class="col span-12">
            <h4>Advanced Options</h4>
          </div>
        </div>

        <div class="row">
          <div class="col span-6">
            <Checkbox
              v-model="value.spec.sni"
              :mode="mode"
              label="Enable SNI (Server Name Indication)"
              tooltip="Enable Server Name Indication for TLS handshake"
            />
          </div>
          <div class="col span-6">
            <Checkbox
              v-model="value.spec.preferServerCipherSuites"
              :mode="mode"
              label="Prefer Server Cipher Suites"
              tooltip="Server's cipher suite preferences take precedence over client's"
            />
          </div>
        </div>

        <!-- ALPN Protocols -->
        <div class="row">
          <div class="col span-12">
            <LabeledSelect
              v-model="value.spec.alpnProtocols"
              :mode="mode"
              label="ALPN Protocols"
              tooltip="Application-Layer Protocol Negotiation protocols"
              :options="alpnProtocolOptions"
              :multiple="true"
              :taggable="true"
            />
          </div>
        </div>
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
import ArrayList from '@shell/components/form/ArrayList';
import { allHash } from '@shell/utils/promise';

export default {
  name: 'TLSOptionEdit',

  components: {
    CruResource,
    NameNsDescription,
    Tabbed,
    Tab,
    LabeledInput,
    LabeledSelect,
    Checkbox,
    Banner,
    ArrayList
  },

  mixins: [CreateEditView, FormValidation],

  async fetch() {
    const promises = {
      secrets: this.$store.dispatch('cluster/findAll', { type: 'secret' })
    };

    try {
      const hash = await allHash(promises);
      this.secrets = hash.secrets || [];
    } catch (e) {
      console.error('Error fetching resources:', e);
    }
  },

  data() {
    return {
      secrets: [],
      fvFormRuleSets: [
        {
          path: 'metadata.name',
          rules: ['required'],
          translationKey: 'nameNsDescription.name.label'
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

    tlsVersionOptions() {
      return [
        { label: 'TLS 1.0', value: 'VersionTLS10' },
        { label: 'TLS 1.1', value: 'VersionTLS11' },
        { label: 'TLS 1.2', value: 'VersionTLS12' },
        { label: 'TLS 1.3', value: 'VersionTLS13' }
      ];
    },

    cipherSuiteOptions() {
      return [
        // TLS 1.3 Cipher Suites
        { label: 'TLS_AES_128_GCM_SHA256', value: 'TLS_AES_128_GCM_SHA256' },
        { label: 'TLS_AES_256_GCM_SHA384', value: 'TLS_AES_256_GCM_SHA384' },
        { label: 'TLS_CHACHA20_POLY1305_SHA256', value: 'TLS_CHACHA20_POLY1305_SHA256' },

        // TLS 1.2 and earlier
        { label: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', value: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256' },
        { label: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', value: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384' },
        { label: 'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305', value: 'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305' },
        { label: 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256', value: 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256' },
        { label: 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', value: 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384' },
        { label: 'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305', value: 'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305' },
        { label: 'TLS_RSA_WITH_AES_128_GCM_SHA256', value: 'TLS_RSA_WITH_AES_128_GCM_SHA256' },
        { label: 'TLS_RSA_WITH_AES_256_GCM_SHA384', value: 'TLS_RSA_WITH_AES_256_GCM_SHA384' }
      ];
    },

    curveOptions() {
      return [
        { label: 'P-256', value: 'CurveP256' },
        { label: 'P-384', value: 'CurveP384' },
        { label: 'P-521', value: 'CurveP521' },
        { label: 'X25519', value: 'X25519' }
      ];
    },

    clientAuthTypeOptions() {
      return [
        { label: this.t('traefik.tlsOption.clientAuth.type.none'), value: 'NoClientCert' },
        { label: this.t('traefik.tlsOption.clientAuth.type.request'), value: 'RequestClientCert' },
        { label: this.t('traefik.tlsOption.clientAuth.type.require'), value: 'RequireAnyClientCert' },
        { label: this.t('traefik.tlsOption.clientAuth.type.verify'), value: 'VerifyClientCertIfGiven' },
        { label: this.t('traefik.tlsOption.clientAuth.type.requireAndVerify'), value: 'RequireAndVerifyClientCert' }
      ];
    },

    alpnProtocolOptions() {
      return [
        { label: 'HTTP/1.1', value: 'http/1.1' },
        { label: 'HTTP/2', value: 'h2' },
        { label: 'HTTP/3', value: 'h3' }
      ];
    },

    secretOptions() {
      return this.secrets
        .filter(secret => secret.namespace === this.value.metadata.namespace)
        .map(secret => ({
          label: secret.metadata.name,
          value: secret.metadata.name
        }));
    },

    tabErrors() {
      return {
        config: !!this.fvGetPathErrors(['spec'])?.length
      };
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
    this.initializeDefaults();
  },

  methods: {
    initializeDefaults() {
      // Créer une copie fraîche de l'objet pour assurer la réactivité
      const valueCopy = JSON.parse(JSON.stringify(this.value));

      // Initialiser les objets nécessaires
      if (!valueCopy.spec) {
        valueCopy.spec = {};
      }

      // Initialize clientAuth if not present
      if (!valueCopy.spec.clientAuth) {
        valueCopy.spec.clientAuth = {
          clientAuthType: 'NoClientCert'
        };
      }

      // Remplacer l'objet complet par la nouvelle copie
      Object.assign(this.value, valueCopy);
    },

    willSave() {
      // Clean up empty arrays and undefined values
      if (this.value.spec.cipherSuites && this.value.spec.cipherSuites.length === 0) {
        delete this.value.spec.cipherSuites;
      }

      if (this.value.spec.curvePreferences && this.value.spec.curvePreferences.length === 0) {
        delete this.value.spec.curvePreferences;
      }

      if (this.value.spec.alpnProtocols && this.value.spec.alpnProtocols.length === 0) {
        delete this.value.spec.alpnProtocols;
      }

      // Clean up client auth if no client cert is required
      if (this.value.spec.clientAuth && this.value.spec.clientAuth.clientAuthType === 'NoClientCert') {
        delete this.value.spec.clientAuth.caFiles;
        delete this.value.spec.clientAuth.secretName;
      }

      // Remove empty clientAuth object
      if (this.value.spec.clientAuth &&
          Object.keys(this.value.spec.clientAuth).length === 1 &&
          this.value.spec.clientAuth.clientAuthType === 'NoClientCert') {
        delete this.value.spec.clientAuth;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
h4 {
  color: var(--input-label);
  margin: 30px 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.tls-version-section,
.client-auth-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}
</style>