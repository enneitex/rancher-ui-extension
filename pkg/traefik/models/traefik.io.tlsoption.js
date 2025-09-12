import SteveModel from '@shell/plugins/steve/steve-class';

export default class TLSOption extends SteveModel {

  // TLS Version validation
  get tlsVersions() {
    return [
      { value: 'VersionTLS10', label: 'TLS 1.0' },
      { value: 'VersionTLS11', label: 'TLS 1.1' },
      { value: 'VersionTLS12', label: 'TLS 1.2' },
      { value: 'VersionTLS13', label: 'TLS 1.3' },
    ];
  }

  get minTlsVersion() {
    return this.spec?.minVersion || '';
  }

  set minTlsVersion(value) {
    this.setSpecValue('minVersion', value);
  }

  get maxTlsVersion() {
    return this.spec?.maxVersion || '';
  }

  set maxTlsVersion(value) {
    this.setSpecValue('maxVersion', value);
  }

  // Client Auth Types
  get clientAuthTypes() {
    return [
      {
        value: 'NoClientCert',
        label: 'No Client Certificate',
        description: 'No client certificate required'
      },
      {
        value: 'RequestClientCert',
        label: 'Request Client Certificate',
        description: 'Client certificate is requested but not required'
      },
      {
        value: 'RequireAnyClientCert',
        label: 'Require Any Client Certificate',
        description: 'Client certificate is required but not validated'
      },
      {
        value: 'VerifyClientCertIfGiven',
        label: 'Verify Client Certificate If Given',
        description: 'Client certificate is verified if provided'
      },
      {
        value: 'RequireAndVerifyClientCert',
        label: 'Require and Verify Client Certificate',
        description: 'Client certificate is required and validated'
      }
    ];
  }

  get clientAuthType() {
    return this.spec?.clientAuth?.clientAuthType || 'NoClientCert';
  }

  set clientAuthType(value) {
    this.setClientAuthValue('clientAuthType', value);
  }

  get clientAuthSecrets() {
    return this.spec?.clientAuth?.secretNames || [];
  }

  set clientAuthSecrets(value) {
    this.setClientAuthValue('secretNames', value);
  }

  // ALPN Protocols
  get alpnProtocolOptions() {
    return [
      { value: 'http/1.1', label: 'HTTP/1.1' },
      { value: 'h2', label: 'HTTP/2' },
      { value: 'h3', label: 'HTTP/3' }
    ];
  }

  get alpnProtocols() {
    return this.spec?.alpnProtocols || [];
  }

  set alpnProtocols(value) {
    this.setSpecValue('alpnProtocols', value);
  }

  // Cipher Suites
  get cipherSuites() {
    return this.spec?.cipherSuites || [];
  }

  set cipherSuites(value) {
    this.setSpecValue('cipherSuites', value);
  }

  // Curve Preferences
  get curvePreferenceOptions() {
    return [
      { value: 'CurveP256', label: 'P-256' },
      { value: 'CurveP384', label: 'P-384' },
      { value: 'CurveP521', label: 'P-521' },
      { value: 'X25519', label: 'X25519' }
    ];
  }

  get curvePreferences() {
    return this.spec?.curvePreferences || [];
  }

  set curvePreferences(value) {
    this.setSpecValue('curvePreferences', value);
  }

  // Advanced options
  get sniStrict() {
    return this.spec?.sniStrict !== undefined ? this.spec.sniStrict : false;
  }

  set sniStrict(value) {
    this.setSpecValue('sniStrict', value);
  }

  get disableSessionTickets() {
    return this.spec?.disableSessionTickets !== undefined ? this.spec.disableSessionTickets : false;
  }

  set disableSessionTickets(value) {
    this.setSpecValue('disableSessionTickets', value);
  }

  // Helper methods
  setSpecValue(key, value) {
    if (!this.spec) {
      this.spec = {};
    }

    if (value === '' || value === null || value === undefined) {
      delete this.spec[key];
    } else {
      this.spec[key] = value;
    }
  }

  setClientAuthValue(key, value) {
    if (!this.spec) {
      this.spec = {};
    }

    if (!this.spec.clientAuth) {
      this.spec.clientAuth = {};
    }

    if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
      delete this.spec.clientAuth[key];

      // Clean up empty clientAuth object
      if (Object.keys(this.spec.clientAuth).length === 0) {
        delete this.spec.clientAuth;
      }
    } else {
      this.spec.clientAuth[key] = value;
    }
  }

  // Validation methods
  validateTlsVersions() {
    const errors = [];
    const minVersion = this.minTlsVersion;
    const maxVersion = this.maxTlsVersion;

    if (minVersion && maxVersion) {
      const versions = ['VersionTLS10', 'VersionTLS11', 'VersionTLS12', 'VersionTLS13'];
      const minIndex = versions.indexOf(minVersion);
      const maxIndex = versions.indexOf(maxVersion);

      if (minIndex > maxIndex) {
        errors.push('Minimum TLS version cannot be higher than maximum TLS version');
      }
    }

    return errors;
  }

  validateClientAuth() {
    const errors = [];
    const authType = this.clientAuthType;
    const secrets = this.clientAuthSecrets;

    // If client auth requires certificates, ensure secrets are provided
    if (['RequireAnyClientCert', 'VerifyClientCertIfGiven', 'RequireAndVerifyClientCert'].includes(authType)) {
      if (!secrets || secrets.length === 0) {
        errors.push('Client authentication type requires at least one secret');
      }
    }

    return errors;
  }

  validateSpec() {
    const errors = [];

    errors.push(...this.validateTlsVersions());
    errors.push(...this.validateClientAuth());

    return errors;
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
        product:   'explorer',
        id:        secretName,
        namespace: targetNamespace,
      }
    };
  }

  // Helper getters for client auth secret links
  get clientAuthSecretLinks() {
    return this.clientAuthSecrets.map(secretName => ({
      secretName,
      link: this.createSecretLink(secretName, this.namespace)
    }));
  }
}