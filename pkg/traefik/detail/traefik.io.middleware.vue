<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import { Banner } from '@components/Banner';
import { Card } from '@components/Card';
import YamlEditor from '@shell/components/YamlEditor';

export default {
  name: 'MiddlewareDetail',

  components: {
    ResourceTabs,
    Tab,
    Banner,
    Card,
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
    middlewareTypes() {
      if (!this.value.spec) return {};
      return this.value.spec;
    },

    middlewareTypesArray() {
      return Object.entries(this.middlewareTypes);
    },

    hasMultipleTypes() {
      return this.middlewareTypesArray.length > 1;
    },
  },

  methods: {
    getDisplayName(type) {
      const typeMap = {
        addPrefix: this.t('traefik.middleware.types.addPrefix.label'),
        addHeaders: this.t('traefik.middleware.types.addHeaders.label'),
        basicAuth: this.t('traefik.middleware.types.basicAuth.label'),
        buffering: this.t('traefik.middleware.types.buffering.label'),
        chain: this.t('traefik.middleware.types.chain.label'),
        circuitBreaker: this.t('traefik.middleware.types.circuitBreaker.label'),
        compress: this.t('traefik.middleware.types.compress.label'),
        contentType: this.t('traefik.middleware.types.contentType.label'),
        digestAuth: this.t('traefik.middleware.types.digestAuth.label'),
        errors: this.t('traefik.middleware.types.errors.label'),
        forwardAuth: this.t('traefik.middleware.types.forwardAuth.label'),
        grpcWeb: this.t('traefik.middleware.types.grpcWeb.label'),
        headers: this.t('traefik.middleware.types.headers.label'),
        inFlightReq: this.t('traefik.middleware.types.inFlightReq.label'),
        ipAllowList: this.t('traefik.middleware.types.ipAllowList.label'),
        ipWhiteList: this.t('traefik.middleware.types.ipWhiteList.label'),
        passTLSClientCert: this.t('traefik.middleware.types.passTLSClientCert.label'),
        plugin: this.t('traefik.middleware.types.plugin.label'),
        rateLimit: this.t('traefik.middleware.types.rateLimit.label'),
        redirectRegex: this.t('traefik.middleware.types.redirectRegex.label'),
        redirectScheme: this.t('traefik.middleware.types.redirectScheme.label'),
        replacePath: this.t('traefik.middleware.types.replacePath.label'),
        replacePathRegex: this.t('traefik.middleware.types.replacePathRegex.label'),
        retry: this.t('traefik.middleware.types.retry.label'),
        stripPrefix: this.t('traefik.middleware.types.stripPrefix.label'),
        stripPrefixRegex: this.t('traefik.middleware.types.stripPrefixRegex.label')
      };

      return typeMap[type] || type || 'Unknown';
    },


    getTypeDescription(type) {
      const descriptionKey = `traefik.middleware.types.${type}.description`;
      const description = this.t(descriptionKey);

      // If translation is not found (returns the key), return default message
      return description !== descriptionKey ? description : 'Middleware configuration';
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
      :label="t('traefik.configuration')"
      :weight="10"
    >
      <div class="row">
        <div class="col span-12">
          <Banner
            color="info"
            :label="t('traefik.middleware.description')"
          />
        </div>
      </div>

      <!-- Middleware Cards Grid -->
      <div class="middleware-cards-grid">
        <Card
          v-for="[type, config] in middlewareTypesArray"
          :key="type"
          class="middleware-card"
          :show-actions="false"
        >
          <template #title>
            <h4 class="card-title">
              {{ getDisplayName(type) }}
            </h4>
          </template>
          <template #body>
            <!-- Type Description -->
            <div class="type-description">
              <p><i class="icon icon-info-circle" /> {{ getTypeDescription(type) }}</p>
            </div>

            <!-- Configuration YAML -->
            <div class="yaml-configuration">
              <h5 class="yaml-title">{{ t('traefik.middleware.spec.label') }}</h5>
              <YamlEditor
                ref="yaml"
                :value="config"
                :scrolling="false"
                :initial-yaml-values="config"
                :editor-mode="'VIEW_CODE'"
                :as-object="true"
              />
            </div>
          </template>
        </Card>
      </div>
    </Tab>
  </ResourceTabs>
</template>

<style lang="scss" scoped>
.middleware-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 20px;

  // Responsive breakpoints
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  @media (min-width: 769px) and (max-width: 1199px) {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.middleware-card {
  height: fit-content;
  min-height: 200px;

  .card-title {
    margin: 0;
    font-size: 0.95em;
    font-weight: 600;
    color: var(--text-primary);
  }

  .type-description {
    margin-bottom: 10px;
    padding-bottom: 8px;
    p {
      margin: 0;
      font-size: 0.9em;
      color: var(--text-secondary);
      font-style: italic;
      line-height: 1.4;
    }
  }

  .yaml-configuration {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);

    .yaml-title {
      margin: 0 0 10px 0;
      font-size: 0.9em;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

</style>