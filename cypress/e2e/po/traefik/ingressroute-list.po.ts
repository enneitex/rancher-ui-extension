import TraefikBaseListPo from './traefik-base-list.po';

export default class IngressRouteListPo extends TraefikBaseListPo {
  constructor(clusterId = 'local') {
    super(`/c/${ clusterId }/explorer/traefik.io.ingressroute`);
  }
}
