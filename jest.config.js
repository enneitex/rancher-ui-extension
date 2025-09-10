// Configuration Jest simplifiée pour les tests de formatters uniquement

module.exports = {
  // Environnement de test
  testEnvironment: 'jsdom',
  
  // Tests uniquement pour les formatters
  testMatch: [
    '<rootDir>/pkg/traefik/formatters/__tests__/**/*.test.{js,ts}'
  ],

  // Mapper les modules pour l'extension Traefik
  moduleNameMapper: {
    '^@shell/(.*)$': '<rootDir>/node_modules/@rancher/shell/$1',
    '^@traefik/(.*)$': '<rootDir>/pkg/traefik/$1',
    // Mock des assets pour éviter les erreurs
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(svg|png|jpg|jpeg|gif)$': 'jest-transform-stub'
  },

  // Extensions de fichiers
  moduleFileExtensions: ['js', 'ts', 'vue', 'json'],

  // Transformations pour Vue et TypeScript
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Configuration TypeScript pour ts-jest
  globals: {
    'ts-jest': {
      useESM: false,
      tsconfig: {
        target: 'ES2015',
        module: 'commonjs',
        types: ['jest', 'node'],
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node'
      }
    }
  },

  // Couverture de code pour les formatters uniquement
  collectCoverageFrom: [
    'pkg/traefik/formatters/**/*.{js,ts,vue}',
    '!pkg/traefik/formatters/**/*.d.ts',
    '!pkg/traefik/formatters/**/__tests__/**'
  ],

  // Configuration de la couverture
  coverageReporters: ['text'],
  coverageDirectory: 'coverage',

  // Setup pour les tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Options de test
  verbose: true,
  testTimeout: 10000,

  // Pattern pour ignorer certains fichiers
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ]
};