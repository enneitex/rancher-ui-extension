<script lang="ts">
import ResourceTable from '@shell/components/ResourceTable';
import { STATE, NAME, NAMESPACE, AGE } from '@shell/config/table-headers';
import IngressHosts from '../formatters/IngressHosts.vue';
import RoutesList from '../formatters/RoutesList.vue';

export default {
  name:       'IngressRouteList',
  components: { ResourceTable, IngressHosts, RoutesList },
  
  props: {
    resource: {
      type:     String,
      required: true,
    },
    schema: {
      type:     Object,
      required: true,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    headers() {
      return [
        STATE,
        NAME,
        NAMESPACE,
        {
          name:     'routes',
          labelKey: 'traefik.headers.routes',
          value:    'targetRoutes',
          sort:     false,
        },
        {
          name:     'ingressClass',
          labelKey: 'traefik.ingressRoute.ingressClass.label',
          value:    'ingressClass',
          sort:     'metadata.annotations["kubernetes.io/ingress.class"]',
        },
        {
          name:     'entryPoints',
          labelKey: 'traefik.headers.entryPoints',
          value:    'spec.entryPoints',
          sort:     'spec.entryPoints',
          formatter: 'List',
        },
        AGE
      ];
    },

    rows() {
      const resources = this.$store.getters['cluster/all'](this.resource) || [];
      
      return resources.map(resource => {
        // Extract hosts and services directly
        const hostsList = this.extractHosts(resource);
        const ingressClass = this.getIngressClass(resource);
        
        // Add computed properties directly to the resource object
        resource.hostsList = hostsList;
        resource.ingressClass = ingressClass;
        
        return resource;
      });
    }
  },

  methods: {
    extractHosts(resource) {
      const hosts = new Set();
      
      if (resource.spec?.routes) {
        resource.spec.routes.forEach(route => {
          if (route.match) {
            // Extract Host rules from match expressions like "Host(`example.com`)"
            const hostMatches = route.match.match(/Host\(`([^`]+)`\)/g);
            if (hostMatches) {
              hostMatches.forEach(match => {
                const host = match.match(/Host\(`([^`]+)`\)/)[1];
                hosts.add(host);
              });
            }
          }
        });
      }
      
      return Array.from(hosts);
    },

    getIngressClass(resource) {
      // Récupère l'ingress class depuis l'annotation
      return resource.metadata?.annotations?.['kubernetes.io/ingress.class'] || '-';
    },

    createtargetRoutes(resource) {
      const rules = [];
      
      if (resource.spec?.routes) {
        resource.spec.routes.forEach(route => {
          if (route.match && route.services) {
            // Extract hosts from match
            const hostMatches = route.match.match(/Host\(`([^`]+)`\)/g);
            const hosts = hostMatches ? hostMatches.map(match => 
              match.match(/Host\(`([^`]+)`\)/)[1]
            ) : [];

            // Extract path from match (optional)
            const pathMatch = route.match.match(/Path\(`([^`]*)`\)/);
            const pathValue = pathMatch ? pathMatch[1] : '';

            hosts.forEach(host => {
              route.services.forEach(service => {
                const fullPath = this.createFullPath(host, pathValue, resource);
                // Utilise le namespace du service s'il est défini, sinon celui de l'IngressRoute
                const serviceNamespace = service.namespace || resource.namespace;
                
                rules.push({
                  host,
                  path: pathValue,
                  fullPath,
                  displayPath: fullPath || host || pathValue,
                  serviceName: service.name,
                  servicePort: service.port,
                  serviceTargetTo: this.createServiceLink(service.name, serviceNamespace),
                  isUrl: this.isValidUrl(fullPath)
                });
              });
            });
          }
        });
      }
      
      return rules;
    },

    createFullPath(host, path, resource) {
      if (!host) return path;
      
      // Détermine le protocole (assume HTTPS si TLS est configuré)
      const hasEntryPointWebsecure = resource.spec?.entryPoints?.includes('websecure');
      const protocol = hasEntryPointWebsecure ? 'https://' : 'http://';
      
      return `${protocol}${host}${path}`;
    },

    createServiceLink(serviceName, namespace) {
      if (!serviceName || !namespace) return null;
      
      const cluster = this.$route.params.cluster;
      if (!cluster) return null;
      
      // Create direct path instead of using router-link params
      return `/c/${cluster}/explorer/service/${namespace}/${serviceName}`;
    },

    isValidUrl(url) {
      try {
        return url && !url.includes('*') && (url.startsWith('http://') || url.startsWith('https://'));
      } catch {
        return false;
      }
    }
  }
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="rows"
    :headers="headers"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
  >
    <!-- Custom cell for routes using formatter -->
    <template #cell:routes="{row}">
      <RoutesList :row="row" />
    </template>
  </ResourceTable>
</template>

<style scoped>
/* Styles handled by the IngressHosts formatter component */
</style>