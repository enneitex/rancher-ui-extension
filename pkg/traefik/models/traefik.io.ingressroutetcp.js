import { SERVICE } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class IngressRouteTCP extends SteveModel {

  constructor(data, ctx, rehydrateNamespace = null, setClone = false) {
    super(data, ctx, rehydrateNamespace, setClone);

    // Ensure metadata.relationships is always initialized
    if (this.metadata) {
      if (!this.metadata.relationships) {
        this.metadata.relationships = [];
      }

      // Generate relationships after construction
      if (this.spec) {
        const relationships = this._generateRelationships();
        if (relationships.length > 0) {
          this.metadata.relationships = relationships;
        }
      }
    }
  }

  get ingressClass() {
    return this.metadata?.annotations?.['kubernetes.io/ingress.class'] || '';
  }

  // Reactive getter for relationships - regenerates if empty
  get relationships() {
    if (!this.metadata) {
      return [];
    }

    if (!this.metadata.relationships || this.metadata.relationships.length === 0) {
      this.metadata.relationships = this._generateRelationships();
    }

    return this.metadata.relationships;
  }

  // Public method to force refresh relationships
  refreshRelationships() {
    if (!this.metadata) {
      return [];
    }

    this.metadata.relationships = this._generateRelationships();
    return this.metadata.relationships;
  }

  _generateRelationships() {
    const relationships = [];
    const namespace = this.metadata?.namespace;

    if (!namespace || !this.spec) {
      return relationships;
    }

    // Extract services from routes
    if (this.spec.routes && Array.isArray(this.spec.routes)) {
      this.spec.routes.forEach(route => {
        if (route.services && Array.isArray(route.services)) {
          route.services.forEach(service => {
            if (service.name) {
              // Handle cross-namespace services
              const serviceName = service.namespace
                ? `${service.namespace}/${service.name}`
                : `${namespace}/${service.name}`;

              relationships.push({
                toType: 'service',
                toId: serviceName,
                rel: 'uses',
                selector: null,
                fromType: 'traefik.io.ingressroutetcp',
                fromId: `${namespace}/${this.metadata.name}`,
                state: 'active'
              });
            }
          });
        }

        // Extract TCP middlewares
        if (route.middlewares && Array.isArray(route.middlewares)) {
          route.middlewares.forEach(middleware => {
            if (middleware.name) {
              // Handle cross-namespace middlewares
              const middlewareNamespace = middleware.namespace || namespace;
              relationships.push({
                toType: 'traefik.io.middlewaretcp',
                toId: `${middlewareNamespace}/${middleware.name}`,
                rel: 'uses',
                selector: null,
                fromType: 'traefik.io.ingressroutetcp',
                fromId: `${namespace}/${this.metadata.name}`,
                state: 'active'
              });
            }
          });
        }
      });
    }

    // Extract TLS configuration
    if (this.spec.tls) {
      // TLS Secret
      if (this.spec.tls.secretName) {
        relationships.push({
          toType: 'secret',
          toId: `${namespace}/${this.spec.tls.secretName}`,
          rel: 'uses',
          selector: null,
          fromType: 'traefik.io.ingressroutetcp',
          fromId: `${namespace}/${this.metadata.name}`,
          state: 'active'
        });
      }

      // TLSOption
      if (this.spec.tls.options && this.spec.tls.options.name) {
        const tlsOptionNamespace = this.spec.tls.options.namespace || namespace;
        relationships.push({
          toType: 'traefik.io.tlsoption',
          toId: `${tlsOptionNamespace}/${this.spec.tls.options.name}`,
          rel: 'uses',
          selector: null,
          fromType: 'traefik.io.ingressroutetcp',
          fromId: `${namespace}/${this.metadata.name}`,
          state: 'active'
        });
      }

      // TLSStore
      if (this.spec.tls.store && this.spec.tls.store.name) {
        const tlsStoreNamespace = this.spec.tls.store.namespace || namespace;
        relationships.push({
          toType: 'traefik.io.tlsstore',
          toId: `${tlsStoreNamespace}/${this.spec.tls.store.name}`,
          rel: 'uses',
          selector: null,
          fromType: 'traefik.io.ingressroutetcp',
          fromId: `${namespace}/${this.metadata.name}`,
          state: 'active'
        });
      }

      // Certificate Resolvers (Let's Encrypt, etc)
      if (this.spec.tls.certResolver) {
        relationships.push({
          toType: 'traefik.io.certresolver',
          toId: this.spec.tls.certResolver,
          rel: 'uses',
          selector: null,
          fromType: 'traefik.io.ingressroutetcp',
          fromId: `${namespace}/${this.metadata.name}`,
          state: 'active'
        });
      }
    }

    // Remove duplicates based on toType and toId
    const uniqueRelationships = [];
    const seen = new Set();

    relationships.forEach(rel => {
      const key = `${rel.toType}:${rel.toId}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRelationships.push(rel);
      }
    });

    return uniqueRelationships;
  }

  // Get formatted entry points for display (one per line for list view)
  get formattedEntryPoints() {
    return (this.spec?.entryPoints || []);
  }

  // Get services summary for list view
  get targetServices() {
    const services = [];

    if (this.spec?.routes && Array.isArray(this.spec.routes)) {
      this.spec.routes.forEach(route => {
        if (route.services && Array.isArray(route.services)) {
          route.services.forEach(service => {
            if (service.name) {
              services.push({
                name: service.name,
                port: service.port,
                namespace: service.namespace || this.metadata?.namespace,
                weight: service.weight
              });
            }
          });
        }
      });
    }

    return services;
  }

  // Check if TLS passthrough is enabled
  get isTLSPassthrough() {
    return this.spec?.tls?.passthrough === true;
  }

  // Get routes for list view (compatibility with RoutesList formatter)
  get targetRoutes() {
    return this.spec?.routes || [];
  }

  // Rancher-standard methods for linking (similar to IngressRoute)
  targetTo(workloads, serviceName) {
    if (!serviceName) {
      return null;
    }

    const id = `${ this.namespace }/${ serviceName }`;
    // Standard service link using Rancher route pattern (matching original Ingress model)
    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource:  SERVICE,
        product:   'explorer',
        id:        serviceName,
        namespace: this.namespace,
      }
    };
  }

  createMiddlewareLink(middlewareName, namespace) {
    if (!middlewareName) {
      return null;
    }

    const targetNamespace = namespace || this.namespace;

    // For TCP routes, middlewares are of type traefik.io.middlewaretcp
    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource:  'traefik.io.middlewaretcp',
        product:   'traefik',
        id:        middlewareName,
        namespace: targetNamespace,
      }
    };
  }

  createTLSLink(resourceType, resourceName, namespace) {
    if (!resourceName) {
      return null;
    }

    const targetNamespace = namespace || this.namespace;

    // Determine the correct product based on API group
    // Resources from traefik.io API group belong to Traefik product, others to explorer
    const product = resourceType.startsWith('traefik.io.') ? 'traefik' : 'explorer';

    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource:  resourceType,
        product:   product,
        id:        resourceName,
        namespace: targetNamespace,
      }
    };
  }

  // Helper getters for TLS resources following Rancher patterns
  get tlsSecretLink() {
    const secretName = this.spec?.tls?.secretName;
    return secretName ? this.createTLSLink('secret', secretName, this.namespace) : null;
  }

  get tlsOptionsLink() {
    const optionsName = this.spec?.tls?.options?.name;
    const optionsNamespace = this.spec?.tls?.options?.namespace || this.namespace;
    return optionsName ? this.createTLSLink('traefik.io.tlsoption', optionsName, optionsNamespace) : null;
  }

  get tlsStoreLink() {
    const storeName = this.spec?.tls?.store?.name;
    const storeNamespace = this.spec?.tls?.store?.namespace || this.namespace;
    return storeName ? this.createTLSLink('traefik.io.tlsstore', storeName, storeNamespace) : null;
  }
}