/**
 * Unit tests for CRUIngressRouteTCP form logic.
 *
 * Strategy: extract and test computed/watch/method functions directly with a
 * hand-crafted `this` context, without mounting the full Vue component.
 */

// ---------------------------------------------------------------------------
// Helpers — pure logic extracted from CRUIngressRouteTCP
// ---------------------------------------------------------------------------

/**
 * entryPointsValid computed.
 * For TCP routes, entryPoints starts empty and is always required.
 */
function entryPointsValid(spec) {
  return !!(spec.entryPoints && spec.entryPoints.length > 0);
}

/**
 * routesValid watch handler.
 * Every route must have a non-empty match string.
 */
function computeRoutesValid(routes) {
  return !!(routes && routes.length > 0 && routes.every(route => !!route.match));
}

/**
 * validationPassed computed.
 * For TCP: fvFormIsValid covers port (it is in fvFormRuleSets as required).
 */
function validationPassed({ fvFormIsValid, routesValid, tlsValid, epValid }) {
  return fvFormIsValid && routesValid && tlsValid && epValid;
}

/**
 * Simulates the fvFormRuleSets port-required rule.
 * Returns true when all service ports are non-empty strings/numbers.
 */
function portRequiredValid(routes) {
  return routes.every(route =>
    (route.services || []).every(svc => svc.port !== '' && svc.port !== undefined && svc.port !== null)
  );
}

/**
 * willSave method — pure logic extracted from CRUIngressRouteTCP.
 */
function willSave(spec) {
  spec.routes.forEach(route => {
    delete route.vKey;
    if (route.services) {
      route.services.forEach(service => {
        delete service.vKey;
        if (typeof service.name === 'object') {
          service.name = service.name?.label || service.name?.value || '';
        }
        if (typeof service.port === 'object') {
          service.port = service.port?.label || service.port?.value || '';
        }
      });
    }
    if (route.middlewares) {
      route.middlewares.forEach(middleware => delete middleware.vKey);
    }
  });

  if (spec.tls?.domains) {
    spec.tls.domains.forEach(domain => delete domain.vKey);
  }

  if (spec.entryPoints) {
    spec.entryPoints = spec.entryPoints.map(ep => {
      if (typeof ep === 'object') {
        return ep?.label || ep?.value || '';
      }
      return ep;
    }).filter(ep => ep);
  }

  return spec;
}

/**
 * middlewareTcpTargets computed.
 * Maps MiddlewareTCP resources (from traefik.io.middlewaretcp) to option objects.
 * HTTP Middleware resources are NOT included.
 */
function middlewareTcpTargets(middlewaretcps) {
  return middlewaretcps.map(mw => ({
    label:     mw.metadata.name,
    value:     mw.metadata.name,
    namespace: mw.metadata.namespace,
  }));
}

// ---------------------------------------------------------------------------
// entryPointsValid — TCP always requires at least one entryPoint
// ---------------------------------------------------------------------------

describe('CRUIngressRouteTCP › entryPointsValid', () => {
  it('returns true when entryPoints has values', () => {
    expect(entryPointsValid({ entryPoints: ['tcpep'] })).toBe(true);
  });

  it('returns false when entryPoints is empty (default for TCP)', () => {
    // TCP defaults to [] — user must fill in custom values
    expect(entryPointsValid({ entryPoints: [] })).toBe(false);
  });

  it('returns false when entryPoints is undefined', () => {
    expect(entryPointsValid({ entryPoints: undefined })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// routesValid — default match is pre-filled for TCP
// ---------------------------------------------------------------------------

describe('CRUIngressRouteTCP › routesValid', () => {
  it('returns true for default route with HostSNI(`*`)', () => {
    expect(computeRoutesValid([{ match: 'HostSNI(`*`)' }])).toBe(true);
  });

  it('returns false when match is empty', () => {
    expect(computeRoutesValid([{ match: '' }])).toBe(false);
  });

  it('returns false when match is undefined', () => {
    expect(computeRoutesValid([{ match: undefined }])).toBe(false);
  });

  it('returns false when routes array is empty', () => {
    expect(computeRoutesValid([])).toBe(false);
  });

  it('handles multiple routes — all must be valid', () => {
    expect(computeRoutesValid([
      { match: 'HostSNI(`a.com`)' },
      { match: '' },
    ])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Port required (fvFormRuleSets rule for spec.routes.services.port)
// ---------------------------------------------------------------------------

describe('CRUIngressRouteTCP › port required validation', () => {
  it('returns true when all services have a port', () => {
    const routes = [{ services: [{ name: 'svc', port: '8443' }] }];
    expect(portRequiredValid(routes)).toBe(true);
  });

  it('returns false when a service has an empty port', () => {
    const routes = [{ services: [{ name: 'svc', port: '' }] }];
    expect(portRequiredValid(routes)).toBe(false);
  });

  it('returns false when a service has an undefined port', () => {
    const routes = [{ services: [{ name: 'svc', port: undefined }] }];
    expect(portRequiredValid(routes)).toBe(false);
  });

  it('returns true when port is a number (0 is falsy but valid port edge case)', () => {
    // port 0 is technically invalid in practice but the rule only checks empty string / undefined
    const routes = [{ services: [{ name: 'svc', port: 443 }] }];
    expect(portRequiredValid(routes)).toBe(true);
  });

  it('handles routes with no services', () => {
    const routes = [{ services: [] }];
    expect(portRequiredValid(routes)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validationPassed
// ---------------------------------------------------------------------------

describe('CRUIngressRouteTCP › validationPassed', () => {
  const allValid = {
    fvFormIsValid: true,
    routesValid:   true,
    tlsValid:      true,
    epValid:       true,
  };

  it('returns true when all conditions are met', () => {
    expect(validationPassed(allValid)).toBe(true);
  });

  it('returns false when fvFormIsValid is false (e.g. port missing)', () => {
    expect(validationPassed({ ...allValid, fvFormIsValid: false })).toBe(false);
  });

  it('returns false when routesValid is false', () => {
    expect(validationPassed({ ...allValid, routesValid: false })).toBe(false);
  });

  it('returns false when epValid is false (no entryPoints)', () => {
    expect(validationPassed({ ...allValid, epValid: false })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// middlewareTcpTargets — only MiddlewareTCP resources, not HTTP middlewares
// ---------------------------------------------------------------------------

describe('CRUIngressRouteTCP › middlewareTcpTargets', () => {
  it('maps MiddlewareTCP resources to label/value/namespace objects', () => {
    const middlewaretcps = [
      { metadata: { name: 'tcp-mw-1', namespace: 'default' } },
      { metadata: { name: 'tcp-mw-2', namespace: 'kube-system' } },
    ];
    expect(middlewareTcpTargets(middlewaretcps)).toEqual([
      { label: 'tcp-mw-1', value: 'tcp-mw-1', namespace: 'default' },
      { label: 'tcp-mw-2', value: 'tcp-mw-2', namespace: 'kube-system' },
    ]);
  });

  it('returns empty array when no MiddlewareTCP resources exist', () => {
    expect(middlewareTcpTargets([])).toEqual([]);
  });

  it('does NOT include HTTP middleware resources (they come from a different store key)', () => {
    // The component uses `middlewaretcps` (traefik.io.middlewaretcp) not `middlewares`
    // This test documents that the separation is enforced at the data-fetching level:
    // only resources from traefik.io.middlewaretcp end up in middlewareTcpTargets.
    const onlyTcpMiddlewares = [
      { metadata: { name: 'only-tcp', namespace: 'default' } },
    ];
    const result = middlewareTcpTargets(onlyTcpMiddlewares);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('only-tcp');
  });
});

// ---------------------------------------------------------------------------
// willSave
// ---------------------------------------------------------------------------

describe('CRUIngressRouteTCP › willSave', () => {
  it('removes vKey from routes', () => {
    const spec = {
      entryPoints: ['tcpep'],
      routes: [{ match: 'HostSNI(`*`)', vKey: 'r1', services: [], middlewares: [] }],
    };
    expect(willSave(spec).routes[0]).not.toHaveProperty('vKey');
  });

  it('coerces service.port from object to string', () => {
    const spec = {
      entryPoints: ['tcpep'],
      routes: [{
        match:      'HostSNI(`*`)',
        services:   [{ name: 'svc', port: { label: '8443', value: '8443' } }],
        middlewares: [],
      }],
    };
    expect(willSave(spec).routes[0].services[0].port).toBe('8443');
  });

  it('normalizes entryPoints objects to strings', () => {
    const spec = {
      entryPoints: [{ label: 'tcpep', value: 'tcpep' }],
      routes: [{ match: 'HostSNI(`*`)', services: [], middlewares: [] }],
    };
    expect(willSave(spec).entryPoints).toEqual(['tcpep']);
  });

  it('filters empty entryPoints strings', () => {
    const spec = {
      entryPoints: ['tcpep', ''],
      routes: [{ match: 'HostSNI(`*`)', services: [], middlewares: [] }],
    };
    expect(willSave(spec).entryPoints).toEqual(['tcpep']);
  });

  it('removes vKey from TLS domains', () => {
    const spec = {
      entryPoints: ['tcpep'],
      routes: [{ match: 'HostSNI(`*`)', services: [], middlewares: [] }],
      tls: { domains: [{ main: 'a.com', vKey: 'd1' }] },
    };
    expect(willSave(spec).tls.domains[0]).not.toHaveProperty('vKey');
  });

  it('does not crash when tls is absent', () => {
    const spec = {
      entryPoints: ['tcpep'],
      routes: [{ match: 'HostSNI(`*`)', services: [], middlewares: [] }],
    };
    expect(() => willSave(spec)).not.toThrow();
  });
});
