const PRODUCT_NAME = 'traefik';

import TraefikDashboard from '../pages/dashboard.vue';
import ListResource from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import CreateResource from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import ViewResource from '@shell/pages/c/_cluster/_product/_resource/_id.vue';
import ViewNamespacedResource from '@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue';

const routes = [
  // Dashboard/Home page
  {
    name: `c-cluster-${PRODUCT_NAME}-dashboard`,
    path: `/c/:cluster/${PRODUCT_NAME}`,
    component: TraefikDashboard
  },
  
  // Resource routes - List view
  {
    name: `c-cluster-${PRODUCT_NAME}-resource`,
    path: `/c/:cluster/${PRODUCT_NAME}/:resource`,
    component: ListResource
  },
  
  // Resource routes - Create view
  {
    name: `c-cluster-${PRODUCT_NAME}-resource-create`,
    path: `/c/:cluster/${PRODUCT_NAME}/:resource/create`,
    component: CreateResource
  },
  
  // Resource routes - Detail view (cluster-scoped)
  {
    name: `c-cluster-${PRODUCT_NAME}-resource-id`,
    path: `/c/:cluster/${PRODUCT_NAME}/:resource/:id`,
    component: ViewResource
  },
  
  // Resource routes - Detail view (namespaced)
  {
    name: `c-cluster-${PRODUCT_NAME}-resource-namespace-id`,
    path: `/c/:cluster/${PRODUCT_NAME}/:resource/:namespace/:id`,
    component: ViewNamespacedResource
  }
];

export default routes;