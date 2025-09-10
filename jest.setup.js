// Configuration minimale pour les tests Jest
// Setup inspiré des patterns du Dashboard Rancher

// Mock des fonctions globales nécessaires
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock global pour les icônes
global.console = {
  ...console,
  // Supprime les warnings des icônes manquantes dans les tests
  warn: jest.fn(),
};