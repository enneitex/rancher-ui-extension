<template>
  <div v-if="matchRules && matchRules.length" class="routes-list-formatter">
    <div
      v-for="(rule, i) in matchRules"
      :key="i"
      class="rule-item"
    >
      <!-- Règle de match cliquable -->
      <div class="match-part">
        <a
          v-if="rule.primaryUrl"
          :href="rule.primaryUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="rule-link"
        >
          <span class="match-text">{{ rule.matchRule }}</span>
          <i class="icon icon-external-link" />
        </a>
        <span
          v-else
          class="rule-text"
        >
          {{ rule.matchRule }}
        </span>
      </div>

      <!-- Services ciblés avec flèche -->
      <div v-if="rule.services && rule.services.length" class="services-part">
        <i class="icon icon-chevron-right" />
        <div class="services-list">
          <div
            v-for="(service, j) in rule.services"
            :key="j"
            class="service-item"
          >
            <router-link
              v-if="service.targetLink"
              :to="service.targetLink"
              class="service-link"
            >
              {{ service.display }}
            </router-link>
            <span v-else class="service-name">
              {{ service.display }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <span v-else class="text-muted">{{ t('generic.none') }}</span>
</template>

<script>
export default {
  name: 'RoutesListFormatter',

  props: {
    value: {
      type: [Array, String],
      default: null
    },
    row: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    // Detect if this is a TCP route
    isTCPRoute() {
      return this.row?._type === 'traefik.io.ingressroutetcp';
    },

    matchRules() {
      // Obtenir les routes depuis la ressource
      const routes = this.row?.spec?.routes || [];
      if (!routes.length) return [];

      return routes.map(route => {
        const matchRule = route.match;
        if (!matchRule) return { matchRule: '-', primaryUrl: null, services: [] };

        // Pour TCP, pas d'URL cliquable
        const primaryUrl = this.isTCPRoute ? null : this.calculatePrimaryUrl(matchRule);

        // Créer les données des services avec liens cliquables
        const services = (route.services || []).map(service => {
          const name = service.name;
          const port = service.port ? `:${service.port}` : '';
          const weight = service.weight ? ` (${service.weight}%)` : '';
          const namespace = service.namespace ? `${service.namespace}/` : '';
          const kind = service.kind || 'Service';
          const kindDisplay = kind !== 'Service' ? ` (${kind})` : '';

          // Pour TCP, afficher le port
          const display = this.isTCPRoute
            ? `${namespace}${name || '-'}${port}${kindDisplay}${weight}`
            : `${namespace}${name || '-'}${kindDisplay}${weight}`;

          // Use the service's namespace if defined, otherwise fall back to IngressRoute's namespace
          const serviceNamespace = service.namespace || this.row?.metadata?.namespace;

          // Create link only if service has a valid name
          let targetLink = null;
          if (name && name !== '-') {
            targetLink = this.createServiceLink(name, serviceNamespace, kind);
          }

          return {
            display,
            targetLink
          };
        });

        return {
          matchRule,
          primaryUrl,
          services
        };
      });
    }
  },

  methods: {
    calculatePrimaryUrl(matchRule) {
      if (!matchRule) return null;

      // Extraire le premier host depuis la règle match
      const hostMatch = matchRule.match(/Host\(`([^`]+)`\)/);
      if (!hostMatch) return null;

      const firstHost = hostMatch[1].split(',')[0].trim(); // Prendre le premier host si multiple

      // Extraire le path optionnel
      const pathMatch = matchRule.match(/Path(?:Prefix)?\(`([^`]*)`\)/);
      const pathValue = pathMatch ? pathMatch[1] : '';

      // Utiliser toujours HTTPS pour la sécurité
      const protocol = 'https://';

      const fullUrl = `${protocol}${firstHost}${pathValue}`;

      return this.isValidUrl(fullUrl) ? fullUrl : null;
    },

    createServiceLink(serviceName, namespace, serviceKind = 'Service') {
      if (!serviceName) return null;
      if (!namespace) return null;

      // Route to TraefikService or native Service based on kind
      if (serviceKind === 'TraefikService') {
        return {
          name:   'c-cluster-product-resource-namespace-id',
          params: {
            product:   'traefik',
            resource:  'traefik.io.traefikservice',
            id:        serviceName,
            namespace: namespace,
          }
        };
      } else {
        // Use Rancher standard route object for native services
        return {
          name:   'c-cluster-product-resource-namespace-id',
          params: {
            product:   'explorer',
            resource:  'service',
            id:        serviceName,
            namespace: namespace,
          }
        };
      }
    },

    isValidUrl(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    t(key) {
      return this.$store.getters['i18n/t'](key);
    }
  }
};
</script>

<style lang="scss" scoped>
.routes-list-formatter {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.match-part {
  display: flex;
  align-items: flex-start;
  max-width: 80%;
}

.services-part {
  display: flex;
  align-items: center;
  gap: 8px;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rule-link {
  color: var(--link);
  text-decoration: none;
  display: inline;

  &:hover {
    text-decoration: underline;
    color: var(--link-hover);
  }

  .match-text {
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .icon {
    font-size: 0.8em;
    opacity: 0.7;
    margin-left: 4px;
    vertical-align: baseline;
  }
}

.rule-text {
  color: var(--body-text);
}

.service-item {
  display: flex;
  align-items: center;
}

.service-link {
  color: var(--link);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
    color: var(--link-hover);
  }
}

.service-name {
  color: var(--body-text);
}

.text-muted {
  color: var(--muted);
  font-style: italic;
}
</style>