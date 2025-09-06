const PRODUCT_NAME = 'traefik';

// Use wrapper components to control routing parameters
import ListResource from '../pages/list.vue';
import CreateResource from '../pages/create.vue';
import ViewResource from '../pages/detail.vue';
import ViewNamespacedResource from '../pages/detail-namespaced.vue';

const routes = [
  // Redirect to IngressRoute list (main resource)
  {
    name: `c-cluster-${PRODUCT_NAME}`,
    path: `/c/:cluster/${PRODUCT_NAME}`,
    redirect: (to: any) => ({
      name: `c-cluster-${PRODUCT_NAME}-resource`,
      params: { ...to.params, resource: 'traefik.io.ingressroute' }
    }),
    meta: {
      product: PRODUCT_NAME,
      pkg: PRODUCT_NAME
    }
  },

  // Resource routes - List view
  {
    name: `c-cluster-${PRODUCT_NAME}-resource`,
    path: `/c/:cluster/${PRODUCT_NAME}/:resource`,
    component: ListResource,
    meta: {
      product: PRODUCT_NAME,
      pkg: PRODUCT_NAME
    }
  },

  // Resource routes - Create view
  {
    name: `c-cluster-${PRODUCT_NAME}-resource-create`,
    path: `/c/:cluster/${PRODUCT_NAME}/:resource/create`,
    component: CreateResource,
    meta: {
      product: PRODUCT_NAME,
      pkg: PRODUCT_NAME
    }
  },

  // Resource routes - Detail view (cluster-scoped)
  {
    name: `c-cluster-${PRODUCT_NAME}-resource-id`,
    path: `/c/:cluster/${PRODUCT_NAME}/:resource/:id`,
    component: ViewResource,
    meta: {
      product: PRODUCT_NAME,
      pkg: PRODUCT_NAME
    }
  },

  // Resource routes - Detail view (namespaced)
  {
    name: `c-cluster-${PRODUCT_NAME}-resource-namespace-id`,
    path: `/c/:cluster/${PRODUCT_NAME}/:resource/:namespace/:id`,
    component: ViewNamespacedResource,
    meta: {
      product: PRODUCT_NAME,
      pkg: PRODUCT_NAME
    }
  }
];

export default routes;