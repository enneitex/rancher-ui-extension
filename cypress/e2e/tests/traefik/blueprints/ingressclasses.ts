/**
 * Builds an API payload for a networking.k8s.io/v1 IngressClass resource.
 *
 * IngressClass is cluster-scoped (no namespace).
 * The `controller` field is required by the Kubernetes API.
 */
export function makeIngressClass(name: string, options: {
  controller?: string;
} = {}) {
  return {
    apiVersion: 'networking.k8s.io/v1',
    kind:       'IngressClass',
    metadata:   { name },
    spec:       {
      controller: options.controller ?? 'traefik.io/ingress-controller',
    },
  };
}
