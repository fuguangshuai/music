/**
 * 测试环境设置
 * 配置全局测试环境和模拟对象
 */

import { vi } from 'vitest';

// 模拟 Electron 环境
global.window = global.window || {};
global.window.electron = {
  ipcRenderer: {
    send: vi.fn(),
    sendSync: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn()
  }
};

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock;

// 模拟 sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.sessionStorage = sessionStorageMock;

// 模拟 fetch
global.fetch = vi.fn();

// 模拟 URL
global.URL = class URL {
  constructor(public href: string) {}
  toString() { return this.href; }
};

// 模拟 console 方法（可选，用于测试时减少日志输出）
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// 模拟环境变量
vi.mock('import.meta', () => ({
  env: {
    VITE_API: 'http://localhost:3000',
    VITE_API_MUSIC: 'http://localhost:4000',
    VITE_API_MUSIC_BACKUP: 'http://localhost:4001',
    MODE: 'test',
    DEV: false,
    PROD: false
  }
}));

// 模拟 Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  }),
  useRoute: () => ({
    params: {},
    query: {},
    path: '/',
    name: 'test'
  })
}));

// 模拟 Pinia
vi.mock('pinia', () => ({
  defineStore: vi.fn(),
  createPinia: vi.fn(),
  setActivePinia: vi.fn()
}));

// 模拟 Naive UI
vi.mock('naive-ui', () => ({
  useMessage: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }),
  useDialog: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }),
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }),
  useLoadingBar: () => ({
    start: vi.fn(),
    finish: vi.fn(),
    error: vi.fn()
  })
}));

// 清理函数
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
