<template>
  <ResourceTabs
    :value="value"
    :mode="mode"
  >
      <!-- Configuration Tab -->
      <Tab
        name="config"
        :label="t('traefik.configuration')"
        :weight="10"
      >
      <div class="row">
        <div class="col span-12">
          <h3>{{ t('traefik.tlsOption.description') }}</h3>
          <Banner
            color="info"
            :label="t('traefik.tlsOption.description')"
          />
        </div>
      </div>

      <!-- TLS Version Configuration -->
      <div class="row">
        <div class="col span-12">
          <h4>TLS Version Configuration</h4>
          <div class="version-grid">
            <div class="version-item">
              <div class="version-header">
                <i class="icon icon-lock" />
                <strong>{{ t('traefik.tlsOption.minVersion.label') }}</strong>
              </div>
              <div class="version-value">
                {{ tlsVersionDisplay(value.spec?.minVersion) }}
              </div>
            </div>
            <div class="version-item">
              <div class="version-header">
                <i class="icon icon-lock" />
                <strong>{{ t('traefik.tlsOption.maxVersion.label') }}</strong>
              </div>
              <div class="version-value">
                {{ tlsVersionDisplay(value.spec?.maxVersion) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cipher Suites -->
      <div class="row">
        <div class="col span-12">
          <h4>{{ t('traefik.tlsOption.cipherSuites.label') }}</h4>
          <div v-if="cipherSuites && cipherSuites.length" class="cipher-suites-section">
            <div class="cipher-suites-grid">
              <div
                v-for="cipher in cipherSuites"
                :key="cipher"
                class="cipher-item"
              >
                <i class="icon icon-shield" />
                <code>{{ cipher }}</code>
              </div>
            </div>
          </div>
          <div v-else class="text-muted">
            Default cipher suites will be used
          </div>
        </div>
      </div>

      <!-- Curve Preferences -->
      <div v-if="curvePreferences && curvePreferences.length" class="row">
        <div class="col span-12">
          <h4>Elliptic Curve Preferences</h4>
          <div class="curves-section">
            <div class="curves-grid">
              <div
                v-for="curve in curvePreferences"
                :key="curve"
                class="curve-item"
              >
                <i class="icon icon-graph" />
                <span>{{ curveDisplay(curve) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Client Authentication -->
      <div class="row">
        <div class="col span-12">
          <h4>{{ t('traefik.tlsOption.clientAuth.label') }}</h4>
          <div class="client-auth-section">
            <div class="auth-type-display">
              <div class="auth-type-header">
                <i class="icon icon-user" />
                <strong>Authentication Type</strong>
              </div>
              <div class="auth-type-value">
                <span :class="clientAuthStatusClass">
                  {{ clientAuthTypeDisplay }}
                </span>
              </div>
            </div>

            <!-- CA Files -->
            <div v-if="clientAuthConfig?.caFiles && clientAuthConfig.caFiles.length" class="client-auth-detail">
              <div class="ca-files-section">
                <strong>{{ t('traefik.tlsOption.clientAuth.caFiles.label') }}</strong>
                <div class="ca-files-list">
                  <div
                    v-for="caFile in clientAuthConfig.caFiles"
                    :key="caFile"
                    class="ca-file-item"
                  >
                    <i class="icon icon-file" />
                    <code>{{ caFile }}</code>
                  </div>
                </div>
              </div>
            </div>

            <!-- CA Secret -->
            <div v-if="clientAuthConfig?.secretName" class="client-auth-detail">
              <strong>CA Secret:</strong>
              <router-link
                :to="secretLink"
                class="secret-link"
              >
                <i class="icon icon-lock" />
                {{ clientAuthConfig.secretName }}
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Options -->
      <div class="row">
        <div class="col span-12">
          <h4>Advanced Configuration</h4>
          <div class="advanced-options-grid">
            <div v-if="value.spec?.sni !== undefined" class="advanced-option">
              <div class="option-header">
                <i class="icon icon-globe" />
                <strong>SNI (Server Name Indication)</strong>
              </div>
              <div class="option-value">
                <span :class="value.spec.sni ? 'text-success' : 'text-muted'">
                  {{ value.spec.sni ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </div>

            <div v-if="value.spec?.preferServerCipherSuites !== undefined" class="advanced-option">
              <div class="option-header">
                <i class="icon icon-settings" />
                <strong>Prefer Server Cipher Suites</strong>
              </div>
              <div class="option-value">
                <span :class="value.spec.preferServerCipherSuites ? 'text-success' : 'text-muted'">
                  {{ value.spec.preferServerCipherSuites ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </div>

            <!-- ALPN Protocols -->
            <div v-if="alpnProtocols && alpnProtocols.length" class="advanced-option full-width">
              <div class="option-header">
                <i class="icon icon-network" />
                <strong>ALPN Protocols</strong>
              </div>
              <div class="option-value">
                <div class="alpn-protocols-list">
                  <div
                    v-for="protocol in alpnProtocols"
                    :key="protocol"
                    class="alpn-protocol-item"
                  >
                    {{ alpnProtocolDisplay(protocol) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Tab>
  </ResourceTabs>
</template>

<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import { Banner } from '@components/Banner';
import { get } from '@shell/utils/object';

export default {
  name: 'TLSOptionDetail',

  components: {
    ResourceTabs,
    Tab,
    Banner
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
      if (!this.clientAuthConfig?.secretName) {
        return null;
      }

      const cluster = this.$route.params.cluster;
      if (!cluster) return null;

      const namespace = this.value.metadata.namespace;
      if (!namespace) return null;

      // Create direct path instead of using router-link params
      return `/c/${cluster}/explorer/secret/${namespace}/${this.clientAuthConfig.secretName}`;
    }
  },

  methods: {
    tlsVersionDisplay(version) {
      if (!version) return 'Default';

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
    }
  }
};
</script>

<style lang="scss" scoped>
.version-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.version-item {
  background: var(--box-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 20px;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--input-label);

  .icon {
    color: var(--primary);
  }
}

.version-value {
  font-size: 1.1em;
  font-weight: 500;
  color: var(--body-text);
}

.cipher-suites-section {
  margin-top: 10px;
}

.cipher-suites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 10px;
  margin-top: 15px;
}

.cipher-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-btn);
  padding: 10px;
  border-radius: var(--border-radius);
  font-size: 0.9em;

  .icon {
    color: var(--success);
    font-size: 0.9em;
  }

  code {
    font-size: 0.85em;
    font-weight: 500;
  }
}

.curves-section {
  margin-top: 10px;
}

.curves-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.curve-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--info-banner-bg);
  color: var(--info);
  padding: 8px 12px;
  border-radius: var(--border-radius);
  font-weight: 500;

  .icon {
    font-size: 0.9em;
  }
}

.client-auth-section {
  background: var(--box-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 20px;
  margin-top: 10px;
}

.auth-type-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border);
}

.auth-type-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--input-label);

  .icon {
    color: var(--primary);
  }
}

.auth-type-value {
  font-weight: 500;
}

.client-auth-detail {
  margin-bottom: 15px;

  strong {
    display: block;
    margin-bottom: 8px;
    color: var(--input-label);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.ca-files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ca-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-btn);
  padding: 8px 12px;
  border-radius: var(--border-radius);

  .icon {
    color: var(--info);
    font-size: 0.9em;
  }

  code {
    font-size: 0.9em;
  }
}

.secret-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--link);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  .icon {
    font-size: 0.9em;
  }
}

.advanced-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 10px;
}

.advanced-option {
  background: var(--box-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 15px;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.option-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--input-label);

  .icon {
    color: var(--primary);
    font-size: 0.9em;
  }
}

.option-value {
  font-weight: 500;
}

.alpn-protocols-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.alpn-protocol-item {
  background: var(--primary);
  color: var(--primary-text);
  padding: 4px 8px;
  border-radius: var(--border-radius);
  font-size: 0.9em;
  font-weight: 500;
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

h3 {
  color: var(--body-text);
  margin-bottom: 20px;
}

h4 {
  color: var(--input-label);
  margin: 30px 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
</style>