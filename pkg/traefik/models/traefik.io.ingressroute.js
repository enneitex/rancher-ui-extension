import SteveModel from '@shell/plugins/steve/steve-class';

export default class IngressRoute extends SteveModel {

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
    return this.metadata?.annotations?.['kubernetes.io/ingress.class'] || '-';
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

              const serviceType = service.kind === 'TraefikService'
                ? 'traefik.io.traefikservice'
                : 'service';

              relationships.push({
                toType: serviceType,
                toId: serviceName,
                rel: 'uses',
                selector: null,
                fromType: 'traefik.io.ingressroute',
                fromId: `${namespace}/${this.metadata.name}`,
                state: 'active'
              });
            }
          });
        }

        // Extract middlewares from routes
        if (route.middlewares && Array.isArray(route.middlewares)) {
          route.middlewares.forEach(middleware => {
            if (middleware) {
              // Middleware can be a string with format "namespace-name@provider" or just "name"
              const middlewareName = typeof middleware === 'string' ? middleware : middleware.name;

              if (middlewareName) {
                // Remove provider suffix if present (@kubernetes)
                const cleanName = middlewareName.replace(/@.*$/, '');

                // Handle cross-namespace middlewares (format: namespace-name)
                let middlewareId;
                if (cleanName.includes('-') && !cleanName.startsWith(`${namespace}-`)) {
                  // Likely a cross-namespace reference
                  const parts = cleanName.split('-');
                  if (parts.length >= 2) {
                    const possibleNamespace = parts[0];
                    const possibleName = parts.slice(1).join('-');
                    middlewareId = `${possibleNamespace}/${possibleName}`;
                  } else {
                    middlewareId = `${namespace}/${cleanName}`;
                  }
                } else {
                  // Same namespace reference
                  const name = cleanName.startsWith(`${namespace}-`)
                    ? cleanName.substring(namespace.length + 1)
                    : cleanName;
                  middlewareId = `${namespace}/${name}`;
                }

                relationships.push({
                  toType: 'traefik.io.middleware',
                  toId: middlewareId,
                  rel: 'uses',
                  selector: null,
                  fromType: 'traefik.io.ingressroute',
                  fromId: `${namespace}/${this.metadata.name}`,
                  state: 'active'
                });
              }
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
          fromType: 'traefik.io.ingressroute',
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
          fromType: 'traefik.io.ingressroute',
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
          fromType: 'traefik.io.ingressroute',
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
          fromType: 'traefik.io.ingressroute',
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
}