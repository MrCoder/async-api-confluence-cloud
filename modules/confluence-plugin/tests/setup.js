// Jest setup file for Node.js 22 compatibility
import { config } from '@vue/test-utils';

// Mock global objects that might not be available in test environment
global.crypto = global.crypto || {
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }
};

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost',
    search: '',
    hostname: 'localhost'
  },
  writable: true
});

// Mock AP (Atlassian Connect) for tests
global.AP = {
  request: jest.fn(),
  dialog: {
    create: jest.fn(),
    close: jest.fn()
  },
  events: {
    onPublic: jest.fn(),
    emitPublic: jest.fn()
  },
  resize: jest.fn()
};

// Configure Vue Test Utils
config.global.mocks = {
  $store: {
    state: {},
    commit: jest.fn(),
    dispatch: jest.fn()
  }
};