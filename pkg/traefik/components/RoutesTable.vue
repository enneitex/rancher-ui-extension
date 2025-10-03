<template>
  <div v-if="routesForTable.length">
    <SortableTable
      :rows="routesForTable"
      :headers="routeHeaders"
      key-field="_key"
      :search="false"
      :table-actions="false"
      :row-actions="false"
    >
      <template #cell:routes="{row}">
        <IngressHosts :value="row.hostRules" :row="row" />
      </template>
      <template #cell:services="{row}">
        <ServicesList :value="row.servicesData" :row="row" />
      </template>
      <template #cell:middlewares="{row}">
        <MiddlewaresList :value="row.middlewaresData" :row="row" />
      </template>
    </SortableTable>
  </div>
  <div v-else class="text-center text-muted">
    <i class="icon icon-info" />
    <p>{{ t('generic.none') }}</p>
  </div>
</template>

<script>
import SortableTable from '@shell/components/SortableTable';
import IngressHosts from '../formatters/IngressHosts.vue';
import ServicesList from '../formatters/ServicesList.vue';
import MiddlewaresList from '../formatters/MiddlewaresList.vue';
import { get } from '@shell/utils/object';
import { random32 } from '@shell/utils/string';

export default {
  name: 'RoutesTable',

  components: {
    SortableTable,
    IngressHosts,
    ServicesList,
    MiddlewaresList
  },

  props: {
    value: {
      type: Object,
      required: true
    },
    isTcp: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    // Get workloads for service linking (following Rancher Ingress pattern)
    workloads() {
      // For now, return empty array as the targetTo method handles services directly
      // This could be extended in the future if we need to support workload targeting
      return [];
    },

    routes() {
      if (!this.value || !this.value.spec) {
        return [];
      }
      return get(this.value, 'spec.routes') || [];
    },

    routeHeaders() {
      return [
        {
          name: 'routes',
          label: this.isTcp ? this.t('traefik.headers.match') : this.t('traefik.headers.hosts'),
          value: 'routeDisplay'
        },
        {
          name: 'services',
          label: this.t('traefik.ingressRoute.routes.service.label'),
          value: 'servicesDisplay'
        },
        {
          name: 'middlewares',
          label: this.isTcp ? this.t('traefik.ingressRouteTCP.middleware.label') : this.t('traefik.ingressRoute.middleware.label'),
          value: 'middlewares'
        }
      ];
    },

    routesForTable() {
      // Ensure we always return an array, even if routes is empty or undefined
      if (!this.routes || !Array.isArray(this.routes)) {
        return [];
      }

      return this.routes.map((route, index) => {
        // Extract hosts from match for URL calculation
        const hostMatches = route.match ? route.match.match(/Host\(`([^`]+)`\)/g) : [];
        const hosts = hostMatches ? hostMatches.map(match =>
          match.match(/Host\(`([^`]+)`\)/)[1]
        ) : [];

        // Extract path from match (optional)
        const pathMatch = route.match ? route.match.match(/Path\(`([^`]*)`\)/) : null;
        const pathValue = pathMatch ? pathMatch[1] : '';

        // Create one hostRule for the entire route (not per service)
        const hostRules = [];
        if (route.match) {
          // Use the new unified URL parsing logic
          const fullPath = this.createFullPath(route.match);
          const firstHost = hosts[0] || '';

          hostRules.push({
            host: firstHost,
            path: pathValue,
            fullPath,
            displayPath: route.match, // Show the raw match rule from the CRD
            serviceName: '', // Not used for display in this context
            servicePort: '',
            serviceTargetTo: null,
            isUrl: !this.isTcp && fullPath !== null // Disable URL for TCP routes or invalid URLs
          });
        }

        // Create services data with clickable links
        const servicesData = (route.services || []).map(service => {
          const name = service.name;
          const weight = service.weight ? ` (${service.weight}%)` : '';
          const namespace = service.namespace ? `${service.namespace}/` : '';
          const kind = service.kind || 'Service';
          const kindDisplay = kind !== 'Service' ? ` (${kind})` : '';
          const display = `${namespace}${name || '-'}${kindDisplay}${weight}`;
          // Use model method for creating service links (following Rancher patterns)
          let targetLink = null;
          if (name && name !== '-' && typeof this.value.targetTo === 'function') {
            targetLink = this.value.targetTo(this.workloads, name, kind);
          }

          return {
            display,
            targetLink,
            hasValidName: !!name && name !== '-'
          };
        });

        // Format middlewares for display with clickable links
        const middlewaresData = (route.middlewares || []).map(mw => {
          const name = mw.name;
          // Only show namespace prefix if explicitly defined in the middleware object
          const namespacePrefix = mw.namespace ? `${mw.namespace}/` : '';
          const display = `${namespacePrefix}${name}`;

          // Use the middleware's namespace if defined, otherwise fall back to IngressRoute's namespace
          const middlewareNamespace = mw.namespace || this.value.metadata.namespace;

          // Use model method for creating middleware links (following Rancher patterns)
          let targetLink = null;
          if (name && name !== '-' && typeof this.value.createMiddlewareLink === 'function') {
            targetLink = this.value.createMiddlewareLink(name, middlewareNamespace);
          }

          return {
            display,
            targetLink,
            hasValidName: !!name && name !== '-'
          };
        });

        // Keep middlewares as string array for fallback
        const middlewares = middlewaresData.map(mw => mw.display);

        return {
          _key: `route-${index}-${random32()}`,
          match: route.match || '-',
          hostRules,
          routeDisplay: route.match || '-',
          servicesData,
          servicesDisplay: servicesData.map(s => s.display).join(', ') || '-',
          middlewares: middlewares.length > 0 ? middlewares : ['-'],
          middlewaresData,
          priority: route.priority || '-'
        };
      });
    }
  },

  methods: {

    createFullPath(matchRule) {
      if (!matchRule) return null;

      // For TCP routes, don't create URLs
      if (this.isTcp) return null;

      // Extraire le premier host depuis la règle match (logique identique à RoutesList)
      const hostMatch = matchRule.match(/Host\(`([^`]+)`\)/);
      if (!hostMatch) return null;

      const firstHost = hostMatch[1].split(',')[0].trim(); // Prendre le premier host si multiple

      // Extraire le path optionnel
      const pathMatch = matchRule.match(/Path(?:Prefix)?\(`([^`]*)`\)/);
      const pathValue = pathMatch ? pathMatch[1] : '';

      // Utiliser toujours HTTPS pour la sécurité (comme dans RoutesList)
      const protocol = 'https://';

      const fullUrl = `${protocol}${firstHost}${pathValue}`;

      return this.isValidUrl(fullUrl) ? fullUrl : null;
    },

    isValidUrl(url) {
      if (!url) return false;

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
.services-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.text-muted {
  color: var(--muted);
}
</style>