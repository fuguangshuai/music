/**
 * 🔄 统一API响应处理工具
 * 整合项目中所有重复的API响应处理逻辑
 *
 * 功能特性：
 * - 统一的API响应格式处理
 * - 错误处理和重试机制
 * - 数据提取和转换
 * - 类型安全的响应验证
 * - 缓存和性能优化
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import type {
  AlbumLike,
  ApiResponseData,
  ArtistLike,
  PlaylistLike,
  SongLike,
  ValidationInput
} from '../types/consolidated-types';
import { unifiedTypeGuards } from './unified-type-guards';

// ============================================================================
// 统一的API响应处理器
// ============================================================================

/**
 * 标准API响应接口
 */
export interface UnifiedApiResponse<T = any> {
  code: number;
  message?: string;
  data?: T;
  timestamp?: number;
}

/**
 * API处理选项
 */
export interface ApiHandlerOptions<T> {
  /** 数据验证器 */
  validator?: (data: ValidationInput) => data is T;
  /** 错误时的回退值 */
  fallback?: T;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存TTL（毫秒） */
  cacheTtl?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
}

/**
 * 统一的API响应处理器类
 * 整合 apiResponseHandler.ts 和其他API处理文件的功能
 */
export class UnifiedApiHandler {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * 处理API响应，提取data字段
   * 整合项目中重复的API响应处理逻辑
   */
  static handleResponse<T>(response: ApiResponseData, options: ApiHandlerOptions<T> = {}): T {
    const { validator, fallback } = options;

    // 检查是否为标准API响应格式
    if (!unifiedTypeGuards.isStandardApiResponse(response)) {
      console.warn('🔄 非标准API响应格式', response);
      if (fallback !== undefined) return fallback;
      throw new Error('Invalid API response format');
    }

    const apiResponse = response as UnifiedApiResponse<T>;

    // 检查响应状态
    if (apiResponse.code !== 200) {
      const errorMessage = apiResponse.message || `API错误: ${apiResponse.code}`;
      console.error('🔄 API响应错误', errorMessage);
      if (fallback !== undefined) return fallback;
      throw new Error(errorMessage);
    }

    // 提取数据
    const data = apiResponse.data;

    // 验证数据
    if (validator && !validator(data)) {
      console.warn('🔄 API数据验证失败', data);
      if (fallback !== undefined) return fallback;
      throw new Error('API data validation failed');
    }

    return data as T;
  }

  /**
   * 批量处理API响应数组
   * 整合批量处理逻辑
   */
  static handleBatchResponse<T>(
    responses: ApiResponseData[],
    options: ApiHandlerOptions<T> = {}
  ): T[] {
    if (!unifiedTypeGuards.isArray(responses)) {
      console.warn('🔄 输入不是数组', responses);
      return [];
    }

    return responses
      .map((response) => {
        try {
          return this.handleResponse<T>(response, options);
        } catch (error) {
          console.warn('🔄 批量处理中的单个响应失败', error);
          return options.fallback;
        }
      })
      .filter((item): item is T => item !== undefined);
  }

  /**
   * 检查API响应是否成功
   * 整合成功检查逻辑
   */
  static isSuccess(response: ApiResponseData): boolean {
    return unifiedTypeGuards.isSuccessApiResponse(response);
  }

  /**
   * 获取API响应错误信息
   * 整合错误信息提取逻辑
   */
  static getErrorMessage(response: ApiResponseData): string {
    if (!unifiedTypeGuards.isStandardApiResponse(response)) {
      return '未知的响应格式';
    }

    const apiResponse = response as UnifiedApiResponse;
    return apiResponse.message || `错误代码: ${apiResponse.code}`;
  }

  /**
   * 创建带重试的API处理器
   * 整合重试逻辑
   */
  static createRetryHandler<T>(options: ApiHandlerOptions<T> = {}) {
    const { retryCount = 3, retryDelay = 1000 } = options;

    return async (apiCall: () => Promise<ApiResponseData>): Promise<T> => {
      let lastError: Error;

      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          const response = await apiCall();
          return this.handleResponse<T>(response, options);
        } catch (error) {
          lastError = error as Error;

          if (attempt < retryCount) {
            console.warn(`🔄 API调用失败，第${attempt + 1}次重试`, error);
            await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
          }
        }
      }

      throw lastError!;
    };
  }

  /**
   * 创建带缓存的API处理器
   * 整合缓存逻辑
   */
  static createCachedHandler<T>(options: ApiHandlerOptions<T> = {}) {
    const { cacheTtl = 300000 } = options;

    return (cacheKey: string, apiCall: () => Promise<ApiResponseData>): Promise<T> => {
      // 检查缓存
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return Promise.resolve(cached.data);
      }

      // 调用API并缓存结果
      return apiCall().then((response) => {
        const result = this.handleResponse<T>(response, options);
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: cacheTtl
        });
        return result;
      });
    };
  }

  /**
   * 清理过期缓存
   */
  static clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清理所有缓存
   */
  static clearAllCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// 便捷的工具函数
// ============================================================================

/**
 * 快速处理API响应
 * 简化的API响应处理函数
 */
export const handleApiResponse = <T>(
  response: ApiResponseData,
  validator?: (data: ValidationInput) => data is T,
  fallback?: T
): T => {
  return UnifiedApiHandler.handleResponse<T>(response, { validator, fallback });
};

/**
 * 快速批量处理API响应
 */
export const handleBatchApiResponse = <T>(
  responses: ApiResponseData[],
  validator?: (data: ValidationInput) => data is T,
  fallback?: T
): T[] => {
  return UnifiedApiHandler.handleBatchResponse<T>(responses, { validator, fallback });
};

/**
 * 快速检查API成功状态
 */
export const isApiSuccess = (response: ApiResponseData): boolean => {
  return UnifiedApiHandler.isSuccess(response);
};

/**
 * 快速获取API错误信息
 */
export const getApiErrorMessage = (response: ApiResponseData): string => {
  return UnifiedApiHandler.getErrorMessage(response);
};

// ============================================================================
// 类型安全的API响应提取器
// ============================================================================

/**
 * 类型安全的API数据提取器
 * 用于替代项目中的 (response as any).data 模式
 */
export class TypeSafeApiExtractor {
  /**
   * 安全提取API响应中的data字段
   */
  static extractData<T>(response: ApiResponseData, fallback?: T): T | undefined {
    if (!unifiedTypeGuards.isStandardApiResponse(response)) {
      console.warn('🔒 非标准API响应格式，无法提取data', response);
      return fallback;
    }

    const apiResponse = response as UnifiedApiResponse<T>;
    if (apiResponse.code !== 200) {
      console.warn('🔒 API响应错误，无法提取data', apiResponse.message);
      return fallback;
    }

    return apiResponse.data;
  }

  /**
   * 安全提取歌曲列表数据
   */
  static extractSongs(response: ApiResponseData): SongLike[] {
    const data = this.extractData(response);
    if (!data) return [];

    // 尝试多种可能的歌曲列表路径
    const possiblePaths = [
      (data as any).songs,
      (data as any).data?.songs,
      (data as any).result?.songs,
      (data as any).playlist?.tracks,
      (data as any).tracks
    ];

    for (const path of possiblePaths) {
      if (unifiedTypeGuards.isArray(path)) {
        return path;
      }
    }

    return [];
  }

  /**
   * 安全提取播放列表数据
   */
  static extractPlaylist(response: ApiResponseData): PlaylistLike | null {
    const data = this.extractData(response);
    if (!data) return null;

    // 尝试多种可能的播放列表路径
    const possiblePaths = [
      (data as any).playlist,
      (data as any).data?.playlist,
      (data as any).result?.playlist
    ];

    for (const path of possiblePaths) {
      if (unifiedTypeGuards.isObject(path)) {
        return path;
      }
    }

    return null;
  }

  /**
   * 安全提取用户数据
   */
  static extractUser(response: ApiResponseData): Record<string, any> | null {
    const data = this.extractData(response);
    if (!data) return null;

    // 尝试多种可能的用户数据路径
    const possiblePaths = [
      (data as any).profile,
      (data as any).data?.profile,
      (data as any).user,
      (data as any).account
    ];

    for (const path of possiblePaths) {
      if (unifiedTypeGuards.isObject(path)) {
        return path;
      }
    }

    return null;
  }

  /**
   * 安全提取歌词数据
   */
  static extractLyrics(response: ApiResponseData): Record<string, any> | null {
    const data = this.extractData(response);
    if (!data) return null;

    // 尝试多种可能的歌词数据路径
    const possiblePaths = [
      (data as any).lrc,
      (data as any).data?.lrc,
      (data as any).lyric,
      (data as any).lyrics
    ];

    for (const path of possiblePaths) {
      if (unifiedTypeGuards.isObject(path)) {
        return path;
      }
    }

    return null;
  }

  /**
   * 安全提取音乐URL数据
   */
  static extractMusicUrl(response: ApiResponseData): string | null {
    const data = this.extractData(response);
    if (!data) return null;

    // 尝试多种可能的音乐URL路径
    const possiblePaths = [
      (data as any).url,
      (data as any).data?.url,
      (data as any).mp3Url,
      (data as any).src,
      (data as any).source
    ];

    for (const path of possiblePaths) {
      if (unifiedTypeGuards.isString(path) && path.length > 0) {
        return path;
      }
    }

    return null;
  }

  /**
   * 安全提取专辑数据
   */
  static extractAlbum(response: ApiResponseData): AlbumLike | null {
    const data = this.extractData(response);
    if (!data) return null;

    // 尝试多种可能的专辑数据路径
    const possiblePaths = [
      (data as any).album,
      (data as any).data?.album,
      (data as any).al,
      (data as any).albumInfo
    ];

    for (const path of possiblePaths) {
      if (unifiedTypeGuards.isObject(path)) {
        return path;
      }
    }

    return null;
  }

  /**
   * 安全提取艺术家数据
   */
  static extractArtists(response: ApiResponseData): ArtistLike[] {
    const data = this.extractData(response);
    if (!data) return [];

    // 尝试多种可能的艺术家数据路径
    const possiblePaths = [
      (data as any).artists,
      (data as any).data?.artists,
      (data as any).ar,
      (data as any).artist
    ];

    for (const path of possiblePaths) {
      if (unifiedTypeGuards.isArray(path)) {
        return path;
      }
      // 如果是单个艺术家对象，转换为数组
      if (unifiedTypeGuards.isObject(path)) {
        return [path];
      }
    }

    return [];
  }

  /**
   * 安全提取登录数据
   */
  static extractLoginData(response: ApiResponseData): any {
    const data = this.extractData(response);
    if (!data) return null;

    // 检查登录状态码
    const code = (data as any).code;
    if (!unifiedTypeGuards.isNumber(code) || code !== 200) {
      console.warn('🔒 登录响应状态异常', code);
      return null;
    }

    // 尝试多种可能的登录数据路径
    const possiblePaths = [
      (data as any).profile,
      (data as any).account,
      (data as any).user,
      (data as any).data?.profile
    ];

    for (const path of possiblePaths) {
      if (unifiedTypeGuards.isObject(path)) {
        return {
          profile: path,
          token: (data as any).token,
          account: (data as any).account,
          bindings: (data as any).bindings
        };
      }
    }

    return null;
  }

  /**
   * 安全提取二维码数据
   */
  static extractQrData(response: ApiResponseData): any {
    const data = this.extractData(response);
    if (!data) return null;

    // 尝试多种可能的二维码数据路径
    const possiblePaths = [(data as any).data, (data as any).qr, (data as any).qrimg, data];

    for (const path of possiblePaths) {
      if (unifiedTypeGuards.isObject(path)) {
        const unikey = (path as any).unikey;
        const qrimg = (path as any).qrimg;
        const qrurl = (path as any).qrurl;

        if (unifiedTypeGuards.isString(unikey)) {
          return {
            unikey,
            qrimg: unifiedTypeGuards.isString(qrimg) ? qrimg : null,
            qrurl: unifiedTypeGuards.isString(qrurl) ? qrurl : null
          };
        }
      }
    }

    return null;
  }
}

// ============================================================================
// 便捷的类型安全提取函数
// ============================================================================

/**
 * 快速提取API响应数据
 */
export const safeExtractData = <T>(response: ApiResponseData, fallback?: T): T | undefined => {
  return TypeSafeApiExtractor.extractData<T>(response, fallback);
};

/**
 * 快速提取歌曲列表
 */
export const safeExtractSongs = (response: ApiResponseData): SongLike[] => {
  return TypeSafeApiExtractor.extractSongs(response);
};

/**
 * 快速提取播放列表
 */
export const safeExtractPlaylist = (response: ApiResponseData): PlaylistLike | null => {
  return TypeSafeApiExtractor.extractPlaylist(response);
};

/**
 * 快速提取用户数据
 */
export const safeExtractUser = (response: ApiResponseData): Record<string, any> | null => {
  return TypeSafeApiExtractor.extractUser(response);
};

/**
 * 快速提取歌词数据
 */
export const safeExtractLyrics = (response: ApiResponseData): Record<string, any> | null => {
  return TypeSafeApiExtractor.extractLyrics(response);
};

/**
 * 快速提取音乐URL
 */
export const safeExtractMusicUrl = (response: ApiResponseData): string | null => {
  return TypeSafeApiExtractor.extractMusicUrl(response);
};

/**
 * 快速提取专辑数据
 */
export const safeExtractAlbum = (response: ApiResponseData): AlbumLike | null => {
  return TypeSafeApiExtractor.extractAlbum(response);
};

/**
 * 快速提取艺术家数据
 */
export const safeExtractArtists = (response: ApiResponseData): ArtistLike[] => {
  return TypeSafeApiExtractor.extractArtists(response);
};

/**
 * 快速提取登录数据
 */
export const safeExtractLoginData = (response: ApiResponseData): any => {
  return TypeSafeApiExtractor.extractLoginData(response);
};

/**
 * 快速提取二维码数据
 */
export const safeExtractQrData = (response: ApiResponseData): any => {
  return TypeSafeApiExtractor.extractQrData(response);
};

// ============================================================================
// 默认导出
// ============================================================================

export default UnifiedApiHandler;
