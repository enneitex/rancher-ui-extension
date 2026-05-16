jest.mock('@shell/plugins/steve/steve-class', () => {
  class SteveModel {
    constructor(data: any, ctx = {}) {
      Object.assign(this, data);
    }

    get namespace() {
      return (this as any).metadata?.namespace;
    }
  }

  return { __esModule: true, default: SteveModel };
});

import TLSOption from '../traefik.io.tlsoption';

const make = (data: any) => new TLSOption(data);

const BASE_META = { name: 'my-opt', namespace: 'default' };

describe('class TLSOption', () => {
  // -------------------------------------------------------------------------
  // method: _generateRelationships
  // -------------------------------------------------------------------------

  describe('method _generateRelationships', () => {
    it('creates a secret relationship for each name in clientAuth.secretNames', () => {
      const opt = make({
        metadata: BASE_META,
        spec:     { clientAuth: { secretNames: ['ca-secret-1', 'ca-secret-2'] } },
      });

      const rels = opt._generateRelationships();

      expect(rels).toHaveLength(2);
      expect(rels[0]).toStrictEqual(expect.objectContaining({
        toType: 'secret',
        toId:   'default/ca-secret-1',
        rel:    'uses',
      }));
      expect(rels[1]).toStrictEqual(expect.objectContaining({
        toType: 'secret',
        toId:   'default/ca-secret-2',
      }));
    });

    it('sets fromType to traefik.io.tlsoption', () => {
      const opt = make({
        metadata: BASE_META,
        spec:     { clientAuth: { secretNames: ['my-ca'] } },
      });

      expect(opt._generateRelationships()[0].fromType).toStrictEqual('traefik.io.tlsoption');
    });

    it('deduplicates when the same secret is listed twice', () => {
      const opt = make({
        metadata: BASE_META,
        spec:     { clientAuth: { secretNames: ['shared-ca', 'shared-ca'] } },
      });

      expect(opt._generateRelationships()).toHaveLength(1);
    });

    it('returns empty array when clientAuth.secretNames is empty', () => {
      const opt = make({ metadata: BASE_META, spec: { clientAuth: { secretNames: [] } } });

      expect(opt._generateRelationships()).toStrictEqual([]);
    });

    it('returns empty array when clientAuth is absent', () => {
      const opt = make({ metadata: BASE_META, spec: {} });

      expect(opt._generateRelationships()).toStrictEqual([]);
    });

    it('returns empty array when namespace is absent', () => {
      const opt = make({ metadata: { name: 'opt' }, spec: { clientAuth: { secretNames: ['ca'] } } });

      expect(opt._generateRelationships()).toStrictEqual([]);
    });

    it('skips null/empty secret names without throwing', () => {
      const opt = make({
        metadata: BASE_META,
        spec:     { clientAuth: { secretNames: ['', 'valid-ca'] } },
      });

      // Empty string is falsy so it must be filtered out
      const rels = opt._generateRelationships();

      expect(rels).toHaveLength(1);
      expect(rels[0].toId).toStrictEqual('default/valid-ca');
    });
  });

  // -------------------------------------------------------------------------
  // method: setSpecValue
  // -------------------------------------------------------------------------

  describe('method setSpecValue', () => {
    it('sets a key on spec', () => {
      const opt = make({ metadata: BASE_META, spec: {} });

      opt.setSpecValue('sniStrict', true);

      expect(opt.spec.sniStrict).toStrictEqual(true);
    });

    it.each([
      { desc: 'deletes the key when value is empty string', value: '' },
      { desc: 'deletes the key when value is null', value: null },
      { desc: 'deletes the key when value is undefined', value: undefined },
    ])('$desc', ({ value }) => {
      const opt = make({ metadata: BASE_META, spec: { sniStrict: true } });

      opt.setSpecValue('sniStrict', value);

      expect(opt.spec).not.toHaveProperty('sniStrict');
    });

    it('initializes spec as empty object when spec is absent', () => {
      const opt = make({ metadata: BASE_META });
      opt.spec = undefined;

      opt.setSpecValue('sniStrict', true);

      expect(opt.spec.sniStrict).toStrictEqual(true);
    });
  });

  // -------------------------------------------------------------------------
  // method: setClientAuthValue
  // -------------------------------------------------------------------------

  describe('method setClientAuthValue', () => {
    it('sets a key inside spec.clientAuth', () => {
      const opt = make({ metadata: BASE_META, spec: { clientAuth: {} } });

      opt.setClientAuthValue('clientAuthType', 'RequireAndVerifyClientCert');

      expect(opt.spec.clientAuth.clientAuthType).toStrictEqual('RequireAndVerifyClientCert');
    });

    it('initializes spec and clientAuth when both are absent', () => {
      const opt = make({ metadata: BASE_META });
      opt.spec = undefined;

      opt.setClientAuthValue('clientAuthType', 'NoClientCert');

      expect(opt.spec.clientAuth.clientAuthType).toStrictEqual('NoClientCert');
    });

    it.each([
      { desc: 'deletes key when value is empty string', value: '' },
      { desc: 'deletes key when value is null', value: null },
      { desc: 'deletes key when value is undefined', value: undefined },
      { desc: 'deletes key when value is empty array', value: [] },
    ])('$desc', ({ value }) => {
      // Keep a second key so clientAuth is not cleaned up during this assertion
      const opt = make({ metadata: BASE_META, spec: { clientAuth: { clientAuthType: 'NoClientCert', secretNames: ['ca'] } } });

      opt.setClientAuthValue('clientAuthType', value);

      expect(opt.spec.clientAuth).not.toHaveProperty('clientAuthType');
    });

    it('removes clientAuth entirely when it becomes empty after deletion', () => {
      const opt = make({ metadata: BASE_META, spec: { clientAuth: { clientAuthType: 'NoClientCert' } } });

      opt.setClientAuthValue('clientAuthType', '');

      expect(opt.spec).not.toHaveProperty('clientAuth');
    });

    it('does not remove clientAuth when other keys remain after deletion', () => {
      const opt = make({
        metadata: BASE_META,
        spec:     { clientAuth: { clientAuthType: 'NoClientCert', secretNames: ['ca'] } },
      });

      opt.setClientAuthValue('clientAuthType', '');

      expect(opt.spec.clientAuth).toHaveProperty('secretNames');
    });
  });

  // -------------------------------------------------------------------------
  // method: validateTlsVersions
  // -------------------------------------------------------------------------

  describe('method validateTlsVersions', () => {
    it.each([
      {
        desc:        'returns no errors when both versions are valid and min < max',
        minVersion:  'VersionTLS12',
        maxVersion:  'VersionTLS13',
        expectError: false,
      },
      {
        desc:        'returns no errors when min === max',
        minVersion:  'VersionTLS12',
        maxVersion:  'VersionTLS12',
        expectError: false,
      },
      {
        desc:        'returns no errors when only minVersion is set',
        minVersion:  'VersionTLS12',
        maxVersion:  '',
        expectError: false,
      },
      {
        desc:        'returns no errors when only maxVersion is set',
        minVersion:  '',
        maxVersion:  'VersionTLS13',
        expectError: false,
      },
      {
        desc:        'returns no errors when neither version is set',
        minVersion:  '',
        maxVersion:  '',
        expectError: false,
      },
      {
        desc:        'returns an error when minVersion is higher than maxVersion',
        minVersion:  'VersionTLS13',
        maxVersion:  'VersionTLS12',
        expectError: true,
      },
      {
        desc:        'returns an error for TLS 1.1 min with TLS 1.0 max',
        minVersion:  'VersionTLS11',
        maxVersion:  'VersionTLS10',
        expectError: true,
      },
    ])('$desc', ({ minVersion, maxVersion, expectError }) => {
      const opt = make({ metadata: BASE_META, spec: { minVersion, maxVersion } });

      const errors = opt.validateTlsVersions();

      if (expectError) {
        expect(errors.length).toBeGreaterThan(0);
      } else {
        expect(errors).toStrictEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // method: validateClientAuth
  // -------------------------------------------------------------------------

  describe('method validateClientAuth', () => {
    it.each([
      {
        desc:        'NoClientCert with no secrets — no error',
        authType:    'NoClientCert',
        secrets:     [],
        expectError: false,
      },
      {
        desc:        'RequestClientCert with no secrets — no error',
        authType:    'RequestClientCert',
        secrets:     [],
        expectError: false,
      },
      {
        desc:        'RequireAnyClientCert with no secrets — error',
        authType:    'RequireAnyClientCert',
        secrets:     [],
        expectError: true,
      },
      {
        desc:        'VerifyClientCertIfGiven with no secrets — error',
        authType:    'VerifyClientCertIfGiven',
        secrets:     [],
        expectError: true,
      },
      {
        desc:        'RequireAndVerifyClientCert with no secrets — error',
        authType:    'RequireAndVerifyClientCert',
        secrets:     [],
        expectError: true,
      },
      {
        desc:        'RequireAndVerifyClientCert with secrets — no error',
        authType:    'RequireAndVerifyClientCert',
        secrets:     ['my-ca'],
        expectError: false,
      },
    ])('$desc', ({ authType, secrets, expectError }) => {
      const opt = make({
        metadata: BASE_META,
        spec:     { clientAuth: { clientAuthType: authType, secretNames: secrets } },
      });

      const errors = opt.validateClientAuth();

      if (expectError) {
        expect(errors.length).toBeGreaterThan(0);
      } else {
        expect(errors).toStrictEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // method: validateSpec
  // -------------------------------------------------------------------------

  describe('method validateSpec', () => {
    it('returns empty array when both TLS versions and clientAuth are valid', () => {
      const opt = make({
        metadata: BASE_META,
        spec:     {
          minVersion:  'VersionTLS12',
          maxVersion:  'VersionTLS13',
          clientAuth:  { clientAuthType: 'NoClientCert', secretNames: [] },
        },
      });

      expect(opt.validateSpec()).toStrictEqual([]);
    });

    it('includes errors from validateTlsVersions when min > max', () => {
      const opt = make({
        metadata: BASE_META,
        spec:     { minVersion: 'VersionTLS13', maxVersion: 'VersionTLS12' },
      });

      expect(opt.validateSpec().length).toBeGreaterThan(0);
    });

    it('includes errors from validateClientAuth when secrets are missing', () => {
      const opt = make({
        metadata: BASE_META,
        spec:     { clientAuth: { clientAuthType: 'RequireAndVerifyClientCert', secretNames: [] } },
      });

      expect(opt.validateSpec().length).toBeGreaterThan(0);
    });

    it('accumulates errors from both validations', () => {
      const opt = make({
        metadata: BASE_META,
        spec:     {
          minVersion:  'VersionTLS13',
          maxVersion:  'VersionTLS12',
          clientAuth:  { clientAuthType: 'RequireAndVerifyClientCert', secretNames: [] },
        },
      });

      expect(opt.validateSpec().length).toBeGreaterThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------------
  // getters: minTlsVersion, maxTlsVersion
  // -------------------------------------------------------------------------

  describe('getter minTlsVersion', () => {
    it('returns spec.minVersion when set', () => {
      const opt = make({ metadata: BASE_META, spec: { minVersion: 'VersionTLS12' } });

      expect(opt.minTlsVersion).toStrictEqual('VersionTLS12');
    });

    it('returns empty string when spec.minVersion is absent', () => {
      const opt = make({ metadata: BASE_META, spec: {} });

      expect(opt.minTlsVersion).toStrictEqual('');
    });
  });

  describe('getter maxTlsVersion', () => {
    it('returns spec.maxVersion when set', () => {
      const opt = make({ metadata: BASE_META, spec: { maxVersion: 'VersionTLS13' } });

      expect(opt.maxTlsVersion).toStrictEqual('VersionTLS13');
    });

    it('returns empty string when spec.maxVersion is absent', () => {
      const opt = make({ metadata: BASE_META, spec: {} });

      expect(opt.maxTlsVersion).toStrictEqual('');
    });
  });

  // -------------------------------------------------------------------------
  // getters: clientAuthType, clientAuthSecrets
  // -------------------------------------------------------------------------

  describe('getter clientAuthType', () => {
    it('returns the clientAuthType from spec.clientAuth', () => {
      const opt = make({ metadata: BASE_META, spec: { clientAuth: { clientAuthType: 'RequestClientCert' } } });

      expect(opt.clientAuthType).toStrictEqual('RequestClientCert');
    });

    it('defaults to NoClientCert when spec.clientAuth is absent', () => {
      const opt = make({ metadata: BASE_META, spec: {} });

      expect(opt.clientAuthType).toStrictEqual('NoClientCert');
    });
  });

  describe('getter clientAuthSecrets', () => {
    it('returns secretNames from spec.clientAuth', () => {
      const opt = make({ metadata: BASE_META, spec: { clientAuth: { secretNames: ['ca-1', 'ca-2'] } } });

      expect(opt.clientAuthSecrets).toStrictEqual(['ca-1', 'ca-2']);
    });

    it('returns empty array when spec.clientAuth.secretNames is absent', () => {
      const opt = make({ metadata: BASE_META, spec: { clientAuth: {} } });

      expect(opt.clientAuthSecrets).toStrictEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // getters: sniStrict, disableSessionTickets
  // -------------------------------------------------------------------------

  describe('getter sniStrict', () => {
    it.each([
      { desc: 'returns true when spec.sniStrict is true', value: true, expected: true },
      { desc: 'returns false when spec.sniStrict is false', value: false, expected: false },
      { desc: 'defaults to false when spec.sniStrict is absent', value: undefined, expected: false },
    ])('$desc', ({ value, expected }) => {
      const spec = value !== undefined ? { sniStrict: value } : {};
      const opt = make({ metadata: BASE_META, spec });

      expect(opt.sniStrict).toStrictEqual(expected);
    });
  });

  describe('getter disableSessionTickets', () => {
    it.each([
      { desc: 'returns true when spec.disableSessionTickets is true', value: true, expected: true },
      { desc: 'returns false when spec.disableSessionTickets is false', value: false, expected: false },
      { desc: 'defaults to false when spec.disableSessionTickets is absent', value: undefined, expected: false },
    ])('$desc', ({ value, expected }) => {
      const spec = value !== undefined ? { disableSessionTickets: value } : {};
      const opt = make({ metadata: BASE_META, spec });

      expect(opt.disableSessionTickets).toStrictEqual(expected);
    });
  });

  // -------------------------------------------------------------------------
  // method: createSecretLink
  // -------------------------------------------------------------------------

  describe('method createSecretLink', () => {
    it('returns a route location object for a given secret name and namespace', () => {
      const opt = make({ metadata: BASE_META, spec: {} });

      expect(opt.createSecretLink('my-ca', 'tls-ns')).toStrictEqual({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource:  'secret',
          product:   'explorer',
          id:        'my-ca',
          namespace: 'tls-ns',
        },
      });
    });

    it('falls back to the resource namespace when namespace argument is absent', () => {
      const opt = make({ metadata: BASE_META, spec: {} });

      const link = opt.createSecretLink('my-ca', null);

      expect(link?.params.namespace).toStrictEqual('default');
    });

    it('returns null when secretName is absent', () => {
      const opt = make({ metadata: BASE_META, spec: {} });

      expect(opt.createSecretLink('', 'default')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // getter: clientAuthSecretLinks
  // -------------------------------------------------------------------------

  describe('getter clientAuthSecretLinks', () => {
    it('returns an array of { secretName, link } for each secret in clientAuth.secretNames', () => {
      const opt = make({
        metadata: BASE_META,
        spec:     { clientAuth: { secretNames: ['ca-a', 'ca-b'] } },
      });

      const links = opt.clientAuthSecretLinks;

      expect(links).toHaveLength(2);
      expect(links[0].secretName).toStrictEqual('ca-a');
      expect(links[0].link).toStrictEqual(expect.objectContaining({
        params: expect.objectContaining({ id: 'ca-a', resource: 'secret' }),
      }));
      expect(links[1].secretName).toStrictEqual('ca-b');
    });

    it('returns empty array when clientAuth.secretNames is empty', () => {
      const opt = make({ metadata: BASE_META, spec: { clientAuth: { secretNames: [] } } });

      expect(opt.clientAuthSecretLinks).toStrictEqual([]);
    });
  });
});
