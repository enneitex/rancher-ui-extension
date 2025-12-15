import { STEVE_AGE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, STEVE_STATE_COL } from '@rancher/shell/config/pagination-table-headers';
import { STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE } from '@shell/config/table-headers';

export const EXPLORER = 'explorer';

// ClusterPolicy configuration
function configureClusterPolicy(plugin, store) {
  const { configureType, headers } = plugin.DSL(store, EXPLORER);

  configureType('kyverno.io.clusterpolicy', {
    isCreatable: true,
    isEditable: true,
    isRemovable: true,
    showAge: true,
    showState: true,
    canYaml: true
  });

  headers('kyverno.io.clusterpolicy',
    // Columns to show when server-side pagination is DISABLED
    [
      STATE,
      NAME_COL,
      {
        name:     'background',
        labelKey: 'policyReport.clusterpolicy.background',
        value:    'spec.background',
        sort:     'spec.background',
      },
      {
        name:     'validationFailureAction',
        labelKey: 'policyReport.clusterpolicy.validationFailureAction',
        value:    'spec.validationFailureAction',
        sort:     'spec.validationFailureAction',
      },
      AGE,
    ],
    // Columns to show when server-side pagination is ENABLED
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      {
        name:   'background',
        labelKey: 'policyReport.clusterpolicy.background',
        value:  'spec.background',
        sort:   false,
        search: false,
      },
      {
        name:   'validationFailureAction',
        labelKey: 'policyReport.clusterpolicy.validationFailureAction',
        value:  'spec.validationFailureAction',
        sort:   false,
        search: false,
      },
      STEVE_AGE_COL,
    ]
  );
}

// Policy configuration
function configurePolicy(plugin, store) {
  const { configureType, headers } = plugin.DSL(store, EXPLORER);

  configureType('kyverno.io.policy', {
    isCreatable: true,
    isEditable: true,
    isRemovable: true,
    showAge: true,
    showState: true,
    canYaml: true
  });

  headers('kyverno.io.policy',
    // Columns to show when server-side pagination is DISABLED
    [
      STATE,
      NAME_COL,
      NAMESPACE_COL,
      {
        name:     'background',
        labelKey: 'policyReport.policy.background',
        value:    'spec.background',
        sort:     'spec.background',
      },
      {
        name:     'validationFailureAction',
        labelKey: 'policyReport.policy.validationFailureAction',
        value:    'spec.validationFailureAction',
        sort:     'spec.validationFailureAction',
      },
      AGE,
    ],
    // Columns to show when server-side pagination is ENABLED
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL,
      {
        name:   'background',
        labelKey: 'policyReport.policy.background',
        value:  'spec.background',
        sort:   false,
        search: false,
      },
      {
        name:   'validationFailureAction',
        labelKey: 'policyReport.policy.validationFailureAction',
        value:  'spec.validationFailureAction',
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

  // Create "Compliance" group in the side menu
  mapGroup('kyverno.io', 'Compliance');
  weightGroup('Compliance', 95, true);

  // Configure each CRD type
  configureClusterPolicy(plugin, store);
  configurePolicy(plugin, store);

  // Add all types to the Compliance group in the side menu
  const complianceTypes = [
    'kyverno.io.clusterpolicy',
    'kyverno.io.policy'
  ];

  basicType(complianceTypes, 'kyverno.io');
}
