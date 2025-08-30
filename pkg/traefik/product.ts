import { IPlugin } from '@shell/core/types';

const PRODUCT_NAME = 'traefik';

export function init($plugin: IPlugin, store: any) {
  const { 
    product,
    configureType,
    virtualType,
    basicType
  } = $plugin.DSL(store, PRODUCT_NAME);

  // Registering Traefik as a cluster-level product
  product({
    icon: 'globe',
    inStore: 'cluster', // cluster-level product
    weight: 90,
    label: 'Traefik',
    to: {
      name: `c-cluster-${PRODUCT_NAME}-dashboard`
    }
  });
  
  // Configure Traefik CRDs as resources
  const traefikTypes = [
    'traefik.io.ingressroute',
    'traefik.io.ingressroutetcp',
    'traefik.io.ingressrouteudp',
    'traefik.io.middleware',
    'traefik.io.middlewaretcp',
    'traefik.io.tlsoption',
    'traefik.io.tlsstore',
    'traefik.io.traefikservice',
    'traefik.io.serverstransport'
  ];

  // Configure each Traefik resource type
  traefikTypes.forEach(type => {
    configureType(type, {
      isCreatable: true,
      isEditable: true,
      isRemovable: true,
      showAge: true,
      showState: true,
      canYaml: true
    });
  });

  // Create dashboard/home page  
  virtualType({
    labelKey: 'traefik.dashboard.title',
    name: 'dashboard',
    route: {
      name: `c-cluster-${PRODUCT_NAME}-dashboard`
    }
  });

  // Register all types in the side menu
  basicType(['dashboard', ...traefikTypes]);
}