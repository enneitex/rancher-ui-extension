// Tests unitaires pour le composant HostMatch.vue
// Monte réellement le composant Vue pour une couverture de code complète

const { mount } = require('@vue/test-utils');
const HostMatch = require('../HostMatch.vue').default;

describe('component: HostMatch formatter', () => {
  
  // Helper pour créer un mock store
  const createMockStore = () => ({
    getters: {
      'i18n/t': jest.fn((key) => key)
    }
  });

  it.each([
    // [matchRule, hasWebsecure, tlsEnabled, resource, expectedUrl, shouldHaveLink, description]
    ['Host(`example.com`)', false, false, null, 'http://example.com', true, 'Simple HTTP host'],
    ['Host(`example.com`)', true, false, null, 'https://example.com', true, 'HTTPS with websecure'],
    ['Host(`example.com`)', false, true, null, 'https://example.com', true, 'HTTPS with TLS enabled'],
    ['Host(`example.com`) && Path(`/api`)', false, false, null, 'http://example.com/api', true, 'Host with path'],
    ['Host(`example.com`) && PathPrefix(`/admin`)', true, false, null, 'https://example.com/admin', true, 'Host with prefix'],
    ['Host(`app1.com,app2.com`)', false, false, null, 'http://app1.com', true, 'Multiple hosts'],
    ['PathPrefix(`/api`)', false, false, null, null, false, 'Path only - no link'],
    ['InvalidRule', false, false, null, null, false, 'Invalid rule'],
    ['', false, false, null, null, false, 'Empty rule']
  ])('should handle match rule: %s (%s)', async (matchRule, hasWebsecure, tlsEnabled, resource, expectedUrl, shouldHaveLink) => {
    const mockRow = {
      match: matchRule,
      hasWebsecure,
      tlsEnabled,
      resource
    };
    
    const wrapper = mount(HostMatch, {
      props: { row: mockRow },
      global: {
        mocks: {
          $store: createMockStore()
        }
      }
    });

    if (shouldHaveLink) {
      const link = wrapper.find('a');
      expect(link.exists()).toBe(true);
      expect(link.attributes('href')).toBe(expectedUrl);
      expect(link.attributes('target')).toBe('_blank');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
      expect(wrapper.find('.icon-external-link').exists()).toBe(true);
    } else {
      expect(wrapper.find('a').exists()).toBe(false);
      expect(wrapper.find('span').exists()).toBe(true);
    }
  });

  it.each([
    'value',
    'row'
  ])('should accept data from %s prop', async (propName) => {
    const testData = propName === 'value' 
      ? 'Host(`test.com`)'
      : { match: 'Host(`test.com`)' };
      
    const wrapper = mount(HostMatch, {
      props: { [propName]: testData },
      global: {
        mocks: {
          $store: createMockStore()
        }
      }
    });

    const element = wrapper.find('span, a');
    expect(element.exists()).toBe(true);
  });

  it('should render link with correct attributes', async () => {
    const mockRow = {
      match: 'Host(`example.com`)',
      hasWebsecure: false
    };
    
    const wrapper = mount(HostMatch, {
      props: { row: mockRow },
      global: {
        mocks: {
          $store: createMockStore()
        }
      }
    });

    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
    expect(link.attributes('title')).toContain('Ouvrir http://example.com');
    expect(link.text()).toContain('Host(`example.com`)');
    expect(wrapper.find('.icon-external-link').exists()).toBe(true);
  });

  it('should display fallback text when no valid URL', async () => {
    const mockRow = {
      match: 'PathPrefix(`/api`)', // Pas de Host donc pas de lien
      hasWebsecure: false
    };
    
    const wrapper = mount(HostMatch, {
      props: { row: mockRow },
      global: {
        mocks: {
          $store: createMockStore()
        }
      }
    });

    expect(wrapper.find('span').exists()).toBe(true);
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.text()).toContain('PathPrefix(`/api`)');
    expect(wrapper.classes()).toContain('host-text');
  });

  it('should handle empty or missing data gracefully', async () => {
    const wrapper = mount(HostMatch, {
      props: { row: {} },
      global: {
        mocks: {
          $store: createMockStore()
        }
      }
    });

    expect(wrapper.find('span').exists()).toBe(true);
    expect(wrapper.text()).toBe('-');
  });

  it('should prioritize row.match over value prop', async () => {
    const mockRow = {
      match: 'Host(`priority.com`)',
      hasWebsecure: false
    };
    
    const wrapper = mount(HostMatch, {
      props: { 
        value: 'Host(`ignored.com`)',
        row: mockRow
      },
      global: {
        mocks: {
          $store: createMockStore()
        }
      }
    });

    const link = wrapper.find('a');
    expect(link.attributes('href')).toBe('http://priority.com');
  });

  it('should call hasTLS method correctly', async () => {
    const mockRowWithTLS = {
      match: 'Host(`example.com`)',
      resource: {
        spec: {
          tls: { secretName: 'my-secret' }
        }
      }
    };
    
    const wrapper = mount(HostMatch, {
      props: { row: mockRowWithTLS },
      global: {
        mocks: {
          $store: createMockStore()
        }
      }
    });

    const link = wrapper.find('a');
    expect(link.attributes('href')).toBe('https://example.com');
  });

  it('should handle complex host patterns with single host', async () => {
    const mockRow = {
      match: 'Host(`sub1.example.com`) && PathPrefix(`/v1/api`)',
      hasWebsecure: true
    };
    
    const wrapper = mount(HostMatch, {
      props: { row: mockRow },
      global: {
        mocks: {
          $store: createMockStore()
        }
      }
    });

    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://sub1.example.com/v1/api');
  });
});