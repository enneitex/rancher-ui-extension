<template>
  <ResourceTabs
    :value="value"
    :mode="mode"
  >
      <!-- Configuration Tab -->
      <Tab
        name="config"
        :label="t('generic.configuration')"
        :weight="10"
      >
      <div class="row">
        <div class="col span-12">
          <h3>{{ t('traefik.middleware.description') }}</h3>
          <Banner
            color="info"
            :label="middlewareDescription"
          />
        </div>
      </div>

      <!-- Middleware Type Information -->
      <div class="row">
        <div class="col span-12">
          <h4>{{ t('traefik.middleware.type.label') }}</h4>
          <div class="middleware-type-badge">
            <i class="icon icon-filter" />
            <span class="type-name">{{ middlewareTypeDisplay }}</span>
            <span class="type-description">{{ middlewareTypeDescription }}</span>
          </div>
        </div>
      </div>

      <!-- Configuration Details -->
      <div class="row">
        <div class="col span-12">
          <h4>{{ t('traefik.middleware.spec.label') }}</h4>
          <div v-if="middlewareConfig" class="config-display">
            <!-- Add Headers Configuration -->
            <div v-if="middlewareType === 'addHeaders'" class="config-section">
              <h5>{{ t('traefik.middleware.type.addHeaders') }} Configuration</h5>
              <div v-if="middlewareConfig.request && middlewareConfig.request.headers" class="config-detail">
                <strong>Request Headers:</strong>
                <div class="headers-list">
                  <div
                    v-for="(value, key) in middlewareConfig.request.headers"
                    :key="key"
                    class="header-item"
                  >
                    <code class="header-key">{{ key }}</code>
                    <span class="header-separator">:</span>
                    <code class="header-value">{{ value }}</code>
                  </div>
                </div>
              </div>
            </div>

            <!-- Basic Auth Configuration -->
            <div v-else-if="middlewareType === 'basicAuth'" class="config-section">
              <h5>{{ t('traefik.middleware.type.basicAuth') }} Configuration</h5>
              <div class="config-detail">
                <strong>Secret:</strong>
                <router-link
                  v-if="middlewareConfig.secret"
                  :to="secretLink"
                  class="secret-link"
                >
                  <i class="icon icon-lock" />
                  {{ middlewareConfig.secret }}
                </router-link>
                <span v-else class="text-muted">Not configured</span>
              </div>
              <div v-if="middlewareConfig.realm" class="config-detail">
                <strong>Realm:</strong>
                <span>{{ middlewareConfig.realm }}</span>
              </div>
              <div class="config-detail">
                <strong>Remove Header:</strong>
                <span :class="middlewareConfig.removeHeader ? 'text-success' : 'text-muted'">
                  {{ middlewareConfig.removeHeader ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </div>

            <!-- Headers Configuration -->
            <div v-else-if="middlewareType === 'headers'" class="config-section">
              <h5>{{ t('traefik.middleware.type.headers') }} Configuration</h5>

              <div v-if="middlewareConfig.customRequestHeaders" class="config-detail">
                <strong>Custom Request Headers:</strong>
                <div class="headers-list">
                  <div
                    v-for="(value, key) in middlewareConfig.customRequestHeaders"
                    :key="key"
                    class="header-item"
                  >
                    <code class="header-key">{{ key }}</code>
                    <span class="header-separator">:</span>
                    <code class="header-value">{{ value }}</code>
                  </div>
                </div>
              </div>

              <div v-if="middlewareConfig.customResponseHeaders" class="config-detail">
                <strong>Custom Response Headers:</strong>
                <div class="headers-list">
                  <div
                    v-for="(value, key) in middlewareConfig.customResponseHeaders"
                    :key="key"
                    class="header-item"
                  >
                    <code class="header-key">{{ key }}</code>
                    <span class="header-separator">:</span>
                    <code class="header-value">{{ value }}</code>
                  </div>
                </div>
              </div>

              <!-- Security Headers -->
              <div class="security-headers">
                <strong>Security Configuration:</strong>
                <div class="security-grid">
                  <div v-if="middlewareConfig.sslRedirect !== undefined" class="security-item">
                    <span class="security-label">SSL Redirect:</span>
                    <span :class="middlewareConfig.sslRedirect ? 'text-success' : 'text-muted'">
                      {{ middlewareConfig.sslRedirect ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>
                  <div v-if="middlewareConfig.stsSeconds" class="security-item">
                    <span class="security-label">STS Seconds:</span>
                    <span>{{ middlewareConfig.stsSeconds }}</span>
                  </div>
                  <div v-if="middlewareConfig.stsIncludeSubdomains !== undefined" class="security-item">
                    <span class="security-label">STS Include Subdomains:</span>
                    <span :class="middlewareConfig.stsIncludeSubdomains ? 'text-success' : 'text-muted'">
                      {{ middlewareConfig.stsIncludeSubdomains ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rate Limit Configuration -->
            <div v-else-if="middlewareType === 'rateLimit'" class="config-section">
              <h5>{{ t('traefik.middleware.type.rateLimit') }} Configuration</h5>
              <div class="rate-limit-grid">
                <div v-if="middlewareConfig.average" class="config-detail">
                  <strong>Average:</strong>
                  <span class="rate-value">{{ middlewareConfig.average }} requests</span>
                </div>
                <div v-if="middlewareConfig.burst" class="config-detail">
                  <strong>Burst:</strong>
                  <span class="rate-value">{{ middlewareConfig.burst }} requests</span>
                </div>
                <div v-if="middlewareConfig.period" class="config-detail">
                  <strong>Period:</strong>
                  <span class="rate-value">{{ middlewareConfig.period }}</span>
                </div>
              </div>
            </div>

            <!-- Redirect Scheme Configuration -->
            <div v-else-if="middlewareType === 'redirectScheme'" class="config-section">
              <h5>{{ t('traefik.middleware.type.redirectScheme') }} Configuration</h5>
              <div class="config-detail">
                <strong>Scheme:</strong>
                <span class="scheme-badge">{{ middlewareConfig.scheme?.toUpperCase() || 'HTTP' }}</span>
              </div>
              <div v-if="middlewareConfig.port" class="config-detail">
                <strong>Port:</strong>
                <span>{{ middlewareConfig.port }}</span>
              </div>
              <div class="config-detail">
                <strong>Permanent Redirect:</strong>
                <span :class="middlewareConfig.permanent ? 'text-success' : 'text-muted'">
                  {{ middlewareConfig.permanent ? 'Yes (301)' : 'No (302)' }}
                </span>
              </div>
            </div>

            <!-- Strip Prefix Configuration -->
            <div v-else-if="middlewareType === 'stripPrefix'" class="config-section">
              <h5>{{ t('traefik.middleware.type.stripPrefix') }} Configuration</h5>
              <div v-if="middlewareConfig.prefixes && middlewareConfig.prefixes.length" class="config-detail">
                <strong>Prefixes:</strong>
                <div class="prefixes-list">
                  <div
                    v-for="prefix in middlewareConfig.prefixes"
                    :key="prefix"
                    class="prefix-item"
                  >
                    <code>{{ prefix }}</code>
                  </div>
                </div>
              </div>
              <div class="config-detail">
                <strong>Force Slash:</strong>
                <span :class="middlewareConfig.forceSlash ? 'text-success' : 'text-muted'">
                  {{ middlewareConfig.forceSlash ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </div>

            <!-- Generic Configuration Display -->
            <div v-else class="config-section">
              <h5>{{ middlewareTypeDisplay }} Configuration</h5>
              <YamlEditor
                ref="yaml"
                :value="middlewareConfig"
                :scrolling="false"
                :initial-yaml-values="middlewareConfig"
                :edit-first-object="true"
                :read-only="true"
              />
            </div>
          </div>
          <div v-else class="text-muted">
            No configuration available
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
import YamlEditor from '@shell/components/YamlEditor';
import { get } from '@shell/utils/object';

export default {
  name: 'MiddlewareDetail',

  components: {
    ResourceTabs,
    Tab,
    Banner,
    YamlEditor
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
    middlewareType() {
      if (!this.value.spec) return null;
      return Object.keys(this.value.spec)[0] || null;
    },

    middlewareConfig() {
      if (!this.middlewareType) return null;
      return get(this.value, `spec.${this.middlewareType}`);
    },

    middlewareTypeDisplay() {
      const typeMap = {
        addHeaders: this.t('traefik.middleware.type.addHeaders'),
        basicAuth: this.t('traefik.middleware.type.basicAuth'),
        compress: this.t('traefik.middleware.type.compress'),
        headers: this.t('traefik.middleware.type.headers'),
        rateLimit: this.t('traefik.middleware.type.rateLimit'),
        redirectScheme: this.t('traefik.middleware.type.redirectScheme'),
        stripPrefix: this.t('traefik.middleware.type.stripPrefix'),
        retry: this.t('traefik.middleware.type.retry'),
        circuitBreaker: this.t('traefik.middleware.type.circuitBreaker'),
        errors: this.t('traefik.middleware.type.errors'),
        forwardAuth: this.t('traefik.middleware.type.forwardAuth'),
        ipWhiteList: this.t('traefik.middleware.type.ipWhiteList'),
        redirectRegex: this.t('traefik.middleware.type.redirectRegex'),
        replacePath: this.t('traefik.middleware.type.replacePath'),
        replacePathRegex: this.t('traefik.middleware.type.replacePathRegex'),
        stripPrefixRegex: this.t('traefik.middleware.type.stripPrefixRegex')
      };

      return typeMap[this.middlewareType] || this.middlewareType || 'Unknown';
    },

    middlewareTypeDescription() {
      const descriptions = {
        addHeaders: 'Adds custom headers to requests',
        basicAuth: 'Provides HTTP basic authentication',
        compress: 'Enables response compression',
        headers: 'Manages request and response headers',
        rateLimit: 'Limits request rate per client',
        redirectScheme: 'Redirects HTTP to HTTPS',
        stripPrefix: 'Removes prefixes from request paths'
      };

      return descriptions[this.middlewareType] || 'Custom middleware configuration';
    },

    middlewareDescription() {
      return `${this.middlewareTypeDisplay}: ${this.middlewareTypeDescription}`;
    },

    secretLink() {
      if (!this.middlewareConfig?.secret) {
        return null;
      }

      const cluster = this.$route.params.cluster;
      if (!cluster) return null;

      const namespace = this.value.metadata.namespace;
      if (!namespace) return null;

      // Create direct path instead of using router-link params
      return `/c/${cluster}/explorer/secret/${namespace}/${this.middlewareConfig.secret}`;
    }
  }
};
</script>

<style lang="scss" scoped>
.middleware-type-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: var(--box-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  margin-bottom: 20px;

  .icon {
    color: var(--primary);
    font-size: 1.2em;
  }

  .type-name {
    font-weight: 600;
    color: var(--primary);
  }

  .type-description {
    color: var(--muted);
    font-style: italic;
  }
}

.config-display {
  margin-top: 10px;
}

.config-section {
  background: var(--box-bg);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 20px;
  margin-bottom: 20px;

  h5 {
    margin-top: 0;
    margin-bottom: 15px;
    color: var(--primary);
    font-weight: 600;
  }
}

.config-detail {
  margin-bottom: 15px;

  strong {
    display: block;
    margin-bottom: 5px;
    color: var(--input-label);
    font-size: 0.9em;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.headers-list {
  background: var(--accent-btn);
  border-radius: var(--border-radius);
  padding: 10px;
}

.header-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  font-family: monospace;

  &:not(:last-child) {
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
    margin-bottom: 8px;
  }
}

.header-key {
  background: var(--primary);
  color: var(--primary-text);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
  font-weight: 500;
}

.header-separator {
  color: var(--muted);
  font-weight: bold;
}

.header-value {
  background: var(--success);
  color: var(--success-text);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
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

.security-headers {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--border);
}

.security-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--accent-btn);
  padding: 8px 12px;
  border-radius: var(--border-radius);
}

.security-label {
  font-weight: 500;
  color: var(--input-label);
}

.rate-limit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.rate-value {
  background: var(--info);
  color: var(--info-text);
  padding: 3px 8px;
  border-radius: var(--border-radius);
  font-family: monospace;
  font-weight: 500;
}

.scheme-badge {
  background: var(--success);
  color: var(--success-text);
  padding: 3px 8px;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.9em;
}

.prefixes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.prefix-item {
  code {
    background: var(--accent-btn);
    padding: 4px 8px;
    border-radius: var(--border-radius);
    font-size: 0.9em;
  }
}

.text-success {
  color: var(--success);
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