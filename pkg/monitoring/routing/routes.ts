import MonitoringIndex    from '../pages/index.vue';
import MonitorIndex       from '../pages/monitor/index.vue';
import RouteReceiverIndex  from '../pages/route-receiver/index.vue';
import RouteReceiverCreate from '../pages/route-receiver/create.vue';
import RouteReceiverDetail from '../pages/route-receiver/_id.vue';

const routes = [
  {
    name:      'c-cluster-monitoring',
    path:      '/c/:cluster/monitoring',
    component: MonitoringIndex,
  },
  {
    name:      'c-cluster-monitoring-monitor',
    path:      '/c/:cluster/monitoring/monitor',
    component: MonitorIndex,
  },
  {
    name:      'c-cluster-monitoring-monitor-create',
    path:      '/c/:cluster/monitoring/monitor/create',
    component: () => import('@shell/pages/c/_cluster/monitoring/monitor/create.vue'),
  },
  {
    name:      'c-cluster-monitoring-monitor-namespace-id',
    path:      '/c/:cluster/monitoring/monitor/:namespace/:id',
    component: () => import('@shell/pages/c/_cluster/monitoring/monitor/_namespace/_id.vue'),
  },
  {
    name:      'c-cluster-monitoring-route-receiver',
    path:      '/c/:cluster/monitoring/route-receiver',
    component: RouteReceiverIndex,
  },
  {
    name:      'c-cluster-monitoring-route-receiver-create',
    path:      '/c/:cluster/monitoring/route-receiver/create',
    component: RouteReceiverCreate,
  },
  {
    name:      'c-cluster-monitoring-route-receiver-id',
    path:      '/c/:cluster/monitoring/route-receiver/:id',
    component: RouteReceiverDetail,
  },
];

export default routes;
