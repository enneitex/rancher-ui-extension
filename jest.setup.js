// Configuration minimale pour supprimer les warnings Vue dans les tests
import { config } from '@vue/test-utils';

// Configuration globale pour Vue Test Utils
config.global.stubs = {
  // Mock pour router-link pour éviter les warnings Vue
  'router-link': {
    name: 'RouterLink',
    template: '<a><slot /></a>',
    props: ['to']
  }
};

// Mock global pour supprimer les warnings de console
global.console = {
  ...console,
  warn: jest.fn() // Supprime les warnings Vue dans les tests
};