import TraefikBaseListPo from './traefik-base-list.po';

export default class MiddlewareListPo extends TraefikBaseListPo {
  constructor(clusterId = 'local') {
    super(`/c/${ clusterId }/explorer/traefik.io.middleware`);
  }
}
