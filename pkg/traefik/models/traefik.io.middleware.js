import SteveModel from '@shell/plugins/steve/steve-class';

export default class Middleware extends SteveModel {

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

  // Extract middleware types from spec
  get middlewareTypes() {
    if (!this.spec) {
      return [];
    }

    return Object.keys(this.spec);
  }

  get primaryMiddlewareType() {
    return this.middlewareTypes.length > 0 ? this.middlewareTypes[0] : null;
  }

  get hasMultipleTypes() {
    return this.middlewareTypes.length > 1;
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

  // Get the configuration for a specific middleware type
  getMiddlewareConfig(type) {
    return this.spec?.[type] || null;
  }

  // Helper method to check if a specific middleware type is configured
  hasMiddlewareType(type) {
    return this.middlewareTypes.includes(type);
  }

  _generateRelationships() {
    const relationships = [];
    const namespace = this.metadata?.namespace;

    if (!namespace || !this.spec) {
      return relationships;
    }

    // Extract secrets from basicAuth
    if (this.spec.basicAuth && this.spec.basicAuth.secret) {
      relationships.push({
        toType: 'secret',
        toId: `${namespace}/${this.spec.basicAuth.secret}`,
        rel: 'uses',
        selector: null,
        fromType: 'traefik.io.middleware',
        fromId: `${namespace}/${this.metadata.name}`,
        state: 'active'
      });
    }

    // Extract secrets from digestAuth
    if (this.spec.digestAuth && this.spec.digestAuth.secret) {
      relationships.push({
        toType: 'secret',
        toId: `${namespace}/${this.spec.digestAuth.secret}`,
        rel: 'uses',
        selector: null,
        fromType: 'traefik.io.middleware',
        fromId: `${namespace}/${this.metadata.name}`,
        state: 'active'
      });
    }

    // Extract secrets from rateLimit.redis
    if (this.spec.rateLimit && this.spec.rateLimit.redis && this.spec.rateLimit.redis.secret) {
      relationships.push({
        toType: 'secret',
        toId: `${namespace}/${this.spec.rateLimit.redis.secret}`,
        rel: 'uses',
        selector: null,
        fromType: 'traefik.io.middleware',
        fromId: `${namespace}/${this.metadata.name}`,
        state: 'active'
      });
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

  // Rancher-standard methods
  createSecretLink(secretName, namespace) {
    if (!secretName) {
      return null;
    }

    const targetNamespace = namespace || this.namespace;

    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource:  'secret',
        id:        secretName,
        namespace: targetNamespace,
      }
    };
  }

  // Helper getters for secret links
  get basicAuthSecretLink() {
    const secretName = this.spec?.basicAuth?.secret;
    return secretName ? this.createSecretLink(secretName, this.namespace) : null;
  }

  get digestAuthSecretLink() {
    const secretName = this.spec?.digestAuth?.secret;
    return secretName ? this.createSecretLink(secretName, this.namespace) : null;
  }

  get rateLimitRedisSecretLink() {
    const secretName = this.spec?.rateLimit?.redis?.secret;
    return secretName ? this.createSecretLink(secretName, this.namespace) : null;
  }

  get details() {
    const out = this._details;

    // Add middleware type info
    if (this.primaryMiddlewareType) {
      out.push({
        label:   this.t('traefik.middleware.type.label'),
        content: this.primaryMiddlewareType,
      });
    }

    // Add warning for multiple types
    if (this.hasMultipleTypes) {
      out.push({
        label:   this.t('traefik.middleware.multipleTypes.label'),
        content: this.middlewareTypes.join(', '),
      });
    }

    return out;
  }
}