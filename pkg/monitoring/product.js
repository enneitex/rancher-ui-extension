import { MONITORING } from '@shell/config/types';

export function init($plugin, store) {
  const { product, basicType, virtualType } = $plugin.DSL(store, 'vm-monitoring');

  product({
    ifHaveGroup: 'monitoring.coreos.com',
    icon:        'monitoring',
    weight:      89,
  });

  virtualType({
    label:    'Monitoring',
    name:     'vm-monitoring-overview',
    route:    { name: 'c-cluster-vm-monitoring' },
    weight:   110,
    overview: true,
  });

  basicType([
    'vm-monitoring-overview',
    MONITORING.SERVICEMONITOR,
    MONITORING.PODMONITOR,
  ]);
}
