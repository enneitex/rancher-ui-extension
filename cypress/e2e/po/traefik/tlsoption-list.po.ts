import TraefikBaseListPo from './traefik-base-list.po';

export default class TLSOptionListPo extends TraefikBaseListPo {
  constructor(clusterId = 'local') {
    super(`/c/${ clusterId }/explorer/traefik.io.tlsoption`);
  }
}
