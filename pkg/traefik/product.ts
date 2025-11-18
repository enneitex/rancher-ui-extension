export const EXPLORER = 'explorer';

// IngressRoute configuration
function configureIngressRoute(plugin: any, store: any) {
  const { configureType } = plugin.DSL(store, EXPLORER);

  configureType('traefik.io.ingressroute', {
    isCreatable: true,
    isEditable: true,
    isRemovable: true,
    showAge: true,
    showState: true,
    canYaml: true
  });
}

// IngressRouteTCP configuration
function configureIngressRouteTCP(plugin: any, store: any) {
  const { configureType } = plugin.DSL(store, EXPLORER);

  configureType('traefik.io.ingressroutetcp', {
    isCreatable: true,
    isEditable: true,
    isRemovable: true,
    showAge: true,
    showState: true,
    canYaml: true
  });
}

// Middleware configuration
function configureMiddleware(plugin: any, store: any) {
  const { configureType } = plugin.DSL(store, EXPLORER);

  configureType('traefik.io.middleware', {
    isCreatable: true,
    isEditable: true,
    isRemovable: true,
    showAge: true,
    showState: true,
    canYaml: true
  });
}

// TLSOption configuration
function configureTLSOption(plugin: any, store: any) {
  const { configureType } = plugin.DSL(store, EXPLORER);

  configureType('traefik.io.tlsoption', {
    isCreatable: true,
    isEditable: true,
    isRemovable: true,
    showAge: true,
    showState: true,
    canYaml: true
  });
}

// Main initialization function
export function init(plugin: any, store: any) {
  const { basicType, mapGroup, weightGroup } = plugin.DSL(store, EXPLORER);

  // Create "Traefik" group in the side menu
  mapGroup('traefik.io', 'Traefik');
  weightGroup('Traefik', 96, true);
  // Configure each CRD type
  configureIngressRoute(plugin, store);
  configureIngressRouteTCP(plugin, store);
  configureMiddleware(plugin, store);
  configureTLSOption(plugin, store);

  // Add all types to the Traefik group in the side menu
  const traefikTypes = [
    'traefik.io.ingressroute',
    'traefik.io.ingressroutetcp',
    'traefik.io.middleware',
    'traefik.io.tlsoption'
  ];

  basicType(traefikTypes, 'traefik.io');
}
