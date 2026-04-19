const NAMESPACE = 'default';

export function makeMiddlewareStripPrefix(name: string, prefixes: string[] = ['/api'], namespace = NAMESPACE) {
  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'Middleware',
    metadata:   { name, namespace },
    spec:       {
      stripPrefix: { prefixes },
    },
  };
}

export function makeMiddlewareBasicAuth(name: string, secret = 'my-auth-secret', namespace = NAMESPACE) {
  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'Middleware',
    metadata:   { name, namespace },
    spec:       {
      basicAuth: { secret },
    },
  };
}

export function makeMiddlewareMultiType(name: string, namespace = NAMESPACE) {
  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'Middleware',
    metadata:   { name, namespace },
    spec:       {
      stripPrefix: { prefixes: ['/api'] },
      compress:    {},
    },
  };
}

export function makeMiddlewareTCP(name: string, namespace = NAMESPACE) {
  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'MiddlewareTCP',
    metadata:   { name, namespace },
    spec:       {
      // ipAllowList is a common TCP middleware — always available without additional deps
      ipAllowList: { sourceRange: ['127.0.0.1/32'] },
    },
  };
}

/**
 * Build a minimal kubernetes.io/tls Secret body.
 * The cert/key data are base64-encoded placeholder strings — sufficient for UI tests
 * that only need the secret to appear in a dropdown, not to actually terminate TLS.
 */
export function makeK8sTLSSecret(name: string, namespace = NAMESPACE) {
  return {
    apiVersion: 'v1',
    kind:       'Secret',
    metadata:   { name, namespace },
    type:       'kubernetes.io/tls',
    data:       {
      // Minimal valid base64 placeholders accepted by the k8s API for UI-only tests
      'tls.crt': 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t',
      'tls.key': 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t',
    },
  };
}
