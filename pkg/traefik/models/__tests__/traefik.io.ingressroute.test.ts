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

  describe('ingressClass — spec.ingressClassName priority', () => {
    it('returns spec.ingressClassName when present (Traefik v3.7+)', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     { ingressClassName: 'traefik-v3' },
      });

      expect(route.ingressClass).toStrictEqual('traefik-v3');
    });

    it('spec.ingressClassName takes priority over annotation', () => {
      const route = makeRoute({
        metadata: {
          name:        'r',
          namespace:   'default',
          annotations: { 'kubernetes.io/ingress.class': 'by-annotation' },
        },
        spec: { ingressClassName: 'by-spec' },
      });

      expect(route.ingressClass).toStrictEqual('by-spec');
    });
  });

  describe('relationships getter (lazy)', () => {
    it('returns [] when metadata is absent', () => {
      const route = makeRoute({ spec: { routes: [] } });

      expect(route.relationships).toStrictEqual([]);
    });

    it('regenerates when metadata.relationships is empty', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     { routes: [{ match: 'Host(`a.com`)', services: [{ name: 'svc' }] }] },
      });
      route.metadata.relationships = [];

      expect(route.relationships).toHaveLength(1);
      expect(route.relationships[0].toId).toStrictEqual('default/svc');
    });

    it('does not regenerate when relationships are already populated', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     { routes: [{ match: 'Host(`a.com`)', services: [{ name: 'svc' }] }] },
      });
      const first = route.relationships;

      // Mutate the cached array — if the getter regenerated it would be overwritten
      first[0].toId = 'SENTINEL';

      expect(route.relationships[0].toId).toStrictEqual('SENTINEL');
    });
  });

  describe('createRulesForListPage', () => {
    it('returns empty array when spec.routes is empty', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     { routes: [] },
      });

      expect(route.createRulesForListPage([])).toStrictEqual([]);
    });

    it('flatMaps correctly across routes with multiple services', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [
            { match: 'Host(`a.com`)', services: [{ name: 'svc-a', port: 80 }, { name: 'svc-b', port: 443 }] },
            { match: 'Host(`b.com`)', services: [{ name: 'svc-c', port: 8080 }] },
          ],
        },
      });

      const result = route.createRulesForListPage([]);

      expect(result).toHaveLength(3);
      expect(result[0].matchRule).toStrictEqual('Host(`a.com`)');
      expect(result[2].matchRule).toStrictEqual('Host(`b.com`)');
    });

    it('contributes 0 elements for a route with no services', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     { routes: [{ match: 'Host(`a.com`)', services: [] }] },
      });

      expect(route.createRulesForListPage([])).toHaveLength(0);
    });
  });

  describe('createServiceForListPage', () => {
    const route = makeRoute({
      metadata: { name: 'r', namespace: 'default' },
      spec:     { routes: [] },
    });
    const dummyRoute = { match: 'Host(`x.com`)' };

    it('display = "name:port" when both name and port are present', () => {
      const result = route.createServiceForListPage([], dummyRoute, { name: 'svc', port: 80 });

      expect(result.display).toStrictEqual('svc:80');
    });

    it('display = "name" when port is absent', () => {
      const result = route.createServiceForListPage([], dummyRoute, { name: 'svc' });

      expect(result.display).toStrictEqual('svc');
    });

    it('display = "-:port" when serviceName is absent but port is present', () => {
      const result = route.createServiceForListPage([], dummyRoute, { port: 80 });

      expect(result.display).toStrictEqual('-:80');
    });

    it('display = "-" when both serviceName and port are absent', () => {
      const result = route.createServiceForListPage([], dummyRoute, {});

      expect(result.display).toStrictEqual('-');
    });

    it('serviceNamespace falls back to this.namespace when service.namespace is absent', () => {
      const result = route.createServiceForListPage([], dummyRoute, { name: 'svc', port: 80 });

      expect(result.serviceNamespace).toStrictEqual('default');
    });

    it('serviceNamespace uses service.namespace when provided', () => {
      const result = route.createServiceForListPage([], dummyRoute, { name: 'svc', namespace: 'other-ns' });

      expect(result.serviceNamespace).toStrictEqual('other-ns');
    });

    it('serviceKind defaults to "Service" — reflected in serviceTargetTo resource type', () => {
      const result = route.createServiceForListPage([], dummyRoute, { name: 'svc', port: 80 });

      expect(result.serviceTargetTo).toStrictEqual(expect.objectContaining({
        params: expect.objectContaining({ resource: 'service' }),
      }));
    });

    it('targetLink is null for Traefik provider services (api@internal)', () => {
      const result = route.createServiceForListPage([], dummyRoute, { name: 'api@internal' });

      expect(result.targetLink).toBeNull();
    });

    it('display still shows the service name for Traefik provider services', () => {
      const result = route.createServiceForListPage([], dummyRoute, { name: 'api@internal' });

      expect(result.display).toStrictEqual('api@internal');
    });

    it('serviceTargetTo is null for any name@provider pattern', () => {
      const result = route.createServiceForListPage([], dummyRoute, { name: 'ping@internal' });

      expect(result.serviceTargetTo).toBeNull();
    });
  });

  describe('targetTo', () => {
    const route = makeRoute({
      metadata: { name: 'r', namespace: 'default' },
      spec:     { routes: [] },
    });

    it('returns null for Traefik provider services (api@internal)', () => {
      expect(route.targetTo([], 'api@internal')).toBeNull();
    });

    it('returns null for any name@provider pattern', () => {
      expect(route.targetTo([], 'ping@internal')).toBeNull();
      expect(route.targetTo([], 'dashboard@internal')).toBeNull();
    });

    it('returns a route location for a regular K8s service', () => {
      expect(route.targetTo([], 'my-svc')).toStrictEqual(expect.objectContaining({
        params: expect.objectContaining({ resource: 'service', id: 'my-svc' }),
      }));
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

    it('should NOT create a relationship for Traefik provider services (name@provider)', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [{ match: 'Host(`example.com`)', kind: 'Rule', services: [{ name: 'api@internal' }] }],
        },
      });

      expect(route._generateRelationships()).toStrictEqual([]);
    });

    it('should NOT create a relationship for any name@provider pattern', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [{
            match:    'Host(`x.com`)',
            kind:     'Rule',
            services: [{ name: 'ping@internal' }, { name: 'dashboard@internal' }],
          }],
        },
      });

      expect(route._generateRelationships()).toStrictEqual([]);
    });

    it('should create a relationship for K8s services but skip provider services in the same route', () => {
      const route = makeRoute({
        metadata: { name: 'r', namespace: 'default' },
        spec:     {
          routes: [{
            match:    'Host(`x.com`)',
            kind:     'Rule',
            services: [{ name: 'real-svc' }, { name: 'api@internal' }],
          }],
        },
      });

      const rels = route._generateRelationships();

      expect(rels).toHaveLength(1);
      expect(rels[0].toId).toStrictEqual('default/real-svc');
    });
  });
});
