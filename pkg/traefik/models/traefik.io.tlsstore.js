import SteveModel from '@shell/plugins/steve/steve-class';

export default class TLSStore extends SteveModel {

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

  // Default certificate getters/setters
  get defaultCertificate() {
    return this.spec?.defaultCertificate || null;
  }

  set defaultCertificate(value) {
    this.setSpecValue('defaultCertificate', value);
  }

  get defaultCertificateSecretName() {
    return this.defaultCertificate?.secretName || '';
  }

  set defaultCertificateSecretName(value) {
    if (!value) {
      this.setSpecValue('defaultCertificate', null);
    } else {
      this.setSpecValue('defaultCertificate', { secretName: value });
    }
  }

  // Certificates management
  get certificates() {
    return this.spec?.certificates || [];
  }

  set certificates(value) {
    this.setSpecValue('certificates', value);
  }

  // Helper method to set spec values
  setSpecValue(key, value) {
    if (!this.spec) {
      this.spec = {};
    }

    if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
      delete this.spec[key];
    } else {
      this.spec[key] = value;
    }
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

    // Default certificate secret
    if (this.defaultCertificate?.secretName) {
      relationships.push({
        toType: 'secret',
        toId: `${namespace}/${this.defaultCertificate.secretName}`,
        rel: 'uses',
        selector: null,
        fromType: 'traefik.io.tlsstore',
        fromId: `${namespace}/${this.metadata.name}`,
        state: 'active'
      });
    }

    // Additional certificates
    if (this.certificates && Array.isArray(this.certificates)) {
      this.certificates.forEach(cert => {
        if (cert.secretName) {
          relationships.push({
            toType: 'secret',
            toId: `${namespace}/${cert.secretName}`,
            rel: 'uses',
            selector: null,
            fromType: 'traefik.io.tlsstore',
            fromId: `${namespace}/${this.metadata.name}`,
            state: 'active'
          });
        }
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
  get defaultCertificateSecretLink() {
    return this.defaultCertificateSecretName ? 
      this.createSecretLink(this.defaultCertificateSecretName, this.namespace) : null;
  }

  get certificateSecretLinks() {
    return this.certificates.map(cert => ({
      secretName: cert.secretName,
      link: this.createSecretLink(cert.secretName, this.namespace)
    })).filter(item => item.secretName);
  }

  get details() {
    const out = this._details;

    // Add default certificate info
    if (this.defaultCertificateSecretName) {
      out.push({
        label:   this.t('traefik.tlsStore.defaultCertificate.label'),
        content: this.defaultCertificateSecretName,
      });
    }

    // Add certificates count
    if (this.certificates.length > 0) {
      out.push({
        label:   this.t('traefik.tlsStore.certificates.label'),
        content: this.t('traefik.tlsStore.certificates.count', { count: this.certificates.length }),
      });
    }

    return out;
  }

  // Validation methods
  validateSpec() {
    const errors = [];

    // Validate that at least default certificate is configured
    if (!this.defaultCertificateSecretName && this.certificates.length === 0) {
      errors.push(this.t('traefik.tlsStore.validation.noCertificates'));
    }

    // Validate certificate secret names
    const allSecrets = [this.defaultCertificateSecretName, ...this.certificates.map(c => c.secretName)].filter(Boolean);
    const duplicates = allSecrets.filter((secret, index) => allSecrets.indexOf(secret) !== index);
    
    if (duplicates.length > 0) {
      errors.push(this.t('traefik.tlsStore.validation.duplicateCertificates', { secrets: duplicates.join(', ') }));
    }

    return errors;
  }
}