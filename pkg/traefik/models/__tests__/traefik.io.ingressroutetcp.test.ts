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

jest.mock('@shell/config/types', () => ({ SERVICE: 'service' }));

import IngressRouteTCP from '../traefik.io.ingressroutetcp';

const make = (data: any) => new IngressRouteTCP(data);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_META = { name: 'my-tcp', namespace: 'default' };

describe('class IngressRouteTCP', () => {
  // -------------------------------------------------------------------------
  // getter: ingressClass
  // -------------------------------------------------------------------------

  describe('getter ingressClass', () => {
    it.each([
      {
        desc:     'returns spec.ingressClassName when present (Traefik v3.7+)',
        spec:     { ingressClassName: 'traefik-v3' },
        meta:     BASE_META,
        expected: 'traefik-v3',
      },
      {
        desc:     'falls back to annotation when spec.ingressClassName is absent',
        spec:     {},
        meta:     { ...BASE_META, annotations: { 'kubernetes.io/ingress.class': 'traefik' } },
        expected: 'traefik',
      },
      {
        desc:     'spec.ingressClassName takes priority over annotation',
        spec:     { ingressClassName: 'by-spec' },
        meta:     { ...BASE_META, annotations: { 'kubernetes.io/ingress.class': 'by-annotation' } },
        expected: 'by-spec',
      },
      {
        desc:     'returns empty string when both are absent',
        spec:     {},
        meta:     BASE_META,
        expected: '',
      },
      {
        desc:     'returns empty string when annotations is undefined',
        spec:     {},
        meta:     { name: 'r', namespace: 'default' },
        expected: '',
      },
    ])('$desc', ({ spec, meta, expected }) => {
      const route = make({ metadata: meta, spec });

      expect(route.ingressClass).toStrictEqual(expected);
    });
  });

  // -------------------------------------------------------------------------
  // getter: details
  // -------------------------------------------------------------------------

  describe('getter details', () => {
    it('includes EntryPoints when spec.entryPoints is populated', () => {
      const route = make({ metadata: BASE_META, spec: { entryPoints: ['tcp', 'web'] } });

      const ep = route.details.find((d: any) => d.label === 'EntryPoints');

      expect(ep.content).toStrictEqual('tcp, web');
    });

    it('includes Ingress Class when annotation is set', () => {
      const route = make({
        metadata: { ...BASE_META, annotations: { 'kubernetes.io/ingress.class': 'traefik' } },
        spec:     {},
      });

      expect(route.details.find((d: any) => d.label === 'Ingress Class').content).toStrictEqual('traefik');
    });

    it('returns empty array when spec has no entryPoints and no ingressClass', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.details).toStrictEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // method: _generateRelationships
  // -------------------------------------------------------------------------

  describe('method _generateRelationships', () => {
    describe('TCP services', () => {
      it('creates a service relationship using namespace/name toId (same namespace)', () => {
        const route = make({
          metadata: BASE_META,
          spec:     { routes: [{ match: 'HostSNI(`*`)', services: [{ name: 'my-svc' }] }] },
        });

        const rels = route._generateRelationships();

        expect(rels).toHaveLength(1);
        expect(rels[0]).toStrictEqual(expect.objectContaining({
          toType: 'service',
          toId:   'default/my-svc',
          rel:    'uses',
        }));
      });

      it('uses service.namespace for the toId when set (cross-namespace service)', () => {
        const route = make({
          metadata: BASE_META,
          spec:     { routes: [{ match: 'HostSNI(`*`)', services: [{ name: 'remote-svc', namespace: 'other-ns' }] }] },
        });

        const rels = route._generateRelationships();

        expect(rels[0]).toStrictEqual(expect.objectContaining({
          toType: 'service',
          toId:   'other-ns/remote-svc',
        }));
      });

      it('sets fromType to traefik.io.ingressroutetcp', () => {
        const route = make({
          metadata: BASE_META,
          spec:     { routes: [{ match: 'HostSNI(`*`)', services: [{ name: 'svc' }] }] },
        });

        expect(route._generateRelationships()[0].fromType).toStrictEqual('traefik.io.ingressroutetcp');
      });
    });

    describe('TCP middlewares', () => {
      it('creates a traefik.io.middlewaretcp relationship (not HTTP middleware)', () => {
        const route = make({
          metadata: BASE_META,
          spec:     {
            routes: [{ match: 'HostSNI(`*`)', services: [], middlewares: [{ name: 'tcp-mw' }] }],
          },
        });

        const rels = route._generateRelationships();

        expect(rels).toHaveLength(1);
        expect(rels[0]).toStrictEqual(expect.objectContaining({
          toType: 'traefik.io.middlewaretcp',
          toId:   'default/tcp-mw',
        }));
      });

      it('uses middleware.namespace for cross-namespace middleware', () => {
        const route = make({
          metadata: BASE_META,
          spec:     {
            routes: [{ match: 'HostSNI(`*`)', services: [], middlewares: [{ name: 'tcp-mw', namespace: 'mw-ns' }] }],
          },
        });

        expect(route._generateRelationships()[0].toId).toStrictEqual('mw-ns/tcp-mw');
      });
    });

    describe('TLS relationships', () => {
      it.each([
        {
          desc:          'creates a secret relationship from spec.tls.secretName',
          tls:           { secretName: 'my-tls-secret' },
          expectedType:  'secret',
          expectedId:    'default/my-tls-secret',
        },
        {
          desc:          'creates a tlsoption relationship from spec.tls.options',
          tls:           { options: { name: 'my-opt' } },
          expectedType:  'traefik.io.tlsoption',
          expectedId:    'default/my-opt',
        },
        {
          desc:          'creates a tlsstore relationship from spec.tls.store',
          tls:           { store: { name: 'my-store' } },
          expectedType:  'traefik.io.tlsstore',
          expectedId:    'default/my-store',
        },
        {
          desc:          'creates a certresolver relationship from spec.tls.certResolver',
          tls:           { certResolver: 'le-resolver' },
          expectedType:  'traefik.io.certresolver',
          expectedId:    'le-resolver',
        },
      ])('$desc', ({ tls, expectedType, expectedId }) => {
        const route = make({ metadata: BASE_META, spec: { routes: [], tls } });

        const rels = route._generateRelationships();

        expect(rels).toHaveLength(1);
        expect(rels[0]).toStrictEqual(expect.objectContaining({
          toType: expectedType,
          toId:   expectedId,
        }));
      });

      it('uses tls.options.namespace when set (cross-namespace TLSOption)', () => {
        const route = make({
          metadata: BASE_META,
          spec:     { routes: [], tls: { options: { name: 'my-opt', namespace: 'tls-ns' } } },
        });

        expect(route._generateRelationships()[0].toId).toStrictEqual('tls-ns/my-opt');
      });

      it('uses tls.store.namespace when set (cross-namespace TLSStore)', () => {
        const route = make({
          metadata: BASE_META,
          spec:     { routes: [], tls: { store: { name: 'my-store', namespace: 'store-ns' } } },
        });

        expect(route._generateRelationships()[0].toId).toStrictEqual('store-ns/my-store');
      });
    });

    describe('deduplication', () => {
      it('deduplicates identical service relationships across multiple routes', () => {
        const route = make({
          metadata: BASE_META,
          spec:     {
            routes: [
              { match: 'HostSNI(`a.com`)', services: [{ name: 'svc' }] },
              { match: 'HostSNI(`b.com`)', services: [{ name: 'svc' }] },
            ],
          },
        });

        const rels = route._generateRelationships();

        expect(rels).toHaveLength(1);
        expect(rels[0].toId).toStrictEqual('default/svc');
      });

      it('does NOT deduplicate when toType differs but toId is the same', () => {
        const route = make({
          metadata: BASE_META,
          spec:     {
            routes: [{ match: 'HostSNI(`*`)', services: [{ name: 'shared' }] }],
            tls:    { secretName: 'shared' },
          },
        });

        const rels = route._generateRelationships();

        expect(rels).toHaveLength(2);
        expect(rels.find((r: any) => r.toType === 'service')).toBeDefined();
        expect(rels.find((r: any) => r.toType === 'secret')).toBeDefined();
      });
    });

    describe('edge cases', () => {
      it('returns empty array when spec.routes is empty', () => {
        const route = make({ metadata: BASE_META, spec: { routes: [] } });

        expect(route._generateRelationships()).toStrictEqual([]);
      });

      it('returns empty array when namespace is absent', () => {
        const route = make({ metadata: { name: 'r' }, spec: { routes: [{ services: [{ name: 'svc' }] }] } });

        expect(route._generateRelationships()).toStrictEqual([]);
      });

      it('returns empty array when spec is absent', () => {
        const route = make({ metadata: BASE_META });

        expect(route._generateRelationships()).toStrictEqual([]);
      });

      it('skips services without a name', () => {
        const route = make({
          metadata: BASE_META,
          spec:     { routes: [{ match: 'HostSNI(`*`)', services: [{ port: 443 }] }] },
        });

        expect(route._generateRelationships()).toStrictEqual([]);
      });

      it('skips Traefik provider services (name@provider) — not a K8s resource', () => {
        const route = make({
          metadata: BASE_META,
          spec:     { routes: [{ match: 'HostSNI(`*`)', services: [{ name: 'api@internal' }] }] },
        });

        expect(route._generateRelationships()).toStrictEqual([]);
      });

      it('skips all name@provider variants in the same route', () => {
        const route = make({
          metadata: BASE_META,
          spec:     {
            routes: [{
              match:    'HostSNI(`*`)',
              services: [{ name: 'ping@internal' }, { name: 'dashboard@internal' }],
            }],
          },
        });

        expect(route._generateRelationships()).toStrictEqual([]);
      });

      it('keeps K8s services and skips provider services in the same route', () => {
        const route = make({
          metadata: BASE_META,
          spec:     {
            routes: [{
              match:    'HostSNI(`*`)',
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

  // -------------------------------------------------------------------------
  // getter: targetServices
  // -------------------------------------------------------------------------

  describe('getter targetServices', () => {
    it('aggregates services from all routes', () => {
      const route = make({
        metadata: BASE_META,
        spec:     {
          routes: [
            { services: [{ name: 'svc-a', port: 443, namespace: 'ns-a', weight: 1 }] },
            { services: [{ name: 'svc-b', port: 8443 }] },
          ],
        },
      });

      expect(route.targetServices).toStrictEqual([
        { name: 'svc-a', port: 443, namespace: 'ns-a', weight: 1 },
        { name: 'svc-b', port: 8443, namespace: 'default', weight: undefined },
      ]);
    });

    it('uses metadata.namespace as fallback when service.namespace is absent', () => {
      const route = make({
        metadata: BASE_META,
        spec:     { routes: [{ services: [{ name: 'svc', port: 443 }] }] },
      });

      expect(route.targetServices[0].namespace).toStrictEqual('default');
    });

    it('returns empty array when spec.routes is empty', () => {
      const route = make({ metadata: BASE_META, spec: { routes: [] } });

      expect(route.targetServices).toStrictEqual([]);
    });

    it('skips services without a name', () => {
      const route = make({
        metadata: BASE_META,
        spec:     { routes: [{ services: [{ port: 443 }] }] },
      });

      expect(route.targetServices).toStrictEqual([]);
    });

    it('returns empty array when spec is absent', () => {
      const route = make({ metadata: BASE_META });

      expect(route.targetServices).toStrictEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // getter: isTLSPassthrough
  // -------------------------------------------------------------------------

  describe('getter isTLSPassthrough', () => {
    it.each([
      { desc: 'returns true when spec.tls.passthrough is true', tls: { passthrough: true }, expected: true },
      { desc: 'returns false when spec.tls.passthrough is false', tls: { passthrough: false }, expected: false },
      { desc: 'returns false when spec.tls.passthrough is absent', tls: {}, expected: false },
      { desc: 'returns false when spec.tls is absent', tls: undefined, expected: false },
    ])('$desc', ({ tls, expected }) => {
      const route = make({ metadata: BASE_META, spec: { routes: [], tls } });

      expect(route.isTLSPassthrough).toStrictEqual(expected);
    });
  });

  // -------------------------------------------------------------------------
  // getter: formattedEntryPoints
  // -------------------------------------------------------------------------

  describe('getter formattedEntryPoints', () => {
    it('returns the entryPoints array from spec', () => {
      const route = make({ metadata: BASE_META, spec: { entryPoints: ['tcp', 'web'] } });

      expect(route.formattedEntryPoints).toStrictEqual(['tcp', 'web']);
    });

    it('returns empty array when spec.entryPoints is absent', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.formattedEntryPoints).toStrictEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // getter: targetRoutes
  // -------------------------------------------------------------------------

  describe('getter targetRoutes', () => {
    it('returns spec.routes', () => {
      const routes = [{ match: 'HostSNI(`*`)', services: [] }];
      const route = make({ metadata: BASE_META, spec: { routes } });

      expect(route.targetRoutes).toStrictEqual(routes);
    });

    it('returns empty array when spec.routes is absent', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.targetRoutes).toStrictEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // method: targetTo
  // -------------------------------------------------------------------------

  describe('method targetTo', () => {
    it('returns a route location object for a regular Service', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.targetTo([], 'my-svc')).toStrictEqual({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource:  'service',
          product:   'explorer',
          id:        'my-svc',
          namespace: 'default',
        },
      });
    });

    it('uses traefik.io.traefikservice resource type for TraefikService kind', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.targetTo([], 'ts', 'TraefikService')).toStrictEqual(expect.objectContaining({
        params: expect.objectContaining({ resource: 'traefik.io.traefikservice' }),
      }));
    });

    it('returns null when serviceName is absent', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.targetTo([], '')).toBeNull();
    });

    it('returns null for Traefik provider services (api@internal)', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.targetTo([], 'api@internal')).toBeNull();
    });

    it('returns null for any name@provider pattern', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.targetTo([], 'ping@internal')).toBeNull();
      expect(route.targetTo([], 'dashboard@internal')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // method: createMiddlewareLink
  // -------------------------------------------------------------------------

  describe('method createMiddlewareLink', () => {
    it('returns a route location with traefik.io.middlewaretcp resource type', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.createMiddlewareLink('tcp-mw', 'default')).toStrictEqual({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource:  'traefik.io.middlewaretcp',
          product:   'explorer',
          id:        'tcp-mw',
          namespace: 'default',
        },
      });
    });

    it('falls back to the route namespace when namespace argument is absent', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      const link = route.createMiddlewareLink('tcp-mw', null);

      expect(link?.params.namespace).toStrictEqual('default');
    });

    it('returns null when middlewareName is absent', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.createMiddlewareLink('', 'default')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // method: createTLSLink
  // -------------------------------------------------------------------------

  describe('method createTLSLink', () => {
    it('returns a route location for the given resource type and name', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.createTLSLink('traefik.io.tlsoption', 'my-opt', 'tls-ns')).toStrictEqual({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource:  'traefik.io.tlsoption',
          product:   'explorer',
          id:        'my-opt',
          namespace: 'tls-ns',
        },
      });
    });

    it('returns null when resourceName is absent', () => {
      const route = make({ metadata: BASE_META, spec: {} });

      expect(route.createTLSLink('traefik.io.tlsoption', '', 'default')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // getters: tlsSecretLink, tlsOptionsLink, tlsStoreLink
  // -------------------------------------------------------------------------

  describe('getter tlsSecretLink', () => {
    it('returns a link when spec.tls.secretName is set', () => {
      const route = make({ metadata: BASE_META, spec: { tls: { secretName: 'my-secret' } } });

      expect(route.tlsSecretLink).toStrictEqual(expect.objectContaining({
        params: expect.objectContaining({ resource: 'secret', id: 'my-secret', namespace: 'default' }),
      }));
    });

    it('returns null when spec.tls.secretName is absent', () => {
      const route = make({ metadata: BASE_META, spec: { tls: {} } });

      expect(route.tlsSecretLink).toBeNull();
    });
  });

  describe('getter tlsOptionsLink', () => {
    it('returns a link when spec.tls.options.name is set', () => {
      const route = make({ metadata: BASE_META, spec: { tls: { options: { name: 'my-opt' } } } });

      expect(route.tlsOptionsLink).toStrictEqual(expect.objectContaining({
        params: expect.objectContaining({ resource: 'traefik.io.tlsoption', id: 'my-opt' }),
      }));
    });

    it('uses tls.options.namespace in the link', () => {
      const route = make({ metadata: BASE_META, spec: { tls: { options: { name: 'my-opt', namespace: 'tls-ns' } } } });

      expect(route.tlsOptionsLink?.params.namespace).toStrictEqual('tls-ns');
    });

    it('returns null when spec.tls.options.name is absent', () => {
      const route = make({ metadata: BASE_META, spec: { tls: { options: {} } } });

      expect(route.tlsOptionsLink).toBeNull();
    });
  });

  describe('getter tlsStoreLink', () => {
    it('returns a link when spec.tls.store.name is set', () => {
      const route = make({ metadata: BASE_META, spec: { tls: { store: { name: 'my-store' } } } });

      expect(route.tlsStoreLink).toStrictEqual(expect.objectContaining({
        params: expect.objectContaining({ resource: 'traefik.io.tlsstore', id: 'my-store' }),
      }));
    });

    it('uses tls.store.namespace in the link', () => {
      const route = make({ metadata: BASE_META, spec: { tls: { store: { name: 'my-store', namespace: 'store-ns' } } } });

      expect(route.tlsStoreLink?.params.namespace).toStrictEqual('store-ns');
    });

    it('returns null when spec.tls.store.name is absent', () => {
      const route = make({ metadata: BASE_META, spec: { tls: { store: {} } } });

      expect(route.tlsStoreLink).toBeNull();
    });
  });
});
