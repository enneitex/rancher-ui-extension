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

jest.mock('@shell/utils/object', () => ({
  get: (obj, path) => {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
  },
}));

jest.mock('@shell/config/types', () => ({
  SERVICE: 'service',
}));

import IngressRoute from '../traefik.io.ingressroute';

const makeRoute = (data) => new IngressRoute(data);

describe('traefik.io.ingressroute model', () => {
  describe('ingressClass', () => {
    it('should return the annotation value when present', () => {
      const route = makeRoute({
        metadata: {
          name:        'my-route',
          namespace:   'default',
          annotations: { 'kubernetes.io/ingress.class': 'traefik' },
        },
        spec: {},
      });

      expect(route.ingressClass).toStrictEqual('traefik');
    });

    it('should return empty string when annotation is absent', () => {
      const route = makeRoute({
        metadata: { name: 'my-route', namespace: 'default', annotations: {} },
        spec:     {},
      });

      expect(route.ingressClass).toStrictEqual('');
    });

    it('should return empty string when metadata.annotations is undefined', () => {
      const route = makeRoute({
        metadata: { name: 'my-route', namespace: 'default' },
        spec:     {},
      });

      expect(route.ingressClass).toStrictEqual('');
    });
  });

  describe('details', () => {
    it('should include entryPoints when spec.entryPoints is populated', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     { entryPoints: ['web', 'websecure'] },
      });

      const details = route.details;

      expect(details.find((d) => d.label === 'EntryPoints').content).toStrictEqual('web, websecure');
    });

    it('should include ingressClass when annotation is set', () => {
      const route = makeRoute({
        metadata: {
          name:        'r',
          namespace:   'default',
          annotations: { 'kubernetes.io/ingress.class': 'traefik' },
        },
        spec: {},
      });

      expect(route.details.find((d) => d.label === 'Ingress Class').content).toStrictEqual('traefik');
    });

    it('should return empty array when spec is empty', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {},
      });

      expect(route.details).toStrictEqual([]);
    });
  });

  describe('_generateRelationships', () => {
    it('should use service.namespace as the namespace when set (cross-namespace service)', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [{
            match:    'Host(`example.com`)',
            kind:     'Rule',
            services: [{ name: 'remote-svc', namespace: 'other-ns' }],
          }],
        },
      });

      const rels = route._generateRelationships();

      expect(rels[0]).toStrictEqual(expect.objectContaining({ toType: 'service', toId: 'other-ns/remote-svc' }));
    });

    it('should create a Service relationship with namespace/name toId', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [{
            match:    'Host(`example.com`)',
            kind:     'Rule',
            services: [{ name: 'my-svc' }],
          }],
        },
      });

      const rels = route._generateRelationships();

      expect(rels).toHaveLength(1);
      expect(rels[0]).toStrictEqual(expect.objectContaining({ toType: 'service', toId: 'default/my-svc' }));
    });

    it('should create a TraefikService relationship with traefik.io.traefikservice toType', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [{
            match:    'Host(`example.com`)',
            kind:     'Rule',
            services: [{ name: 'my-ts', kind: 'TraefikService' }],
          }],
        },
      });

      const rels = route._generateRelationships();

      expect(rels[0]).toStrictEqual(expect.objectContaining({ toType: 'traefik.io.traefikservice', toId: 'default/my-ts' }));
    });

    it('should create middleware relationships from route.middlewares', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [{
            match:       'Host(`example.com`)',
            kind:        'Rule',
            services:    [],
            middlewares: [{ name: 'rate-limit' }, { name: 'auth', namespace: 'auth-ns' }],
          }],
        },
      });

      const rels = route._generateRelationships();
      const mwRels = rels.filter((r) => r.toType === 'traefik.io.middleware');

      expect(mwRels).toHaveLength(2);
      expect(mwRels[0].toId).toStrictEqual('default/rate-limit');
      expect(mwRels[1].toId).toStrictEqual('auth-ns/auth');
    });

    it('should create a secret relationship from spec.tls.secretName', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [],
          tls:    { secretName: 'my-tls-secret' },
        },
      });

      const rels = route._generateRelationships();

      expect(rels).toHaveLength(1);
      expect(rels[0]).toStrictEqual(expect.objectContaining({ toType: 'secret', toId: 'default/my-tls-secret' }));
    });

    it('should create a TLSOption relationship from spec.tls.options', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [],
          tls:    { options: { name: 'my-tls-option' } },
        },
      });

      const rels = route._generateRelationships();

      expect(rels).toHaveLength(1);
      expect(rels[0]).toStrictEqual(expect.objectContaining({ toType: 'traefik.io.tlsoption', toId: 'default/my-tls-option' }));
    });

    it('should create a TLSStore relationship from spec.tls.store', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [],
          tls:    { store: { name: 'my-tls-store' } },
        },
      });

      const rels = route._generateRelationships();

      expect(rels).toHaveLength(1);
      expect(rels[0]).toStrictEqual(expect.objectContaining({ toType: 'traefik.io.tlsstore', toId: 'default/my-tls-store' }));
    });

    it('should deduplicate identical relationships', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [
            { match: 'Host(`a.com`)', kind: 'Rule', services: [{ name: 'svc' }] },
            { match: 'Host(`b.com`)', kind: 'Rule', services: [{ name: 'svc' }] },
          ],
        },
      });

      const rels = route._generateRelationships();

      expect(rels).toHaveLength(1);
      expect(rels[0].toId).toStrictEqual('default/svc');
    });

    it('should NOT deduplicate relationships with different toType but same toId', () => {
      // Dedup key is "toType:toId" — a Service and a Secret with the same name must both appear
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [{ match: 'Host(`x.com`)', kind: 'Rule', services: [{ name: 'shared' }] }],
          tls:    { secretName: 'shared' },
        },
      });

      const rels = route._generateRelationships();

      expect(rels).toHaveLength(2);
      expect(rels.find((r) => r.toType === 'service')).toBeDefined();
      expect(rels.find((r) => r.toType === 'secret')).toBeDefined();
    });

    it('should return empty array when spec.routes is empty', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     { routes: [] },
      });

      expect(route._generateRelationships()).toStrictEqual([]);
    });
  });
});
