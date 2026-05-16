jest.mock('@shell/plugins/steve/steve-class', () => {
  class SteveModel {
    constructor(data, ctx = {}) {
      Object.assign(this, data);
    }

    get namespace() {
      return this.metadata?.namespace;
    }
  }

  return { __esModule: true, default: SteveModel };
});

import Middleware from '../traefik.io.middleware';

const makeMiddleware = (data) => new Middleware(data);

describe('traefik.io.middleware model', () => {
  describe('middlewareTypes', () => {
    it.each([
      [{ basicAuth: {}, rateLimit: {} }, ['basicAuth', 'rateLimit']],
      [{ headers: {} },                  ['headers']],
      [null,                             []],
      [{},                               []],
    ])('should return correct types for spec %j', (spec, expected) => {
      const mw = makeMiddleware({ metadata: { name: 'mw', namespace: 'default' }, spec });

      expect(mw.middlewareTypes).toStrictEqual(expected);
    });
  });

  describe('primaryMiddlewareType', () => {
    it('should return the first key when spec has entries', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { basicAuth: {}, rateLimit: {} },
      });

      expect(mw.primaryMiddlewareType).toStrictEqual('basicAuth');
    });

    it('should return null when spec is empty', () => {
      const mw = makeMiddleware({ metadata: { name: 'mw', namespace: 'default' }, spec: {} });

      expect(mw.primaryMiddlewareType).toBeNull();
    });
  });

  describe('hasMultipleTypes', () => {
    it('should return true when spec has 2 or more keys', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { basicAuth: {}, rateLimit: {} },
      });

      expect(mw.hasMultipleTypes).toStrictEqual(true);
    });

    it('should return false when spec has exactly 1 key', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { headers: {} },
      });

      expect(mw.hasMultipleTypes).toStrictEqual(false);
    });
  });

  describe('getMiddlewareConfig', () => {
    it('returns the config object when type is present in spec', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { basicAuth: { secret: 'my-secret' } },
      });

      expect(mw.getMiddlewareConfig('basicAuth')).toStrictEqual({ secret: 'my-secret' });
    });

    it('returns null when type is absent from spec', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { headers: {} },
      });

      expect(mw.getMiddlewareConfig('basicAuth')).toBeNull();
    });

    it('returns null when spec is absent', () => {
      const mw = makeMiddleware({ metadata: { name: 'mw', namespace: 'default' }, spec: null });

      expect(mw.getMiddlewareConfig('basicAuth')).toBeNull();
    });
  });

  describe('hasMiddlewareType', () => {
    it('returns true when type is present in spec', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { basicAuth: { secret: 'my-secret' } },
      });

      expect(mw.hasMiddlewareType('basicAuth')).toStrictEqual(true);
    });

    it('returns false when type is absent from spec', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { headers: {} },
      });

      expect(mw.hasMiddlewareType('basicAuth')).toStrictEqual(false);
    });
  });

  describe('createSecretLink', () => {
    it('returns a route location object when secretName is provided', () => {
      const mw = makeMiddleware({ metadata: { name: 'mw', namespace: 'default' }, spec: {} });

      expect(mw.createSecretLink('my-secret', 'default')).toStrictEqual({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource:  'secret',
          product:   'explorer',
          id:        'my-secret',
          namespace: 'default',
        },
      });
    });

    it('returns null when secretName is empty string', () => {
      const mw = makeMiddleware({ metadata: { name: 'mw', namespace: 'default' }, spec: {} });

      expect(mw.createSecretLink('', 'default')).toBeNull();
    });

    it('falls back to this.namespace when namespace argument is absent', () => {
      const mw = makeMiddleware({ metadata: { name: 'mw', namespace: 'my-ns' }, spec: {} });

      expect(mw.createSecretLink('my-secret', null)?.params.namespace).toStrictEqual('my-ns');
    });
  });

  describe('basicAuthSecretLink', () => {
    it('returns a link when spec.basicAuth.secret is set', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { basicAuth: { secret: 'auth-secret' } },
      });

      expect(mw.basicAuthSecretLink).toStrictEqual(expect.objectContaining({
        params: expect.objectContaining({ resource: 'secret', id: 'auth-secret', namespace: 'default' }),
      }));
    });

    it('returns null when spec.basicAuth.secret is absent', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { basicAuth: {} },
      });

      expect(mw.basicAuthSecretLink).toBeNull();
    });
  });

  describe('digestAuthSecretLink', () => {
    it('returns a link when spec.digestAuth.secret is set', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { digestAuth: { secret: 'digest-secret' } },
      });

      expect(mw.digestAuthSecretLink).toStrictEqual(expect.objectContaining({
        params: expect.objectContaining({ resource: 'secret', id: 'digest-secret' }),
      }));
    });

    it('returns null when spec.digestAuth.secret is absent', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { digestAuth: {} },
      });

      expect(mw.digestAuthSecretLink).toBeNull();
    });
  });

  describe('rateLimitRedisSecretLink', () => {
    it('returns a link when spec.rateLimit.redis.secret is set', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { rateLimit: { redis: { secret: 'redis-secret' } } },
      });

      expect(mw.rateLimitRedisSecretLink).toStrictEqual(expect.objectContaining({
        params: expect.objectContaining({ resource: 'secret', id: 'redis-secret' }),
      }));
    });

    it('returns null when spec.rateLimit.redis.secret is absent', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { rateLimit: { redis: {} } },
      });

      expect(mw.rateLimitRedisSecretLink).toBeNull();
    });
  });

  describe('_generateRelationships', () => {
    it('should create a secret relationship for basicAuth.secret', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { basicAuth: { secret: 'my-secret' } },
      });

      const rels = mw._generateRelationships();

      expect(rels).toHaveLength(1);
      expect(rels[0]).toStrictEqual(expect.objectContaining({ toType: 'secret', toId: 'default/my-secret' }));
    });

    it('should create a secret relationship for digestAuth.secret', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { digestAuth: { secret: 'digest-secret' } },
      });

      const rels = mw._generateRelationships();

      expect(rels).toHaveLength(1);
      expect(rels[0]).toStrictEqual(expect.objectContaining({ toType: 'secret', toId: 'default/digest-secret' }));
    });

    it('should create a secret relationship for rateLimit.redis.secret', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { rateLimit: { redis: { secret: 'redis-secret' } } },
      });

      const rels = mw._generateRelationships();

      expect(rels).toHaveLength(1);
      expect(rels[0]).toStrictEqual(expect.objectContaining({ toType: 'secret', toId: 'default/redis-secret' }));
    });

    it('should deduplicate when the same secret is referenced multiple times', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     {
          basicAuth:  { secret: 'shared-secret' },
          digestAuth: { secret: 'shared-secret' },
        },
      });

      const rels = mw._generateRelationships();

      expect(rels).toHaveLength(1);
      expect(rels[0].toId).toStrictEqual('default/shared-secret');
    });

    it('should return empty array when no secret keys are present', () => {
      const mw = makeMiddleware({
        metadata: { name: 'mw', namespace: 'default' },
        spec:     { headers: { customRequestHeaders: { 'X-Foo': 'bar' } } },
      });

      expect(mw._generateRelationships()).toStrictEqual([]);
    });
  });
});
