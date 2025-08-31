<template>
  <div class="row">
    <div class="col span-12">
      <div v-if="tlsConfig" class="tls-section">
        <div class="tls-status">
          <i class="icon icon-lock text-success" />
          <span class="text-success">{{ t('traefik.ingressRoute.tls.enabled') }}</span>
        </div>
        
        <div v-if="tlsConfig.secretName" class="tls-detail">
          <strong>{{ t('traefik.ingressRoute.tls.secretName.label') }}:</strong>
          <router-link
            :to="secretLink"
            class="secret-link"
          >
            <i class="icon icon-lock" />
            {{ tlsConfig.secretName }}
          </router-link>
        </div>
        
        <div v-if="tlsConfig.certResolver" class="tls-detail">
          <strong>{{ t('traefik.ingressRoute.tls.certResolver.label') }}:</strong>
          <span>{{ tlsConfig.certResolver }}</span>
        </div>
        
        <div v-if="tlsConfig.domains && tlsConfig.domains.length" class="tls-detail">
          <strong>{{ t('traefik.ingressRoute.tls.domains.label') }}:</strong>
          <div class="domains-list">
            <div
              v-for="(domain, k) in tlsConfig.domains"
              :key="k"
              class="domain-item"
            >
              <span class="domain-main">{{ domain.main }}</span>
              <span v-if="domain.sans && domain.sans.length" class="domain-sans">
                (+ {{ domain.sans.length }} SAN{{ domain.sans.length > 1 ? 's' : '' }})
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="tlsConfig.options?.name" class="tls-detail">
          <strong>{{ t('traefik.ingressRoute.tls.options.label') }}:</strong>
          <span>{{ tlsConfig.options.name }}</span>
        </div>
        
        <div v-if="tlsConfig.store?.name" class="tls-detail">
          <strong>{{ t('traefik.ingressRoute.tls.store.label') }}:</strong>
          <span>{{ tlsConfig.store.name }}</span>
        </div>
      </div>
      <div v-else class="tls-disabled">
        <div class="text-center text-muted">
          <i class="icon icon-unlock" />
          <p>{{ t('traefik.ingressRoute.tls.disabled') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { get } from '@shell/utils/object';

export default {
  name: 'TLSConfiguration',

  props: {
    value: {
      type: Object,
      required: true
    }
  },

  computed: {
    tlsConfig() {
      return get(this.value, 'spec.tls');
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
.tls-section {
  margin-top: 15px;
}

.tls-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 1.1em;
}

.tls-detail {
  margin-bottom: 15px;
  
  strong {
    display: inline-block;
    min-width: 150px;
    color: var(--input-label);
    font-weight: 600;
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

.domains-list {
  margin-top: 8px;
}

.domain-item {
  padding: 4px 0;
  
  .domain-main {
    font-weight: 500;
  }
  
  .domain-sans {
    color: var(--muted);
    font-size: 0.9em;
    margin-left: 8px;
  }
}

.text-center {
  text-align: center;
  
  .icon {
    font-size: 2em;
    color: var(--muted);
    margin-bottom: 10px;
  }
  
  p {
    color: var(--muted);
    font-style: italic;
  }
}

.text-success {
  color: var(--success);
}

.text-muted {
  color: var(--muted);
}

.tls-disabled {
  margin-top: 20px;
}
</style>