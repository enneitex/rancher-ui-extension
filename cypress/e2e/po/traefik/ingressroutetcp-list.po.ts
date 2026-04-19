import TraefikBaseListPo from './traefik-base-list.po';

export default class IngressRouteTCPListPo extends TraefikBaseListPo {
  constructor(clusterId = 'local') {
    super(`/c/${ clusterId }/explorer/traefik.io.ingressroutetcp`);
  }
}
