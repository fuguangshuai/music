/**
 * 统一API工厂
 *
 * 目标：整合项目中重复的API模式，提供统一的API创建和管理
 *
 * 整合内容：
 * 1. API请求模式（来自 home.ts, mv.ts, list.ts 等）
 * 2. 参数验证和处理
 * 3. 响应处理和错误处理
 * 4. 缓存策略
 * 5. 重试逻辑
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import type {
  ApiResponse,
  MusicApiParams,
  PaginationParams,
  SearchParams,
  UserApiParams
} from '../types/consolidated-types';
import request from './request';
import { unifiedHandleApiResponse, unifiedRetry, unifiedSafeApiCall } from './unified-helpers';

// ============================================================================
// 统一的API工厂类
// ============================================================================

/**
 * API端点配置接口
 */
interface ApiEndpointConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cache?: boolean;
  cacheTTL?: number;
  retry?: boolean;
  retryOptions?: any;
  transform?: (data: any) => any;
}

/**
 * API工厂类 - 统一创建和管理API函数
 */
export class UnifiedApiFactory {
  private endpoints = new Map<string, ApiEndpointConfig>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * 注册API端点
   */
  register(name: string, config: ApiEndpointConfig): void {
    this.endpoints.set(name, config);
  }

  /**
   * 批量注册API端点
   */
  registerBatch(endpoints: Record<string, ApiEndpointConfig>): void {
    Object.entries(endpoints).forEach(([name, config]) => {
      this.register(name, config);
    });
  }

  /**
   * 创建API函数
   */
  create<TParams = any, TResponse = any>(name: string): (params?: TParams) => Promise<TResponse> {
    const config = this.endpoints.get(name);
    if (!config) {
      throw new Error(`API端点 "${name}" 未注册`);
    }

    return async (params?: TParams): Promise<TResponse> => {
      const cacheKey = this.generateCacheKey(name, params);

      // 检查缓存
      if (config.cache && this.isCacheValid(cacheKey)) {
        return this.getFromCache(cacheKey);
      }

      // 创建请求函数
      const requestFn = () => this.makeRequest<TResponse>(config, params);

      // 执行请求（带重试）
      const response = config.retry
        ? await unifiedRetry(requestFn, config.retryOptions)
        : await unifiedSafeApiCall(requestFn);

      // 处理响应
      const processedData = config.transform
        ? config.transform(response)
        : unifiedHandleApiResponse<TResponse>(response);

      // 缓存结果
      if (config.cache) {
        this.setCache(cacheKey, processedData, config.cacheTTL || 5 * 60 * 1000);
      }

      return processedData;
    };
  }

  /**
   * 执行HTTP请求
   */
  private async makeRequest<TResponse>(
    config: ApiEndpointConfig,
    params?: any
  ): Promise<TResponse> {
    const { url, method = 'GET' } = config;

    switch (method) {
      case 'GET':
        return request.get(url, { params });
      case 'POST':
        return request.post(url, params);
      case 'PUT':
        return request.put(url, params);
      case 'DELETE':
        return request.delete(url, { params });
      default:
        throw new Error(`不支持的HTTP方法: ${method}`);
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(name: string, params?: any): string {
    return `api_${name}_${JSON.stringify(params || {})}`;
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < cached.ttl;
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache<T>(key: string): T {
    const cached = this.cache.get(key);
    return cached?.data;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 清除缓存
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// ============================================================================
// 预定义的API端点配置
// ============================================================================

/**
 * 音乐相关API端点配置
 */
export const musicApiEndpoints: Record<string, ApiEndpointConfig> = {
  // 歌曲相关
  getSongUrl: {
    url: '/song/url',
    method: 'GET',
    cache: true,
    cacheTTL: 10 * 60 * 1000, // 10分钟
    retry: true
  },
  getSongDetail: {
    url: '/song/detail',
    method: 'GET',
    cache: true,
    cacheTTL: 30 * 60 * 1000, // 30分钟
    retry: true
  },
  getSongLyric: {
    url: '/lyric',
    method: 'GET',
    cache: true,
    cacheTTL: 60 * 60 * 1000, // 1小时
    retry: true
  },

  // 歌单相关
  getPlaylistDetail: {
    url: '/playlist/detail',
    method: 'GET',
    cache: true,
    cacheTTL: 15 * 60 * 1000, // 15分钟
    retry: true
  },
  getPlaylistTracks: {
    url: '/playlist/track/all',
    method: 'GET',
    cache: true,
    cacheTTL: 10 * 60 * 1000, // 10分钟
    retry: true
  },

  // 搜索相关
  search: {
    url: '/search',
    method: 'GET',
    cache: true,
    cacheTTL: 5 * 60 * 1000, // 5分钟
    retry: true
  },
  searchSuggest: {
    url: '/search/suggest',
    method: 'GET',
    cache: true,
    cacheTTL: 10 * 60 * 1000, // 10分钟
    retry: true
  },

  // 用户相关
  getUserDetail: {
    url: '/user/detail',
    method: 'GET',
    cache: true,
    cacheTTL: 30 * 60 * 1000, // 30分钟
    retry: true
  },
  getUserPlaylist: {
    url: '/user/playlist',
    method: 'GET',
    cache: true,
    cacheTTL: 15 * 60 * 1000, // 15分钟
    retry: true
  },

  // 推荐相关
  getRecommendSongs: {
    url: '/recommend/songs',
    method: 'GET',
    cache: true,
    cacheTTL: 60 * 60 * 1000, // 1小时
    retry: true
  },
  getRecommendPlaylists: {
    url: '/personalized',
    method: 'GET',
    cache: true,
    cacheTTL: 30 * 60 * 1000, // 30分钟
    retry: true
  }
};

/**
 * MV相关API端点配置
 */
export const mvApiEndpoints: Record<string, ApiEndpointConfig> = {
  getTopMv: {
    url: '/mv/all',
    method: 'GET',
    cache: true,
    cacheTTL: 30 * 60 * 1000, // 30分钟
    retry: true
  },
  getMvDetail: {
    url: '/mv/detail',
    method: 'GET',
    cache: true,
    cacheTTL: 60 * 60 * 1000, // 1小时
    retry: true
  },
  getMvUrl: {
    url: '/mv/url',
    method: 'GET',
    cache: true,
    cacheTTL: 10 * 60 * 1000, // 10分钟
    retry: true
  }
};

// ============================================================================
// 全局API工厂实例
// ============================================================================

/**
 * 全局API工厂实例
 */
export const apiFactory = new UnifiedApiFactory();

// 注册所有预定义的API端点
apiFactory.registerBatch({
  ...musicApiEndpoints,
  ...mvApiEndpoints
});

// ============================================================================
// 类型安全的API函数创建器
// ============================================================================

/**
 * 创建类型安全的音乐API函数
 */
export const createMusicApi = <TParams extends MusicApiParams, TResponse = ApiResponse>(
  name: string
) => apiFactory.create<TParams, TResponse>(name);

/**
 * 创建类型安全的用户API函数
 */
export const createUserApi = <TParams extends UserApiParams, TResponse = ApiResponse>(
  name: string
) => apiFactory.create<TParams, TResponse>(name);

/**
 * 创建类型安全的搜索API函数
 */
export const createSearchApi = <TParams extends SearchParams, TResponse = ApiResponse>(
  name: string
) => apiFactory.create<TParams, TResponse>(name);

/**
 * 创建类型安全的分页API函数
 */
export const createPaginationApi = <TParams extends PaginationParams, TResponse = ApiResponse>(
  name: string
) => apiFactory.create<TParams, TResponse>(name);

// ============================================================================
// 便捷的API函数导出
// ============================================================================

// 音乐相关API
export const getSongUrl = createMusicApi<{ id: number; br?: number }, any>('getSongUrl');
export const getSongDetail = createMusicApi<{ ids: (string | number)[] }, any>('getSongDetail');
export const getSongLyric = createMusicApi<{ id: number }, any>('getSongLyric');

// 歌单相关API
export const getPlaylistDetail = createMusicApi<{ id: number }, any>('getPlaylistDetail');
export const getPlaylistTracks = createMusicApi<
  { id: number; limit?: number; offset?: number },
  any
>('getPlaylistTracks');

// 搜索相关API
export const search = createSearchApi<
  { keywords: string; type?: string; limit?: number; offset?: number },
  any
>('search');
export const searchSuggest = createSearchApi<{ keywords: string; type?: string }, any>(
  'searchSuggest'
);

// 用户相关API
export const getUserDetail = createUserApi<{ uid: number }, any>('getUserDetail');
export const getUserPlaylist = createUserApi<{ uid: number; limit?: number; offset?: number }, any>(
  'getUserPlaylist'
);

// 推荐相关API
export const getRecommendSongs = createPaginationApi<{ limit?: number }, any>('getRecommendSongs');
export const getRecommendPlaylists = createPaginationApi<{ limit?: number }, any>(
  'getRecommendPlaylists'
);
