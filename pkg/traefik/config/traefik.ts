export function init($plugin: any, store: any) {
  const {
    product,
    basicType,
    configureType
  } = $plugin.DSL(store, $plugin.name);

  // Registering Traefik as a cluster-level product
  product({
    icon: 'globe',
    inStore: 'cluster',
    inExplorer: true,
    weight: 96,
    showNamespaceFilter: true,
    removeable: false
  });


  // Configure Traefik CRDs as resources
  const traefikTypes = [
    'traefik.io.ingressroute',
    'traefik.io.ingressroutetcp',
    'traefik.io.middleware',
    'traefik.io.tlsoption'
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

  // Register all types in the side menu
  basicType([...traefikTypes]);
}