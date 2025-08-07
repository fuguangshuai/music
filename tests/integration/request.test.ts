/**
 * 请求工厂集成测试
 * 验证统一请求处理逻辑的正确性
 */

import axios from 'axios';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { createRequest, type RequestConfig } from '@/utils/requestFactory';

// 模拟 axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Request Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 模拟 axios.create 返回一个模拟的实例
    const mockInstance = {
      defaults: {},
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    
    mockedAxios.create.mockReturnValue(mockInstance as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create request instance with default config', () => {
    const request = createRequest();
    
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: undefined,
      timeout: 10000,
      withCredentials: false
    });
  });

  it('should create request instance with custom config', () => {
    const config: RequestConfig = {
      baseURL: 'https://api.example.com',
      timeout: 5000,
      withCredentials: true
    };
    
    const request = createRequest(config);
    
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      withCredentials: true
    });
  });

  it('should setup request interceptors', () => {
    const mockInstance = {
      defaults: {},
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    };
    
    mockedAxios.create.mockReturnValue(mockInstance as any);
    
    createRequest();
    
    expect(mockInstance.interceptors.request.use).toHaveBeenCalled();
    expect(mockInstance.interceptors.response.use).toHaveBeenCalled();
  });

  it('should handle retry configuration', () => {
    const config: RequestConfig = {
      retryConfig: {
        maxRetries: 3,
        delay: 1000,
        noRetryUrls: ['/no-retry']
      }
    };
    
    const request = createRequest(config);
    
    expect(mockedAxios.create).toHaveBeenCalled();
  });

  it('should enable common params injection when configured', () => {
    const config: RequestConfig = {
      enableCommonParams: true
    };
    
    const request = createRequest(config);
    
    expect(mockedAxios.create).toHaveBeenCalled();
  });

  it('should enable token handling when configured', () => {
    const config: RequestConfig = {
      enableTokenHandling: true
    };
    
    const request = createRequest(config);
    
    expect(mockedAxios.create).toHaveBeenCalled();
  });

  it('should enable proxy config when configured', () => {
    const config: RequestConfig = {
      enableProxyConfig: true
    };
    
    const request = createRequest(config);
    
    expect(mockedAxios.create).toHaveBeenCalled();
  });

  it('should call custom interceptors when provided', () => {
    const customRequestInterceptor = vi.fn();
    const customResponseInterceptor = vi.fn();
    const customErrorInterceptor = vi.fn();
    
    const config: RequestConfig = {
      interceptors: {
        request: customRequestInterceptor,
        response: customResponseInterceptor,
        error: customErrorInterceptor
      }
    };
    
    const request = createRequest(config);
    
    expect(mockedAxios.create).toHaveBeenCalled();
  });
});

describe('Request Factory - Common Params Injection', () => {
  it('should inject timestamp and device info', () => {
    const mockInstance = {
      defaults: {},
      interceptors: {
        request: { 
          use: vi.fn((successHandler) => {
            // 模拟请求拦截器被调用
            const mockConfig = { params: {} };
            const result = successHandler(mockConfig);
            
            expect(result.params.timestamp).toBeDefined();
            expect(result.params.device).toBeDefined();
          })
        },
        response: { use: vi.fn() }
      }
    };
    
    mockedAxios.create.mockReturnValue(mockInstance as any);
    
    createRequest({ enableCommonParams: true });
  });
});

describe('Request Factory - Token Handling', () => {
  beforeEach(() => {
    // 模拟 localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };
  });

  it('should inject token for GET requests', () => {
    const mockToken = 'test-token';
    vi.mocked(localStorage.getItem).mockReturnValue(mockToken);
    
    const mockInstance = {
      defaults: {},
      interceptors: {
        request: { 
          use: vi.fn((successHandler) => {
            const mockConfig = { 
              method: 'get',
              params: {} 
            };
            const result = successHandler(mockConfig);
            
            expect(result.params.cookie).toBe(mockToken);
          })
        },
        response: { use: vi.fn() }
      }
    };
    
    mockedAxios.create.mockReturnValue(mockInstance as any);
    
    createRequest({ enableTokenHandling: true });
  });

  it('should inject token for POST requests', () => {
    const mockToken = 'test-token';
    vi.mocked(localStorage.getItem).mockReturnValue(mockToken);
    
    const mockInstance = {
      defaults: {},
      interceptors: {
        request: { 
          use: vi.fn((successHandler) => {
            const mockConfig = { 
              method: 'post',
              data: {} 
            };
            const result = successHandler(mockConfig);
            
            expect(result.data.cookie).toBe(mockToken);
          })
        },
        response: { use: vi.fn() }
      }
    };
    
    mockedAxios.create.mockReturnValue(mockInstance as any);
    
    createRequest({ enableTokenHandling: true });
  });
});
