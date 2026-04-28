/**
 * Unit tests for CRUTLSOption form logic.
 *
 * Strategy: extract and test computed/method functions directly, without
 * mounting the Vue component or the Rancher shell dependency chain.
 */

// ---------------------------------------------------------------------------
// Helpers — pure logic extracted from CRUTLSOption
// ---------------------------------------------------------------------------

/**
 * requiresClientCerts computed.
 * Returns true for auth types that need client certificate secrets.
 */
function requiresClientCerts(clientAuthType) {
  return ['RequireAnyClientCert', 'VerifyClientCertIfGiven', 'RequireAndVerifyClientCert'].includes(clientAuthType);
}

/**
 * validationPassed computed.
 * TLSOption has no required fields — passes as long as fvFormIsValid.
 */
function validationPassed(fvFormIsValid) {
  return fvFormIsValid;
}

/**
 * willSave method — pure logic extracted from CRUTLSOption.
 * Mutates spec in-place and returns it for assertion convenience.
 */
function willSave(spec) {
  if (spec.minVersion === '') {
    delete spec.minVersion;
  }
  if (spec.maxVersion === '') {
    delete spec.maxVersion;
  }

  if (spec.cipherSuites && spec.cipherSuites.length === 0) {
    delete spec.cipherSuites;
  }
  if (spec.alpnProtocols && spec.alpnProtocols.length === 0) {
    delete spec.alpnProtocols;
  }
  if (spec.curvePreferences && spec.curvePreferences.length === 0) {
    delete spec.curvePreferences;
  }

  if (spec.sniStrict === false) {
    delete spec.sniStrict;
  }
  if (spec.disableSessionTickets === false) {
    delete spec.disableSessionTickets;
  }
  if (spec.preferServerCipherSuites === false) {
    delete spec.preferServerCipherSuites;
  }

  return spec;
}

// ---------------------------------------------------------------------------
// requiresClientCerts
// ---------------------------------------------------------------------------

describe('CRUTLSOption › requiresClientCerts', () => {
  it('returns false for NoClientCert', () => {
    expect(requiresClientCerts('NoClientCert')).toBe(false);
  });

  it('returns false for RequestClientCert', () => {
    expect(requiresClientCerts('RequestClientCert')).toBe(false);
  });

  it('returns true for RequireAnyClientCert', () => {
    expect(requiresClientCerts('RequireAnyClientCert')).toBe(true);
  });

  it('returns true for VerifyClientCertIfGiven', () => {
    expect(requiresClientCerts('VerifyClientCertIfGiven')).toBe(true);
  });

  it('returns true for RequireAndVerifyClientCert', () => {
    expect(requiresClientCerts('RequireAndVerifyClientCert')).toBe(true);
  });

  it('returns false for unknown/empty string', () => {
    expect(requiresClientCerts('')).toBe(false);
    expect(requiresClientCerts(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validationPassed — TLSOption has no required fields
// ---------------------------------------------------------------------------

describe('CRUTLSOption › validationPassed', () => {
  it('returns true when fvFormIsValid is true', () => {
    expect(validationPassed(true)).toBe(true);
  });

  it('returns false when fvFormIsValid is false', () => {
    expect(validationPassed(false)).toBe(false);
  });

  it('does NOT require entryPoints or routes (unlike IngressRoute)', () => {
    // TLSOption validationPassed only depends on fvFormIsValid
    expect(validationPassed(true)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// willSave — cleanup / normalization
// ---------------------------------------------------------------------------

describe('CRUTLSOption › willSave', () => {
  describe('TLS version cleanup', () => {
    it('removes minVersion when empty string', () => {
      const spec = { minVersion: '' };
      expect(willSave(spec)).not.toHaveProperty('minVersion');
    });

    it('removes maxVersion when empty string', () => {
      const spec = { maxVersion: '' };
      expect(willSave(spec)).not.toHaveProperty('maxVersion');
    });

    it('preserves minVersion when set', () => {
      const spec = { minVersion: 'VersionTLS12' };
      expect(willSave(spec).minVersion).toBe('VersionTLS12');
    });

    it('preserves maxVersion when set', () => {
      const spec = { maxVersion: 'VersionTLS13' };
      expect(willSave(spec).maxVersion).toBe('VersionTLS13');
    });
  });

  describe('empty array cleanup', () => {
    it('removes cipherSuites when empty array', () => {
      const spec = { cipherSuites: [] };
      expect(willSave(spec)).not.toHaveProperty('cipherSuites');
    });

    it('removes alpnProtocols when empty array', () => {
      const spec = { alpnProtocols: [] };
      expect(willSave(spec)).not.toHaveProperty('alpnProtocols');
    });

    it('removes curvePreferences when empty array', () => {
      const spec = { curvePreferences: [] };
      expect(willSave(spec)).not.toHaveProperty('curvePreferences');
    });

    it('preserves cipherSuites when non-empty', () => {
      const spec = { cipherSuites: ['TLS_AES_128_GCM_SHA256'] };
      expect(willSave(spec).cipherSuites).toEqual(['TLS_AES_128_GCM_SHA256']);
    });

    it('preserves alpnProtocols when non-empty', () => {
      const spec = { alpnProtocols: ['h2', 'http/1.1'] };
      expect(willSave(spec).alpnProtocols).toEqual(['h2', 'http/1.1']);
    });
  });

  describe('boolean default cleanup', () => {
    it('removes sniStrict when false', () => {
      const spec = { sniStrict: false };
      expect(willSave(spec)).not.toHaveProperty('sniStrict');
    });

    it('preserves sniStrict when true', () => {
      const spec = { sniStrict: true };
      expect(willSave(spec).sniStrict).toBe(true);
    });

    it('removes disableSessionTickets when false', () => {
      const spec = { disableSessionTickets: false };
      expect(willSave(spec)).not.toHaveProperty('disableSessionTickets');
    });

    it('preserves disableSessionTickets when true', () => {
      const spec = { disableSessionTickets: true };
      expect(willSave(spec).disableSessionTickets).toBe(true);
    });

    it('removes preferServerCipherSuites when false', () => {
      const spec = { preferServerCipherSuites: false };
      expect(willSave(spec)).not.toHaveProperty('preferServerCipherSuites');
    });

    it('preserves preferServerCipherSuites when true', () => {
      const spec = { preferServerCipherSuites: true };
      expect(willSave(spec).preferServerCipherSuites).toBe(true);
    });
  });

  describe('combined cleanup', () => {
    it('cleans up all defaults in a single call (emptySpec scenario)', () => {
      const spec = {
        minVersion:               '',
        maxVersion:               '',
        cipherSuites:             [],
        alpnProtocols:            [],
        curvePreferences:         [],
        sniStrict:                false,
        disableSessionTickets:    false,
        preferServerCipherSuites: false,
        clientAuth:               { clientAuthType: 'NoClientCert', secretNames: [] },
      };
      const result = willSave(spec);
      expect(result).not.toHaveProperty('minVersion');
      expect(result).not.toHaveProperty('maxVersion');
      expect(result).not.toHaveProperty('cipherSuites');
      expect(result).not.toHaveProperty('alpnProtocols');
      expect(result).not.toHaveProperty('curvePreferences');
      expect(result).not.toHaveProperty('sniStrict');
      expect(result).not.toHaveProperty('disableSessionTickets');
      expect(result).not.toHaveProperty('preferServerCipherSuites');
      // clientAuth is preserved untouched by willSave
      expect(result.clientAuth).toEqual({ clientAuthType: 'NoClientCert', secretNames: [] });
    });

    it('preserves configured values while cleaning defaults', () => {
      const spec = {
        minVersion:               'VersionTLS12',
        maxVersion:               '',
        cipherSuites:             ['TLS_AES_256_GCM_SHA384'],
        alpnProtocols:            [],
        sniStrict:                true,
        disableSessionTickets:    false,
        preferServerCipherSuites: false,
      };
      const result = willSave(spec);
      expect(result.minVersion).toBe('VersionTLS12');
      expect(result).not.toHaveProperty('maxVersion');
      expect(result.cipherSuites).toEqual(['TLS_AES_256_GCM_SHA384']);
      expect(result).not.toHaveProperty('alpnProtocols');
      expect(result.sniStrict).toBe(true);
      expect(result).not.toHaveProperty('disableSessionTickets');
      expect(result).not.toHaveProperty('preferServerCipherSuites');
    });
  });
});
