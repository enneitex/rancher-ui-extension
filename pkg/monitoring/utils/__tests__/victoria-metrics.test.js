import {
  loadVMConfigFromCluster,
  loadVMDashboardIdsFromCluster,
  generateVMUrl,
  dashboardExists,
  DEFAULT_MONITORING_NAMESPACE,
} from '../victoria-metrics';

const makeStore = (dispatchImpl) => ({ dispatch: jest.fn(dispatchImpl) });

describe('victoria-metrics', () => {
  describe('loadVMConfigFromCluster', () => {
    it('should return parsed config from a valid ConfigMap', async() => {
      const cm = {
        data: {
          'grafana.namespace':       'monitoring',
          'grafana.service':         'grafana-svc',
          'grafana.port':            '3000',
          'alertmanager.namespace':  'monitoring',
          'alertmanager.service':    'alertmanager-svc',
          'alertmanager.port':       '9093',
        },
      };
      const store = makeStore(() => Promise.resolve(cm));

      const result = await loadVMConfigFromCluster(store);

      expect(result).toStrictEqual({
        namespace:    'monitoring',
        service:      'grafana-svc',
        port:         '3000',
        alertmanager: {
          namespace: 'monitoring',
          service:   'alertmanager-svc',
          port:      '9093',
        },
      });
    });

    it('should return null when ConfigMap has no data', async() => {
      const store = makeStore(() => Promise.resolve({ data: null }));

      expect(await loadVMConfigFromCluster(store)).toBeNull();
    });

    it.each([
      ['contains slash', 'monitoring/bad'],
      ['starts with hyphen', '-bad'],
      ['ends with hyphen', 'bad-'],
      ['contains uppercase (fixed: /i flag removed)', 'Monitoring'],
    ])('should fall back to default for invalid dns-label that %s', async(_, invalidValue) => {
      const cm = { data: { 'grafana.namespace': invalidValue } };
      const store = makeStore(() => Promise.resolve(cm));

      const result = await loadVMConfigFromCluster(store);

      expect(result.namespace).toStrictEqual(DEFAULT_MONITORING_NAMESPACE);
    });

    it('should return null when store dispatch throws', async() => {
      const store = makeStore(() => Promise.reject(new Error('not found')));

      expect(await loadVMConfigFromCluster(store)).toBeNull();
    });

    it('should fall back to defaults for port 0 (out of range — fixed)', async() => {
      const cm = { data: { 'grafana.port': '0' } };
      const store = makeStore(() => Promise.resolve(cm));

      const result = await loadVMConfigFromCluster(store);

      expect(result.port).toStrictEqual('8080');
    });

    it.each([
      ['1',     '1'],
      ['1000',  '1000'],
      ['32768', '32768'],
      ['65534', '65534'],
    ])('should accept valid port %s', async(port, expected) => {
      const cm = { data: { 'grafana.port': port } };
      const store = makeStore(() => Promise.resolve(cm));

      const result = await loadVMConfigFromCluster(store);

      expect(result.port).toStrictEqual(expected);
    });

    it('should fall back to defaults for port 99999 (out of range — fixed)', async() => {
      const cm = { data: { 'grafana.port': '99999' } };
      const store = makeStore(() => Promise.resolve(cm));

      const result = await loadVMConfigFromCluster(store);

      expect(result.port).toStrictEqual('8080');
    });

    it('should accept port 65535 (valid upper boundary)', async() => {
      const cm = { data: { 'grafana.port': '65535' } };
      const store = makeStore(() => Promise.resolve(cm));

      const result = await loadVMConfigFromCluster(store);

      expect(result.port).toStrictEqual('65535');
    });

    it('should fall back to default for port 65536 (just above valid range)', async() => {
      const cm = { data: { 'grafana.port': '65536' } };
      const store = makeStore(() => Promise.resolve(cm));

      const result = await loadVMConfigFromCluster(store);

      expect(result.port).toStrictEqual('8080');
    });

    it('should return all defaults when ConfigMap data exists but all keys are missing', async() => {
      const store = makeStore(() => Promise.resolve({ data: {} }));

      const result = await loadVMConfigFromCluster(store);

      expect(result).toStrictEqual({
        namespace:    DEFAULT_MONITORING_NAMESPACE,
        service:      'vmks-grafana',
        port:         '8080',
        alertmanager: {
          namespace: DEFAULT_MONITORING_NAMESPACE,
          service:   'vmks-alertmanager',
          port:      '9093',
        },
      });
    });
  });

  describe('loadVMDashboardIdsFromCluster', () => {
    it('should return custom dashboard IDs when present in ConfigMap', async() => {
      const cm = {
        data: {
          'pod.detailDashboardId':      'custom-pod-detail/custom-pod-detail',
          'pod.summaryDashboardId':     'custom-pod-summary/custom-pod-summary',
          'node.detailDashboardId':     'custom-node-detail/custom-node-detail',
          'node.summaryDashboardId':    'custom-node-summary/custom-node-summary',
          'workload.detailDashboardId': 'custom-wl-detail/custom-wl-detail',
          'workload.summaryDashboardId':'custom-wl-summary/custom-wl-summary',
        },
      };
      const store = makeStore(() => Promise.resolve(cm));

      const result = await loadVMDashboardIdsFromCluster(store);

      expect(result.pod.detailDashboardId).toStrictEqual('custom-pod-detail/custom-pod-detail');
      expect(result.node.detailDashboardId).toStrictEqual('custom-node-detail/custom-node-detail');
      expect(result.workload.detailDashboardId).toStrictEqual('custom-wl-detail/custom-wl-detail');
    });

    it('should return hardcoded defaults when ConfigMap is missing', async() => {
      const store = makeStore(() => Promise.reject(new Error('not found')));

      const result = await loadVMDashboardIdsFromCluster(store);

      expect(result.pod.detailDashboardId).toStrictEqual('rancher-pod-containers-1/rancher-pod-containers');
      expect(result.pod.summaryDashboardId).toStrictEqual('rancher-pod-1/rancher-pod');
    });
  });

  describe('generateVMUrl', () => {
    it('should build the correct proxy URL format', () => {
      const url = generateVMUrl('monitoring', 'grafana-svc', '3000', 'k8s-pods/kubernetes-pods');

      expect(url).toStrictEqual(
        '/api/v1/namespaces/monitoring/services/http:grafana-svc:3000/proxy/d/k8s-pods/kubernetes-pods'
      );
    });
  });

  describe('dashboardExists', () => {
    const config = { namespace: 'monitoring', service: 'grafana-svc', port: '3000' };

    it('should return true when the cluster request succeeds', async() => {
      const store = makeStore(() => Promise.resolve({}));

      expect(await dashboardExists(store, 'local', config, 'uid123/dashboard-slug')).toStrictEqual(true);
    });

    it('should return false when the cluster request throws', async() => {
      const store = makeStore(() => Promise.reject(new Error('404')));

      expect(await dashboardExists(store, 'local', config, 'uid123/dashboard-slug')).toStrictEqual(false);
    });

    it('should build the URL without cluster prefix for local cluster', async() => {
      const store = makeStore(() => Promise.resolve({}));

      await dashboardExists(store, 'local', config, 'myuid/my-dash');

      expect(store.dispatch).toHaveBeenCalledWith('cluster/request', {
        url:                  '/api/v1/namespaces/monitoring/services/http:grafana-svc:3000/proxy/api/dashboards/uid/myuid',
        redirectUnauthorized: false,
      });
    });

    it('should build the URL with /k8s/clusters prefix for a non-local cluster', async() => {
      const store = makeStore(() => Promise.resolve({}));

      await dashboardExists(store, 'c-abc123', config, 'myuid/my-dash');

      expect(store.dispatch).toHaveBeenCalledWith('cluster/request', {
        url:                  '/k8s/clusters/c-abc123/api/v1/namespaces/monitoring/services/http:grafana-svc:3000/proxy/api/dashboards/uid/myuid',
        redirectUnauthorized: false,
      });
    });
  });
});
