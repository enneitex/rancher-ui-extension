const NAMESPACE = 'default';

export function makeTLSOption(name: string, options: {
  namespace?: string;
  minVersion?: string;
  maxVersion?: string;
  cipherSuites?: string[];
  clientAuth?: {
    clientAuthType?: string;
    secretNames?: string[];
  };
  sniStrict?: boolean;
  disableSessionTickets?: boolean;
  preferServerCipherSuites?: boolean;
  alpnProtocols?: string[];
  curvePreferences?: string[];
} = {}) {
  const namespace = options.namespace ?? NAMESPACE;

  return {
    apiVersion: 'traefik.io/v1alpha1',
    kind:       'TLSOption',
    metadata:   { name, namespace },
    spec:       {
      ...(options.minVersion !== undefined ? { minVersion: options.minVersion } : {}),
      ...(options.maxVersion !== undefined ? { maxVersion: options.maxVersion } : {}),
      ...(options.cipherSuites !== undefined ? { cipherSuites: options.cipherSuites } : {}),
      ...(options.clientAuth !== undefined ? { clientAuth: options.clientAuth } : {}),
      ...(options.sniStrict !== undefined ? { sniStrict: options.sniStrict } : {}),
      ...(options.disableSessionTickets !== undefined ? { disableSessionTickets: options.disableSessionTickets } : {}),
      ...(options.preferServerCipherSuites !== undefined ? { preferServerCipherSuites: options.preferServerCipherSuites } : {}),
      ...(options.alpnProtocols !== undefined ? { alpnProtocols: options.alpnProtocols } : {}),
      ...(options.curvePreferences !== undefined ? { curvePreferences: options.curvePreferences } : {}),
    },
  };
}
