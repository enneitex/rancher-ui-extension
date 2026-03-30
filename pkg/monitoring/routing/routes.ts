import MonitoringOverview from '../components/MonitoringOverview.vue';

const routes = [
  {
    name:      'c-cluster-vm-monitoring',
    path:      '/c/:cluster/vm-monitoring',
    component: MonitoringOverview,
  },
];

export default routes;
