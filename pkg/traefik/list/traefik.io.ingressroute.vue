<script lang="ts">
import ResourceTable from '@shell/components/ResourceTable';
import { STATE, NAME, AGE } from '@shell/config/table-headers';

export default {
  name:       'IngressRouteList',
  components: { ResourceTable },
  
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
        {
          name:     'entryPoints',
          labelKey: 'traefik.headers.entryPoints',
          value:    'spec.entryPoints',
          sort:     'spec.entryPoints',
          formatter: 'List'
        },
        {
          name:     'hosts',
          labelKey: 'traefik.headers.hosts',
          value:    'hostsList',
          sort:     false,
          width:    200
        },
        {
          name:     'services',
          labelKey: 'traefik.headers.services', 
          value:    'servicesList',
          sort:     false,
          width:    200
        },
        AGE
      ];
    },

    rows() {
      const resources = this.$store.getters['cluster/all'](this.resource) || [];
      
      return resources.map(resource => {
        // Extract hosts and services directly
        const hostsList = this.extractHosts(resource);
        const servicesList = this.extractServices(resource);
        const targetRules = this.createTargetRules(resource);
        
        // Add computed properties directly to the resource object
        resource.hostsList = hostsList;
        resource.servicesList = servicesList;
        resource.targetRules = targetRules;
        
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

    extractServices(resource) {
      const services = new Set();
      
      if (resource.spec?.routes) {
        resource.spec.routes.forEach(route => {
          if (route.services) {
            route.services.forEach(service => {
              if (service.name) {
                const serviceInfo = service.port 
                  ? `${service.name}:${service.port}`
                  : service.name;
                services.add(serviceInfo);
              }
            });
          }
        });
      }
      
      return Array.from(services);
    },

    createTargetRules(resource) {
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
                
                rules.push({
                  host,
                  path: pathValue,
                  fullPath,
                  serviceName: service.name,
                  servicePort: service.port,
                  serviceTargetTo: this.createServiceLink(service.name, resource.namespace),
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
      if (!serviceName) return null;
      
      return {
        name: 'c-cluster-product-resource-namespace-id',
        params: {
          product: 'explorer',
          cluster: this.$route.params.cluster,
          resource: 'service',
          namespace: namespace,
          id: serviceName
        }
      };
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
    <!-- Custom cell for hosts (Target-like with clickable links) -->
    <template #cell:hosts="{row}">
      <div v-if="row.targetRules && row.targetRules.length" class="target-rules">
        <div v-for="rule in row.targetRules" :key="`${rule.host}-${rule.path}-${rule.serviceName}`" class="target-rule">
          <!-- URL link (external) -->
          <div v-if="rule.isUrl" class="target-url">
            <a :href="rule.fullPath" target="_blank" rel="noopener noreferrer" class="url-link">
              {{ rule.fullPath }}
              <i class="icon icon-external-link"></i>
            </a>
          </div>
          <div v-else class="target-url-text">
            {{ rule.fullPath || rule.host }}
          </div>
          
          <!-- Service link (internal to Rancher) -->
          <div v-if="rule.serviceName" class="target-service">
            →
            <n-link v-if="rule.serviceTargetTo" :to="rule.serviceTargetTo" class="service-link">
              {{ rule.serviceName }}{{ rule.servicePort ? ':' + rule.servicePort : '' }}
            </n-link>
            <span v-else class="service-text">
              {{ rule.serviceName }}{{ rule.servicePort ? ':' + rule.servicePort : '' }}
            </span>
          </div>
        </div>
      </div>
      <span v-else class="text-muted">-</span>
    </template>

    <!-- Custom cell for services -->
    <template #cell:services="{row}">
      <div v-if="row.servicesList && row.servicesList.length">
        <div v-for="service in row.servicesList" :key="service" class="text-small">
          {{ service }}
        </div>
      </div>
      <span v-else class="text-muted">-</span>
    </template>

    <!-- Custom cell for entry points -->
    <template #cell:entryPoints="{row}">
      <div v-if="row.spec && row.spec.entryPoints && row.spec.entryPoints.length">
        <div v-for="entryPoint in row.spec.entryPoints" :key="entryPoint" class="text-small">
          {{ entryPoint }}
        </div>
      </div>
      <span v-else class="text-muted">-</span>
    </template>
  </ResourceTable>
</template>

<style scoped>
.text-small {
  font-size: 0.9em;
  line-height: 1.2;
}

.text-muted {
  color: #999;
  font-style: italic;
}

/* Target rules styling (like Ingress Target column) */
.target-rules {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.target-rule {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9em;
  line-height: 1.2;
}

.target-url {
  display: flex;
  align-items: center;
  gap: 4px;
}

.url-link {
  color: #007bc4;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 2px;
}

.url-link:hover {
  text-decoration: underline;
}

.target-url-text {
  color: #333;
}

.target-service {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}

.service-link {
  color: #007bc4;
  text-decoration: none;
}

.service-link:hover {
  text-decoration: underline;
}

.service-text {
  color: #666;
}

.icon-external-link {
  font-size: 0.8em;
  opacity: 0.7;
}
</style>