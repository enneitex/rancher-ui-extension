const NAMESPACE = 'default';

export function makeIngressRoute(name: string, options: {
  namespace?: string;
  match?: string;
  entryPoints?: string[];
  serviceName?: string;
  servicePort?: number | string;
  middlewares?: Array<{ name: string; namespace?: string }>;
  tls?: {
    secretName?: string;
    certResolver?: string;
    options?: { name: string; namespace?: string };
  };
} = {}) {
  const namespace = options.namespace ?? NAMESPACE;

  const route: Record<string, unknown> = {
    kind:     'Rule',
    match:    options.match ?? 'Host(`e2e-test.example.com`)',
    services: [{
      name: options.serviceName ?? 'kubernetes',
      port: options.servicePort ?? 443,
    }],
  };

  if (options.middlewares) {
    route.middlewares = options.middlewares.map((mw) => ({
      name:      mw.name,
      namespace: mw.namespace ?? namespace,
    }));
  }

  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'IngressRoute',
    metadata:   { name, namespace },
    spec:       {
      entryPoints: options.entryPoints ?? ['web'],
      routes:      [route],
      ...(options.tls ? { tls: options.tls } : {}),
    },
  };
}

export function makeIngressRouteTCP(name: string, options: {
  namespace?: string;
  match?: string;
  entryPoints?: string[];
  serviceName?: string;
  servicePort?: number | string;
  middlewares?: Array<{ name: string; namespace?: string }>;
  tls?: {
    passthrough?: boolean;
    secretName?: string;
    options?: { name: string; namespace?: string };
  };
} = {}) {
  const namespace = options.namespace ?? NAMESPACE;

  const route: Record<string, unknown> = {
    match:    options.match ?? 'HostSNI(`*`)',
    services: [{
      name: options.serviceName ?? 'kubernetes',
      port: options.servicePort ?? 443,
    }],
  };

  if (options.middlewares) {
    route.middlewares = options.middlewares.map((mw) => ({
      name:      mw.name,
      namespace: mw.namespace ?? namespace,
    }));
  }

  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'IngressRouteTCP',
    metadata:   { name, namespace },
    spec:       {
      entryPoints: options.entryPoints ?? ['tcpep'],
      routes:      [route],
      ...(options.tls ? { tls: options.tls } : {}),
    },
  };
}
