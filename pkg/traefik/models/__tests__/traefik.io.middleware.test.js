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
