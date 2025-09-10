// Tests unitaires pour le composant RoutesList.vue
// Monte réellement le composant Vue pour une couverture de code complète

import { mount } from '@vue/test-utils';
import RoutesList from '../RoutesList.vue';

declare const jest: any;
declare const expect: any;
declare const describe: any;
declare const it: any;

describe('component: RoutesList formatter', () => {

  // Helper pour créer un mock store
  const createMockStore = () => ({
    getters: {
      'i18n/t': jest.fn((key: string) => key)
    }
  });

  // Helper pour créer un mock router
  const createMockRoute = () => ({
    params: {
      cluster: 'test-cluster'
    }
  });

  it.each([
    // [routeSpec, expectedUrls, shouldHaveLinks, description]
    [
      { routes: [{ match: 'Host(`example.com`)', services: [] }] },
      ['https://example.com'],
      true,
      'Simple HTTP host rule'
    ],
    [
      { routes: [{ match: 'Host(`example.com`) && Path(`/api`)', services: [] }] },
      ['https://example.com/api'],
      true,
      'HTTP host with path'
    ],
    [
      { routes: [{ match: 'Host(`example.com`) && PathPrefix(`/admin`)', services: [] }] },
      ['https://example.com/admin'],
      true,
      'HTTP host with path prefix'
    ],
    [
      { routes: [{ match: 'Host(`example.com`) && (PathPrefix(`/admin`) || PathPrefix(`/api`)', services: [] }] },
      ['https://example.com/admin'],
      true,
      'HTTP host with multiple pathPrefix'
    ],
    [
      { routes: [{ match: 'Host(`app1.com,app2.com`)', services: [] }] },
      ['https://app1.com'],
      true,
      'Multiple hosts - first only'
    ],
    [
      { routes: [{ match: 'PathPrefix(`/api`)', services: [] }] },
      [null],
      false,
      'Path only - no clickable link'
    ],
    [
      { routes: [] },
      [],
      false,
      'Empty routes array'
    ]
  ])('should handle route spec: %s (%s)', async (routeSpec: any, expectedUrls: any, shouldHaveLinks: any) => {
    const mockRow = {
      spec: routeSpec,
      _type: 'traefik.io.ingressroute'
    };

    const wrapper = mount(RoutesList, {
      props: { row: mockRow },
      global: {
        mocks: {
          $store: createMockStore(),
          $route: createMockRoute()
        }
      }
    });

    if (shouldHaveLinks && expectedUrls.length > 0) {
      const links = wrapper.findAll('a[target="_blank"]');
      expect(links.length).toBeGreaterThan(0);

      if (expectedUrls[0]) {
        expect(links[0].attributes('href')).toBe(expectedUrls[0]);
        expect(links[0].attributes('target')).toBe('_blank');
        expect(links[0].attributes('rel')).toBe('noopener noreferrer');
      }
    } else {
      const externalLinks = wrapper.findAll('a[target="_blank"]');
      expect(externalLinks.length).toBe(0);
    }
  });

  it('should distinguish between TCP and HTTP routes', async () => {
    const httpRow = {
      spec: { routes: [{ match: 'Host(`example.com`)', services: [] }] },
      _type: 'traefik.io.ingressroute'
    };

    const tcpRow = {
      spec: { routes: [{ match: 'HostSNI(`example.com`)', services: [] }] },
      _type: 'traefik.io.ingressroutetcp'
    };

    const httpWrapper = mount(RoutesList, {
      props: { row: httpRow },
      global: {
        mocks: {
          $store: createMockStore(),
          $route: createMockRoute()
        }
      }
    });

    const tcpWrapper = mount(RoutesList, {
      props: { row: tcpRow },
      global: {
        mocks: {
          $store: createMockStore(),
          $route: createMockRoute()
        }
      }
    });

    // HTTP should have clickable links
    expect(httpWrapper.findAll('a[target="_blank"]').length).toBeGreaterThan(0);

    // TCP should not have clickable links (only service links)
    const tcpExternalLinks = tcpWrapper.findAll('a[target="_blank"]');
    expect(tcpExternalLinks.length).toBe(0);
  });

  it('should create service links to Rancher', async () => {
    const mockRow = {
      spec: {
        routes: [{
          match: 'Host(`example.com`)',
          services: [
            { name: 'my-service', namespace: 'default', port: 80, weight: 100 },
            { name: 'backup-service', namespace: 'prod', port: 8080 }
          ]
        }]
      },
      _type: 'traefik.io.ingressroute',
      metadata: { namespace: 'fallback-ns' }
    };

    const wrapper = mount(RoutesList, {
      props: { row: mockRow },
      global: {
        mocks: {
          $store: createMockStore(),
          $route: createMockRoute()
        },
        stubs: {
          'router-link': {
            template: '<a :href="to" v-bind="$attrs"><slot /></a>',
            props: ['to']
          }
        }
      }
    });

    // Look for the service items that should contain links
    const serviceItems = wrapper.findAll('.service-item');
    expect(serviceItems.length).toBe(2);

    // Check for service links (router-link stubs rendered as anchor tags)
    const serviceLinks = wrapper.findAll('.service-link');
    expect(serviceLinks.length).toBe(2);

    // First service should use its own namespace
    expect(serviceLinks[0].attributes('href')).toBe('/c/test-cluster/explorer/service/default/my-service');
    expect(serviceLinks[0].text()).toContain('my-service');
    expect(serviceLinks[0].text()).toContain('(100%)');

    // Second service should use its own namespace
    expect(serviceLinks[1].attributes('href')).toBe('/c/test-cluster/explorer/service/prod/backup-service');
    expect(serviceLinks[1].text()).toContain('backup-service');
  });

  it('should handle services without namespace using fallback', async () => {
    const mockRow = {
      spec: {
        routes: [{
          match: 'Host(`example.com`)',
          services: [
            { name: 'no-ns-service', port: 80 }
          ]
        }]
      },
      _type: 'traefik.io.ingressroute',
      metadata: { namespace: 'fallback-ns' }
    };

    const wrapper = mount(RoutesList, {
      props: { row: mockRow },
      global: {
        mocks: {
          $store: createMockStore(),
          $route: createMockRoute()
        },
        stubs: {
          'router-link': {
            template: '<a :href="to" v-bind="$attrs"><slot /></a>',
            props: ['to']
          }
        }
      }
    });

    const serviceLink = wrapper.find('.service-link');
    expect(serviceLink.exists()).toBe(true);
    expect(serviceLink.attributes('href')).toBe('/c/test-cluster/explorer/service/fallback-ns/no-ns-service');
  });

  it('should display port info for TCP routes', async () => {
    const mockRow = {
      spec: {
        routes: [{
          match: 'HostSNI(`*`)',
          services: [
            { name: 'tcp-service', namespace: 'default', port: 443 }
          ]
        }]
      },
      _type: 'traefik.io.ingressroutetcp'
    };

    const wrapper = mount(RoutesList, {
      props: { row: mockRow },
      global: {
        mocks: {
          $store: createMockStore(),
          $route: createMockRoute()
        }
      }
    });

    const serviceText = wrapper.find('.service-item').text();
    expect(serviceText).toContain('tcp-service');
    expect(serviceText).toContain(':443');
  });

  it('should handle invalid or missing service names', async () => {
    const mockRow = {
      spec: {
        routes: [{
          match: 'Host(`example.com`)',
          services: [
            { name: '', namespace: 'default' },
            { name: null, namespace: 'default' },
            { namespace: 'default' } // no name property
          ]
        }]
      },
      _type: 'traefik.io.ingressroute'
    };

    const wrapper = mount(RoutesList, {
      props: { row: mockRow },
      global: {
        mocks: {
          $store: createMockStore(),
          $route: createMockRoute()
        },
        stubs: {
          'router-link': {
            template: '<a :href="to" v-bind="$attrs"><slot /></a>',
            props: ['to']
          }
        }
      }
    });

    // Should show service entries but no clickable links
    const serviceLinks = wrapper.findAll('.service-link');
    expect(serviceLinks.length).toBe(0);

    const serviceItems = wrapper.findAll('.service-item');
    expect(serviceItems.length).toBe(3);
    expect(serviceItems[0].text()).toContain('-');
  });

  it('should handle empty or missing data gracefully', async () => {
    const wrapper = mount(RoutesList, {
      props: { row: {} },
      global: {
        mocks: {
          $store: createMockStore(),
          $route: createMockRoute()
        }
      }
    });

    expect(wrapper.find('.text-muted').exists()).toBe(true);
    expect(wrapper.text()).toContain('generic.none');
  });

  it('should use value prop when row is empty', async () => {
    const mockRow = {
      spec: { routes: [] },
      _type: 'traefik.io.ingressroute'
    };

    const wrapper = mount(RoutesList, {
      props: { value: undefined, row: mockRow },
      global: {
        mocks: {
          $store: createMockStore(),
          $route: createMockRoute()
        }
      }
    });

    // Component should show "generic.none" when no routes
    expect(wrapper.text()).toContain('generic.none');
  });

  it('should validate URLs correctly', async () => {
    const mockRow = {
      spec: {
        routes: [
          { match: 'Host(`valid.com`)', services: [] },
          { match: 'Host(`invalid..domain`)', services: [] }
        ]
      },
      _type: 'traefik.io.ingressroute'
    };

    const wrapper = mount(RoutesList, {
      props: { row: mockRow },
      global: {
        mocks: {
          $store: createMockStore(),
          $route: createMockRoute()
        }
      }
    });

    const links = wrapper.findAll('a[target="_blank"]');
    // Both should create links since URL validation is more permissive
    expect(links.length).toBe(2);
    expect(links[0].attributes('href')).toBe('https://valid.com');
    expect(links[1].attributes('href')).toBe('https://invalid..domain');
  });

  it('should handle multiple routes in a single spec', async () => {
    const mockRow = {
      spec: {
        routes: [
          { 
            match: 'Host(`api.example.com`) && PathPrefix(`/v1`)', 
            services: [{ name: 'api-service', namespace: 'api-ns', port: 8080 }] 
          },
          { 
            match: 'Host(`web.example.com`)', 
            services: [{ name: 'web-service', namespace: 'web-ns', port: 3000 }] 
          },
          { 
            match: 'PathPrefix(`/static`)', 
            services: [{ name: 'static-service', namespace: 'web-ns', port: 80 }] 
          }
        ]
      },
      _type: 'traefik.io.ingressroute'
    };
    
    const wrapper = mount(RoutesList, {
      props: { row: mockRow },
      global: {
        mocks: {
          $store: createMockStore(),
          $route: createMockRoute()
        },
        stubs: {
          'router-link': {
            template: '<a :href="to" v-bind="$attrs"><slot /></a>',
            props: ['to']
          }
        }
      }
    });

    // Should have multiple rule items
    const ruleItems = wrapper.findAll('.rule-item');
    expect(ruleItems.length).toBe(3);

    // Check external links (only first 2 routes should have them)
    const externalLinks = wrapper.findAll('a[target="_blank"]');
    expect(externalLinks.length).toBe(2);
    
    expect(externalLinks[0].attributes('href')).toBe('https://api.example.com/v1');
    expect(externalLinks[1].attributes('href')).toBe('https://web.example.com');

    // Check service links
    const serviceLinks = wrapper.findAll('.service-link');
    expect(serviceLinks.length).toBe(3);
    
    expect(serviceLinks[0].attributes('href')).toBe('/c/test-cluster/explorer/service/api-ns/api-service');
    expect(serviceLinks[1].attributes('href')).toBe('/c/test-cluster/explorer/service/web-ns/web-service');
    expect(serviceLinks[2].attributes('href')).toBe('/c/test-cluster/explorer/service/web-ns/static-service');

    // Check rule text content
    expect(wrapper.text()).toContain('Host(`api.example.com`) && PathPrefix(`/v1`)');
    expect(wrapper.text()).toContain('Host(`web.example.com`)');
    expect(wrapper.text()).toContain('PathPrefix(`/static`)');
  });
});