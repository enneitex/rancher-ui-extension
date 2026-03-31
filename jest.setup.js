import { config } from '@vue/test-utils';

config.global.mocks['t'] = (key) => key;
config.global.mocks['$store'] = { getters: {}, dispatch: jest.fn(), commit: jest.fn() };
config.global.mocks['$route'] = { params: { cluster: 'local' } };
