import { STEVE_AGE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, STEVE_STATE_COL } from '@rancher/shell/config/pagination-table-headers';
import { STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE } from '@shell/config/table-headers';

export const EXPLORER = 'explorer';

// IngressRoute configuration
function configureIngressRoute(plugin, store) {
  const { configureType, headers } = plugin.DSL(store, EXPLORER);

  configureType('traefik.io.ingressroute', {
    isCreatable: true,
    isEditable: true,
    isRemovable: true,
    showAge: true,
    showState: true,
    canYaml: true
  });

  headers('traefik.io.ingressroute',
    // Columns to show when server-side pagination is DISABLED
    [
      STATE,
      NAME_COL,
      NAMESPACE_COL,
      {
        name:     'routes',
        labelKey: 'traefik.headers.routes',
        getValue: row => row.targetRoutes,
        sort:     false,
      },
      {
        name:     'ingressClass',
        labelKey: 'traefik.ingressRoute.ingressClass.label',
        getValue: row => row.ingressClass,
        sort:     'ingressClass',
      },
      {
        name:      'entryPoints',
        labelKey:  'traefik.headers.entryPoints',
        value:     'spec.entryPoints',
        sort:      'spec.entryPoints',
        formatter: 'List',
      },
      AGE,
    ],
    // Columns to show when server-side pagination is ENABLED
    // Only additionalPrinterColumns are indexed, so we can only use those for sorting/searching
    // currently broken https://github.com/rancher/rancher/issues/52121
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL,
      {
        name:   'routes',
        labelKey: 'traefik.headers.routes',
        value:  'spec.routes',
        sort:   false,
        search: false,
      },
      {
        name:   'ingressClass',
        labelKey: 'traefik.ingressRoute.ingressClass.label',
        value:  'metadata.annotations[kubernetes.io/ingress.class]',
        sort:   false,
        search: false,
      },
      {
        name:   'entryPoints',
        labelKey: 'traefik.headers.entryPoints',
        value:  'spec.entryPoints',
        sort:   false,
        search: false,
        formatter: 'List',
      },
      STEVE_AGE_COL,
    ]
  );
}

// IngressRouteTCP configuration
function configureIngressRouteTCP(plugin, store) {
  const { configureType, headers } = plugin.DSL(store, EXPLORER);

  configureType('traefik.io.ingressroutetcp', {
    isCreatable: true,
    isEditable: true,
    isRemovable: true,
    showAge: true,
    showState: true,
    canYaml: true
  });

  headers('traefik.io.ingressroutetcp',
    // Columns to show when server-side pagination is DISABLED
    [
      STATE,
      NAME_COL,
      NAMESPACE_COL,
      {
        name:     'routes',
        labelKey: 'traefik.headers.routes',
        getValue: row => row.targetRoutes,
        sort:     false,
      },
      {
        name:     'ingressClass',
        labelKey: 'traefik.ingressRoute.ingressClass.label',
        getValue: row => row.ingressClass,
        sort:     'ingressClass',
      },
      {
        name:      'entryPoints',
        labelKey:  'traefik.headers.entryPoints',
        value:     'spec.entryPoints',
        sort:      'spec.entryPoints',
        formatter: 'List',
      },
      AGE,
    ],
    // Columns to show when server-side pagination is ENABLED
    // Only additionalPrinterColumns are indexed, so we can only use those for sorting/searching
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL,
      {
        name:   'routes',
        labelKey: 'traefik.headers.routes',
        value:  'spec.routes',
        sort:   false,
        search: false,
      },
      {
        name:   'ingressClass',
        labelKey: 'traefik.ingressRoute.ingressClass.label',
        value:  'metadata.annotations[kubernetes.io/ingress.class]',
        sort:   false,
        search: false,
      },
      {
        name:   'entryPoints',
        labelKey: 'traefik.headers.entryPoints',
        value:  'spec.entryPoints',
        sort:   false,
        search: false,
        formatter: 'List',
      },
      STEVE_AGE_COL,
    ]
  );
}

// Middleware configuration
function configureMiddleware(plugin, store) {
  const { configureType, headers } = plugin.DSL(store, EXPLORER);

  configureType('traefik.io.middleware', {
    isCreatable: true,
    isEditable: true,
    isRemovable: true,
    showAge: true,
    showState: true,
    canYaml: true
  });

  headers('traefik.io.middleware',
    // Columns to show when server-side pagination is DISABLED
    [
      STATE,
      NAME_COL,
      NAMESPACE_COL,
      {
        name:     'types',
        labelKey: 'traefik.middleware.types.label',
        getValue: row => row.middlewareTypes,
        sort:     false,
      },
      AGE,
    ],
    // Columns to show when server-side pagination is ENABLED
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL,
      {
        name:   'types',
        labelKey: 'traefik.middleware.types.label',
        value:  'spec',
        sort:   false,
        search: false,
      },
      STEVE_AGE_COL,
    ]
  );
}

// TLSOption configuration
function configureTLSOption(plugin, store) {
  const { configureType, headers } = plugin.DSL(store, EXPLORER);

  configureType('traefik.io.tlsoption', {
    isCreatable: true,
    isEditable: true,
    isRemovable: true,
    showAge: true,
    showState: true,
    canYaml: true
  });

  headers('traefik.io.tlsoption',
    // Columns to show when server-side pagination is DISABLED
    [
      STATE,
      NAME_COL,
      NAMESPACE_COL,
      {
        name:     'minVersion',
        labelKey: 'traefik.tlsOption.minVersion.label',
        value:    'spec.minVersion',
        sort:     'spec.minVersion',
      },
      {
        name:     'maxVersion',
        labelKey: 'traefik.tlsOption.maxVersion.label',
        value:    'spec.maxVersion',
        sort:     'spec.maxVersion',
      },
      {
        name:  'cipherSuites',
        labelKey: 'traefik.tlsOption.cipherSuites.label',
        value: 'spec.cipherSuites',
        sort:  false,
      },
      AGE,
    ],
    // Columns to show when server-side pagination is ENABLED
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL,
      {
        name:   'minVersion',
        labelKey: 'traefik.tlsOption.minVersion.label',
        value:  'spec.minVersion',
        sort:   false,
        search: false,
      },
      {
        name:   'maxVersion',
        labelKey: 'traefik.tlsOption.maxVersion.label',
        value:  'spec.maxVersion',
        sort:   false,
        search: false,
      },
      {
        name:   'cipherSuites',
        labelKey: 'traefik.tlsOption.cipherSuites.label',
        value:  'spec.cipherSuites',
        sort:   false,
        search: false,
      },
      STEVE_AGE_COL,
    ]
  );
}

// Main initialization function
export function init(plugin, store) {
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
