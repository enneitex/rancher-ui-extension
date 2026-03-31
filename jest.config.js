process.env.TZ = 'UTC';

module.exports = {
  testEnvironment:    'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  watchman:           false,

  moduleFileExtensions: ['js', 'json', 'vue', 'ts'],

  moduleNameMapper: {
    '^@shell/(.*)$':                                '<rootDir>/node_modules/@rancher/shell/$1',
    '^~/(.*)$':                                     '<rootDir>/$1',
    '^@/(.*)$':                                     '<rootDir>/$1',
    '\\.(jpe?g|png|gif|webp|svg|woff2?|eot|ttf)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // CRITICAL: @rancher/shell uses ESM (import/export) — must transform
  transformIgnorePatterns: ['/node_modules/(?!@rancher/shell/)'],

  transform: {
    '^.+\\.js$':   '<rootDir>/node_modules/babel-jest',
    '.*\\.vue$':   '<rootDir>/node_modules/@vue/vue3-jest',
    '^.+\\.tsx?$': '<rootDir>/node_modules/babel-jest',
  },

  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    // @vue/vue3-jest requires ts-jest (not installed); Vue SFC tests are out of scope for this PR
    '<rootDir>/pkg/traefik/formatters/__tests__/RoutesList.test.ts',
  ],

  // Prevent haste module naming collisions between pkg/ and dist-pkg/
  modulePathIgnorePatterns: ['<rootDir>/dist-pkg/'],
};
