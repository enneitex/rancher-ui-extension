import { STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE } from '@shell/config/table-headers';

export const EXPLORER = 'explorer';

export function init(plugin, store) {
  const { basicType, configureType, mapGroup, weightGroup } = plugin.DSL(store, EXPLORER);

  mapGroup('postgresql.cnpg.io', 'CloudNativePG');
  weightGroup('CloudNativePG', 90, true);

  configureType('postgresql.cnpg.io.cluster', {
    isCreatable: true,
    isEditable:  true,
    isRemovable: true,
    showAge:     true,
    showState:   true,
    canYaml:     true,
  });

  basicType(['postgresql.cnpg.io.cluster'], 'postgresql.cnpg.io');
}
