// Configuration Jest pour les tests de l'extension Traefik avec support Vue
// Utilise les outils de @rancher/shell pour la transformation

const path = require('path');

module.exports = {
  // Environnement de test
  testEnvironment: 'jsdom',
  
  // Dossier racine pour les tests
  testMatch: [
    '<rootDir>/pkg/**/__tests__/**/*.test.js',
    '<rootDir>/pkg/**/__tests__/**/*.test.ts'
  ],

  // Mapper les modules pour l'extension Traefik
  moduleNameMapper: {
    '^@shell/(.*)$': '<rootDir>/node_modules/@rancher/shell/$1',
    '^@traefik/(.*)$': '<rootDir>/pkg/traefik/$1',
    // Mock des assets pour éviter les erreurs
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },

  // Extensions de fichiers
  moduleFileExtensions: ['js', 'ts', 'vue'],

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
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  },

  // Setup pour les tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Couverture de code
  collectCoverageFrom: [
    'pkg/traefik/**/*.{js,ts,vue}',
    '!pkg/traefik/**/*.d.ts',
    '!pkg/traefik/**/__tests__/**',
    '!pkg/traefik/**/node_modules/**'
  ],

  // Ignorer certains modules pour la transformation
  transformIgnorePatterns: [
    'node_modules/(?!(@rancher|@vue)/)'
  ]
};