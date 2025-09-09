<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import { Banner } from '@components/Banner';
import { Card } from '@components/Card';
import { get } from '@shell/utils/object';
import CompactList from '../formatters/CompactList.vue';

export default {
  name: 'TLSOptionDetail',

  components: {
    ResourceTabs,
    Tab,
    Banner,
    Card,
    CompactList
  },

  props: {
    value: {
      type: Object,
      required: true
    },
    mode: {
      type: String,
      default: 'view'
    }
  },

  computed: {
    cipherSuites() {
      return get(this.value, 'spec.cipherSuites') || [];
    },

    curvePreferences() {
      return get(this.value, 'spec.curvePreferences') || [];
    },

    alpnProtocols() {
      return get(this.value, 'spec.alpnProtocols') || [];
    },

    clientAuthConfig() {
      return get(this.value, 'spec.clientAuth');
    },

    hasTlsVersions() {
      return this.value.spec?.minVersion || this.value.spec?.maxVersion;
    },

    hasCipherSuites() {
      return (this.cipherSuites && this.cipherSuites.length > 0) || this.value.spec?.preferServerCipherSuites !== undefined;
    },

    hasClientAuth() {
      return this.clientAuthConfig && (this.clientAuthConfig.clientAuthType || (this.clientAuthConfig.secretNames && this.clientAuthConfig.secretNames.length > 0));
    },

    hasAdvancedOptions() {
      return this.value.spec?.sniStrict !== undefined ||
             this.value.spec?.disableSessionTickets !== undefined ||
             (this.alpnProtocols && this.alpnProtocols.length > 0) ||
             (this.curvePreferences && this.curvePreferences.length > 0);
    },

    clientAuthTypeDisplay() {
      const authTypeMap = {
        NoClientCert: 'No Client Certificate',
        RequestClientCert: 'Request Client Certificate',
        RequireAnyClientCert: 'Require Any Client Certificate',
        VerifyClientCertIfGiven: 'Verify Client Certificate If Given',
        RequireAndVerifyClientCert: 'Require and Verify Client Certificate'
      };

      const authType = this.clientAuthConfig?.clientAuthType || 'NoClientCert';
      return authTypeMap[authType] || authType;
    },

    clientAuthStatusClass() {
      const authType = this.clientAuthConfig?.clientAuthType || 'NoClientCert';

      if (authType === 'NoClientCert') return 'text-muted';
      if (authType.includes('Require')) return 'text-success';
      return 'text-warning';
    },

    secretLink() {
      // Kept for backward compatibility but unused now
      return null;
    }
  },

  methods: {
    tlsVersionDisplay(version) {
      if (!version) return this.t('generic.default');

      const versionMap = {
        VersionTLS10: 'TLS 1.0',
        VersionTLS11: 'TLS 1.1',
        VersionTLS12: 'TLS 1.2',
        VersionTLS13: 'TLS 1.3'
      };

      return versionMap[version] || version;
    },

    curveDisplay(curve) {
      const curveMap = {
        CurveP256: 'P-256',
        CurveP384: 'P-384',
        CurveP521: 'P-521',
        X25519: 'X25519'
      };

      return curveMap[curve] || curve;
    },

    alpnProtocolDisplay(protocol) {
      const protocolMap = {
        'http/1.1': 'HTTP/1.1',
        'h2': 'HTTP/2',
        'h3': 'HTTP/3'
      };

      return protocolMap[protocol] || protocol;
    },

    getSecretLink(secretName) {
      const cluster = this.$route.params.cluster;
      if (!cluster) return null;

      const namespace = this.value.metadata.namespace;
      if (!namespace) return null;

      // Create direct path to secret
      return `/c/${cluster}/explorer/secret/${namespace}/${secretName}`;
    },

    t(key) {
      return this.$store.getters['i18n/t'](key);
    }
  }
};
</script>

<template>
  <ResourceTabs
    :value="value"
    :mode="mode"
  >
    <!-- Configuration Tab -->
    <Tab
      name="configuration"
      :label="t('traefik.tlsOption.tabs.configuration')"
      :weight="10"
    >

      <div class="tlsoption-cards-grid">
        <!-- TLS Versions Card -->
        <Card v-if="hasTlsVersions" class="tls-card" :show-actions="false">
          <template #title>
            <h4 class="card-title">
              <i class="icon icon-lock" />
              {{ t('traefik.tlsOption.tabs.tlsVersions') }}
            </h4>
          </template>
          <template #body>
            <div class="info-row">
              <label>{{ t('traefik.tlsOption.minVersion.label') }}</label>
              <span class="value">{{ tlsVersionDisplay(value.spec?.minVersion) }}</span>
            </div>
            <div class="info-row">
              <label>{{ t('traefik.tlsOption.maxVersion.label') }}</label>
              <span class="value">{{ tlsVersionDisplay(value.spec?.maxVersion) }}</span>
            </div>
          </template>
        </Card>

        <!-- Cipher Suites Card -->
        <Card v-if="hasCipherSuites" class="tls-card" :show-actions="false">
          <template #title>
            <h4 class="card-title">
              <i class="icon icon-shield" />
              {{ t('traefik.tlsOption.tabs.cipherSuites') }}
            </h4>
          </template>
          <template #body>
            <div v-if="cipherSuites && cipherSuites.length" class="cipher-suites-section">
              <div class="cipher-suites-list">
                <div
                  v-for="cipher in cipherSuites"
                  :key="cipher"
                  class="cipher-item"
                >
                  {{ cipher }}
                </div>
              </div>
            </div>
            <div v-else class="text-muted">
              {{ t('traefik.tlsOption.cipherSuites.default') }}
            </div>
            <div v-if="value.spec?.preferServerCipherSuites !== undefined" class="info-row">
              <label>{{ t('traefik.tlsOption.preferServerCipherSuites.label') }}</label>
              <span :class="value.spec.preferServerCipherSuites ? 'text-success' : 'text-muted'">
                {{ value.spec.preferServerCipherSuites ? t('generic.enabled') : t('generic.disabled') }}
              </span>
            </div>
          </template>
        </Card>

        <!-- Client Authentication Card -->
        <Card v-if="hasClientAuth" class="tls-card" :show-actions="false">
          <template #title>
            <h4 class="card-title">
              <i class="icon icon-user" />
              {{ t('traefik.tlsOption.tabs.clientAuth') }}
            </h4>
          </template>
          <template #body>
            <div class="info-row">
              <label>{{ t('traefik.tlsOption.clientAuth.type.label') }}</label>
              <span class="value">
                {{ clientAuthTypeDisplay }}
              </span>
            </div>
            <div v-if="clientAuthConfig?.secretNames && clientAuthConfig.secretNames.length" class="ca-secrets-section">
              <label class="secrets-label">{{ t('traefik.tlsOption.clientAuth.secrets.label') }}</label>
              <div class="ca-secrets-list">
                <div
                  v-for="secretName in clientAuthConfig.secretNames"
                  :key="secretName"
                  class="ca-secret-item"
                >
                  <router-link
                    :to="getSecretLink(secretName)"
                    class="secret-link"
                  >
                    <i class="icon icon-lock" />
                    {{ secretName }}
                  </router-link>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Advanced Options Card -->
        <Card v-if="hasAdvancedOptions" class="tls-card" :show-actions="false">
          <template #title>
            <h4 class="card-title">
              <i class="icon icon-settings" />
              {{ t('traefik.tlsOption.tabs.advanced') }}
            </h4>
          </template>
          <template #body>
            <div v-if="value.spec?.sniStrict !== undefined" class="info-row">
              <label>{{ t('traefik.tlsOption.sniStrict.label') }}</label>
              <span :class="value.spec.sniStrict ? 'text-success' : 'text-muted'">
                {{ value.spec.sniStrict ? t('generic.enabled') : t('generic.disabled') }}
              </span>
            </div>
            <div v-if="value.spec?.disableSessionTickets !== undefined" class="info-row">
              <label>{{ t('traefik.tlsOption.disableSessionTickets.label') }}</label>
              <span :class="value.spec.disableSessionTickets ? 'text-success' : 'text-muted'">
                {{ value.spec.disableSessionTickets ? t('generic.enabled') : t('generic.disabled') }}
              </span>
            </div>
            <div v-if="alpnProtocols && alpnProtocols.length" class="protocols-section">
              <label class="protocols-label">{{ t('traefik.tlsOption.alpnProtocols.label') }}</label>
              <div class="protocols-list">
                <div
                  v-for="protocol in alpnProtocols"
                  :key="protocol"
                  class="protocol-item"
                >
                  {{ alpnProtocolDisplay(protocol) }}
                </div>
              </div>
            </div>
            <div v-if="curvePreferences && curvePreferences.length" class="curves-section">
              <label class="curves-label">{{ t('traefik.tlsOption.curvePreferences.label') }}</label>
              <div class="curves-list">
                <div
                  v-for="curve in curvePreferences"
                  :key="curve"
                  class="curve-item"
                >
                  {{ curveDisplay(curve) }}
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </Tab>
  </ResourceTabs>
</template>

<style lang="scss" scoped>
.tlsoption-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;

  // Responsive breakpoints
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  @media (min-width: 769px) and (max-width: 1199px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.tls-card {
  height: fit-content;
  min-height: 150px;

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 0.95em;
    font-weight: 600;
    color: var(--text-primary);

    .icon {
      font-size: 1.1em;
      color: var(--text-secondary);
    }
  }

  .info-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--border);
    gap: 8px;

    &:last-child {
      border-bottom: none;
    }

    label {
      font-weight: 500;
      font-size: 0.9em;
      color: var(--text-secondary);
      margin: 0;
      flex-shrink: 0;

      &:after {
        content: ':';
      }
    }

    .value {
      color: var(--text-primary);
      font-size: 0.9em;
      word-break: break-word;
    }
  }

  .secrets-label, .protocols-label, .curves-label {
    display: block;
    font-weight: 500;
    font-size: 0.9em;
    color: var(--text-secondary);
    margin: 15px 0 8px 0;
  }

  .ca-secrets-section, .protocols-section, .curves-section {
    margin-top: 10px;
  }
}

.cipher-suites-section {
  margin-top: 10px;
}

.cipher-suites-list {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  gap: 3px;
}


.curves-section {
  margin-top: 10px;
}

.curves-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 10px;
}

.curve-item {
  padding: 3px 0;
  font-size: 0.9em;
  color: var(--body-text);
  line-height: 1.4;
}


.ca-secrets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ca-secret-item {
  display: flex;
  align-items: center;
}

.secret-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--link);
  text-decoration: none;
  font-size: 0.9em;

  &:hover {
    text-decoration: underline;
  }

  .icon {
    font-size: 0.9em;
  }
}


.protocols-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 10px;
}

.protocol-item {
  padding: 3px 0;
  font-size: 0.9em;
  color: var(--body-text);
  line-height: 1.4;
}

.text-success {
  color: var(--success);
  font-weight: 500;
}

.text-warning {
  color: var(--warning);
  font-weight: 500;
}

.text-muted {
  color: var(--muted);
  font-style: italic;
}

</style>
