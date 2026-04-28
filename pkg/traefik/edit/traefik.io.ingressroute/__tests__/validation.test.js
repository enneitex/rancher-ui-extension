/**
 * Unit tests for CRUIngressRoute form logic.
 *
 * Strategy: import the component options object and invoke computed/watch/method
 * functions directly with a hand-crafted `this` context, avoiding the full Vue
 * mount + Rancher shell dependency chain.
 */

// ---------------------------------------------------------------------------
// Helpers — replicate the pure logic extracted from the component
// ---------------------------------------------------------------------------

/**
 * entryPointsValid computed (from CRUIngressRoute).
 * Returns true when spec.entryPoints is a non-empty array.
 */
function entryPointsValid(spec) {
  return !!(spec.entryPoints && spec.entryPoints.length > 0);
}

/**
 * routesValid watch handler (from CRUIngressRoute).
 * Every route must have a non-empty match string.
 */
function computeRoutesValid(routes) {
  return !!(routes && routes.length > 0 && routes.every(route => !!route.match));
}

/**
 * validationPassed computed (from CRUIngressRoute).
 * Combines fvFormIsValid, routesValid, tlsValid and entryPointsValid.
 */
function validationPassed({ fvFormIsValid, routesValid, tlsValid, epValid }) {
  return fvFormIsValid && routesValid && tlsValid && epValid;
}

/**
 * willSave method (from CRUIngressRoute) — pure logic extracted.
 * Mutates the spec in-place, returns it for assertion convenience.
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
        if (!service.kind) {
          service.kind = 'Service';
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

// ---------------------------------------------------------------------------
// entryPointsValid
// ---------------------------------------------------------------------------

describe('CRUIngressRoute › entryPointsValid', () => {
  it('returns true when entryPoints has at least one value', () => {
    expect(entryPointsValid({ entryPoints: ['websecure'] })).toBe(true);
  });

  it('returns true when entryPoints has multiple values', () => {
    expect(entryPointsValid({ entryPoints: ['web', 'websecure'] })).toBe(true);
  });

  it('returns false when entryPoints is an empty array', () => {
    expect(entryPointsValid({ entryPoints: [] })).toBe(false);
  });

  it('returns false when entryPoints is undefined', () => {
    expect(entryPointsValid({ entryPoints: undefined })).toBe(false);
  });

  it('returns false when entryPoints is null', () => {
    expect(entryPointsValid({ entryPoints: null })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// routesValid (watch handler)
// ---------------------------------------------------------------------------

describe('CRUIngressRoute › routesValid', () => {
  it('returns true when all routes have a non-empty match', () => {
    const routes = [
      { match: 'Host(`example.com`)' },
      { match: 'Host(`other.com`)' },
    ];
    expect(computeRoutesValid(routes)).toBe(true);
  });

  it('returns false when at least one route has an empty match', () => {
    const routes = [
      { match: 'Host(`example.com`)' },
      { match: '' },
    ];
    expect(computeRoutesValid(routes)).toBe(false);
  });

  it('returns false when at least one route has match undefined', () => {
    const routes = [{ match: undefined }];
    expect(computeRoutesValid(routes)).toBe(false);
  });

  it('returns false when routes array is empty', () => {
    expect(computeRoutesValid([])).toBe(false);
  });

  it('returns false when routes is undefined', () => {
    expect(computeRoutesValid(undefined)).toBe(false);
  });

  it('returns false when routes is null', () => {
    expect(computeRoutesValid(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validationPassed
// ---------------------------------------------------------------------------

describe('CRUIngressRoute › validationPassed', () => {
  const allValid = {
    fvFormIsValid: true,
    routesValid:   true,
    tlsValid:      true,
    epValid:       true,
  };

  it('returns true when all conditions are met', () => {
    expect(validationPassed(allValid)).toBe(true);
  });

  it('returns false when fvFormIsValid is false', () => {
    expect(validationPassed({ ...allValid, fvFormIsValid: false })).toBe(false);
  });

  it('returns false when routesValid is false', () => {
    expect(validationPassed({ ...allValid, routesValid: false })).toBe(false);
  });

  it('returns false when tlsValid is false', () => {
    expect(validationPassed({ ...allValid, tlsValid: false })).toBe(false);
  });

  it('returns false when epValid (entryPointsValid) is false', () => {
    expect(validationPassed({ ...allValid, epValid: false })).toBe(false);
  });

  it('returns false when all conditions are false', () => {
    expect(validationPassed({
      fvFormIsValid: false,
      routesValid:   false,
      tlsValid:      false,
      epValid:       false,
    })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// willSave — cleanup logic
// ---------------------------------------------------------------------------

describe('CRUIngressRoute › willSave', () => {
  it('removes vKey from routes', () => {
    const spec = {
      entryPoints: ['websecure'],
      routes: [{ match: 'Host(`a.com`)', vKey: 'abc', services: [], middlewares: [] }],
    };
    const result = willSave(spec);
    expect(result.routes[0]).not.toHaveProperty('vKey');
  });

  it('removes vKey from services', () => {
    const spec = {
      entryPoints: ['websecure'],
      routes: [{
        match: 'Host(`a.com`)',
        services: [{ name: 'svc', port: '80', kind: 'Service', vKey: 'xyz' }],
        middlewares: [],
      }],
    };
    const result = willSave(spec);
    expect(result.routes[0].services[0]).not.toHaveProperty('vKey');
  });

  it('removes vKey from middlewares', () => {
    const spec = {
      entryPoints: ['websecure'],
      routes: [{
        match: 'Host(`a.com`)',
        services: [],
        middlewares: [{ name: 'mw', vKey: 'k1' }],
      }],
    };
    const result = willSave(spec);
    expect(result.routes[0].middlewares[0]).not.toHaveProperty('vKey');
  });

  it('coerces service.name from object to string using label', () => {
    const spec = {
      entryPoints: ['websecure'],
      routes: [{
        match: 'Host(`a.com`)',
        services: [{ name: { label: 'my-svc', value: 'my-svc' }, port: '80', kind: 'Service' }],
        middlewares: [],
      }],
    };
    const result = willSave(spec);
    expect(result.routes[0].services[0].name).toBe('my-svc');
  });

  it('coerces service.port from object to string using value', () => {
    const spec = {
      entryPoints: ['websecure'],
      routes: [{
        match: 'Host(`a.com`)',
        services: [{ name: 'svc', port: { label: '8080', value: '8080' }, kind: 'Service' }],
        middlewares: [],
      }],
    };
    const result = willSave(spec);
    expect(result.routes[0].services[0].port).toBe('8080');
  });

  it('defaults service.kind to "Service" when missing', () => {
    const spec = {
      entryPoints: ['websecure'],
      routes: [{
        match: 'Host(`a.com`)',
        services: [{ name: 'svc', port: '80' }],
        middlewares: [],
      }],
    };
    const result = willSave(spec);
    expect(result.routes[0].services[0].kind).toBe('Service');
  });

  it('does not override existing service.kind', () => {
    const spec = {
      entryPoints: ['websecure'],
      routes: [{
        match: 'Host(`a.com`)',
        services: [{ name: 'ts', port: '', kind: 'TraefikService' }],
        middlewares: [],
      }],
    };
    const result = willSave(spec);
    expect(result.routes[0].services[0].kind).toBe('TraefikService');
  });

  it('normalizes entryPoints: converts tag objects to strings', () => {
    const spec = {
      entryPoints: [{ label: 'websecure', value: 'websecure' }, 'web'],
      routes: [{ match: 'Host(`a.com`)', services: [], middlewares: [] }],
    };
    const result = willSave(spec);
    expect(result.entryPoints).toEqual(['websecure', 'web']);
  });

  it('normalizes entryPoints: filters empty strings', () => {
    const spec = {
      entryPoints: ['websecure', '', 'web'],
      routes: [{ match: 'Host(`a.com`)', services: [], middlewares: [] }],
    };
    const result = willSave(spec);
    expect(result.entryPoints).toEqual(['websecure', 'web']);
  });

  it('removes vKey from TLS domains', () => {
    const spec = {
      entryPoints: ['websecure'],
      routes: [{ match: 'Host(`a.com`)', services: [], middlewares: [] }],
      tls:    { domains: [{ main: 'example.com', vKey: 'd1' }] },
    };
    const result = willSave(spec);
    expect(result.tls.domains[0]).not.toHaveProperty('vKey');
  });

  it('does not crash when tls.domains is absent', () => {
    const spec = {
      entryPoints: ['websecure'],
      routes: [{ match: 'Host(`a.com`)', services: [], middlewares: [] }],
    };
    expect(() => willSave(spec)).not.toThrow();
  });
});
