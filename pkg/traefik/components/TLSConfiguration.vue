<template>
  <div class="tls-view-container">
    <!-- TLS Enabled State -->
    <div v-if="tlsConfig">
      <Banner 
        color="success" 
        :closable="false"
        class="mb-20"
      >
        <div class="banner-content">
          <i class="icon icon-lock" />
          <span>{{ t('traefik.ingressRoute.tls.enabled') }}</span>
        </div>
      </Banner>
      
      <div class="tls-cards-grid">
        <!-- Certificate Card -->
        <Card v-if="hasCertificateInfo" class="tls-card" :show-actions="false">
          <template #title>
            <h4 class="card-title">
              <i class="icon icon-file" />
              {{ t('traefik.ingressRoute.tls.certificate.title') }}
            </h4>
          </template>
          <template #body>
            <div class="info-row" v-if="tlsConfig.secretName">
              <label>{{ t('traefik.ingressRoute.tls.secretName.label') }}</label>
              <router-link
                :to="secretLink"
                class="resource-link"
              >
                {{ tlsConfig.secretName }}
              </router-link>
            </div>
            <div class="info-row" v-if="tlsConfig.certResolver">
              <label>{{ t('traefik.ingressRoute.tls.certResolver.label') }}</label>
              <span class="value">{{ tlsConfig.certResolver }}</span>
            </div>
          </template>
        </Card>

        <!-- Configuration Card -->
        <Card v-if="hasConfigInfo" class="tls-card" :show-actions="false">
          <template #title>
            <h4 class="card-title">
              <i class="icon icon-gear" />
              {{ t('traefik.ingressRoute.tls.configuration.title') }}
            </h4>
          </template>
          <template #body>
            <div class="info-row" v-if="tlsConfig.options?.name">
              <label>{{ t('traefik.ingressRoute.tls.options.label') }}</label>
              <router-link
                :to="tlsOptionsLink"
                class="resource-link"
              >
                {{ tlsConfig.options.name }}
              </router-link>
            </div>
            <div class="info-row" v-if="tlsConfig.store?.name">
              <label>{{ t('traefik.ingressRoute.tls.store.label') }}</label>
              <router-link
                :to="tlsStoreLink"
                class="resource-link"
              >
                {{ tlsConfig.store.name }}
              </router-link>
            </div>
          </template>
        </Card>

        <!-- Domains Card -->
        <Card v-if="hasDomains" class="tls-card" :show-actions="false">
          <template #title>
            <h4 class="card-title">
              <i class="icon icon-globe" />
              {{ t('traefik.ingressRoute.tls.domains.label') }}
            </h4>
          </template>
          <template #body>
            <div class="domains-list">
              <div
                v-for="(domain, k) in tlsConfig.domains"
                :key="k"
                class="domain-item"
              >
                <div class="domain-main">
                  <i class="icon icon-dot" />
                  {{ domain.main }}
                </div>
                <div v-if="domain.sans && domain.sans.length" class="domain-sans">
                  <BadgeState
                    v-clean-tooltip="{
                      content: domain.sans.join('<br>'),
                      placement: 'top'
                    }"
                    :label="`+${domain.sans.length} SAN${domain.sans.length > 1 ? 's' : ''}`"
                    color="info"
                    class="sans-badge"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- TLS Disabled State -->
    <Banner 
      v-else
      color="info" 
      :closable="false"
    >
      <div class="banner-content">
        <i class="icon icon-info-circle" />
        <span>{{ t('traefik.ingressRoute.tls.notConfigured') }}</span>
      </div>
    </Banner>
  </div>
</template>

<script>
import { get } from '@shell/utils/object';
import { Banner } from '@components/Banner';
import { Card } from '@components/Card';
import { BadgeState } from '@components/BadgeState';
import cleanTooltipDirective from '@shell/directives/clean-tooltip';

export default {
  name: 'TLSConfiguration',

  components: {
    Banner,
    Card,
    BadgeState
  },

  directives: {
    cleanTooltip: cleanTooltipDirective
  },

  props: {
    value: {
      type: Object,
      required: true
    }
  },

  computed: {
    tlsConfig() {
      const tls = get(this.value, 'spec.tls');
      // Check if TLS is actually configured (not just an empty object)
      if (!tls || Object.keys(tls).length === 0) {
        return null;
      }
      return tls;
    },

    hasCertificateInfo() {
      return this.tlsConfig?.secretName || this.tlsConfig?.certResolver;
    },

    hasConfigInfo() {
      return this.tlsConfig?.options?.name || this.tlsConfig?.store?.name;
    },

    hasDomains() {
      return this.tlsConfig?.domains && this.tlsConfig.domains.length > 0;
    },

    secretLink() {
      if (!this.tlsConfig?.secretName) {
        return null;
      }

      const cluster = this.$route.params.cluster;
      if (!cluster) return null;
      
      const namespace = this.value.metadata.namespace;
      if (!namespace) return null;

      // Create direct path instead of using router-link params
      return `/c/${cluster}/explorer/secret/${namespace}/${this.tlsConfig.secretName}`;
    },

    tlsOptionsLink() {
      if (!this.tlsConfig?.options?.name) {
        return null;
      }

      const cluster = this.$route.params.cluster;
      if (!cluster) return null;
      
      const namespace = this.value.metadata.namespace;
      if (!namespace) return null;

      // Create direct path for TLSOption resource
      return `/c/${cluster}/explorer/traefik.io.tlsoption/${namespace}/${this.tlsConfig.options.name}`;
    },

    tlsStoreLink() {
      if (!this.tlsConfig?.store?.name) {
        return null;
      }

      const cluster = this.$route.params.cluster;
      if (!cluster) return null;
      
      const namespace = this.value.metadata.namespace;
      if (!namespace) return null;

      // Create direct path for TLSStore resource
      return `/c/${cluster}/explorer/traefik.io.tlsstore/${namespace}/${this.tlsConfig.store.name}`;
    }
  },

  methods: {
    t(key) {
      return this.$store.getters['i18n/t'](key);
    }
  }
};
</script>

<style lang="scss" scoped>
.tls-view-container {
  padding: 0;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .icon {
    font-size: 1.2em;
  }
  
  span {
    font-weight: 500;
  }
}

.tls-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  
  // Responsive breakpoints
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
  
  @media (min-width: 769px) and (max-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
  
  @media (min-width: 1201px) {
    grid-template-columns: repeat(3, 1fr);
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
    
    .resource-link {
      display: inline-flex;
      align-items: center;
      color: var(--link);
      text-decoration: none;
      font-size: 0.9em;
      word-break: break-word;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .domains-list {
    max-height: 200px;
    overflow-y: auto;
    
    .domain-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
      
      &:last-child {
        border-bottom: none;
      }
      
      .domain-main {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9em;
        color: var(--text-primary);
        
        .icon {
          font-size: 0.6em;
          color: var(--text-secondary);
        }
      }
      
      .domain-sans {
        display: flex;
        align-items: center;
        
        .sans-badge {
          cursor: help;
        }
      }
    }
  }
}

</style>