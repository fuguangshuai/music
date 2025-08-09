/**
 * 统一工具函数库
 *
 * 目标：整合项目中重复的工具函数，提供统一的API
 *
 * 整合内容：
 * 1. 重试逻辑（来自 retry.ts 和 errorHandler.ts）
 * 2. 错误处理（统一多个错误处理模块）
 * 3. 格式化函数（整合 formatters.ts 和 modules/format/index.ts）
 * 4. API 响应处理（整合 apiResponseHandler.ts）
 * 5. 缓存操作（统一缓存接口）
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import type {
  ApiResponseHandler,
  CacheStrategy,
  UnifiedCacheItem,
  UnifiedError,
  UnifiedNumberFormatOptions,
  UnifiedRetryOptions,
  UnifiedTimeFormatOptions
} from '../types/consolidated-types';

// ============================================================================
// 统一的重试逻辑
// ============================================================================

/**
 * 默认重试条件判断
 */
const defaultShouldRetry = (error: Error, attempt: number): boolean => {
  // 网络错误或超时错误通常可以重试
  const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'ECONNRESET', 'ENOTFOUND', 'ERR_NETWORK'];
  const isRetryableError = retryableErrors.some(
    (type) => error.message.includes(type) || error.name.includes(type)
  );

  // 限制重试次数，避免无限重试
  return isRetryableError && attempt < 5;
};

/**
 * 统一的重试函数 - 整合项目中的多个重试实现
 */
export const unifiedRetry = async <T>(
  fn: () => Promise<T>,
  options: UnifiedRetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 'exponential',
    maxDelay = 10000,
    shouldRetry = defaultShouldRetry,
    onRetry
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        throw lastError;
      }

      // 检查是否应该重试
      if (!shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // 调用重试回调
      if (onRetry) {
        onRetry(lastError, attempt);
      }

      // 计算延迟时间
      let currentDelay = delay;
      if (backoff === 'exponential') {
        currentDelay = Math.min(delay * Math.pow(2, attempt), maxDelay);
      } else if (backoff === 'linear') {
        currentDelay = Math.min(delay * (attempt + 1), maxDelay);
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError || new Error('重试失败，未知错误');
};

// ============================================================================
// 统一的错误处理
// ============================================================================

/**
 * 创建统一错误对象
 */
export const createUnifiedError = (
  message: string,
  type: UnifiedError['type'] = 'unknown',
  code: string = 'UNKNOWN_ERROR',
  originalError?: Error,
  context?: Record<string, any>
): UnifiedError => {
  return {
    code,
    message,
    type,
    recoverable: type === 'network' || type === 'api',
    context,
    originalError
  };
};

/**
 * 统一的错误处理函数
 */
export const handleUnifiedError = (error: Error | UnifiedError): UnifiedError => {
  if ('type' in error && 'code' in error) {
    return error as UnifiedError;
  }

  // 根据错误信息判断类型
  const errorMessage = error.message.toLowerCase();
  let type: UnifiedError['type'] = 'unknown';
  let code = 'UNKNOWN_ERROR';

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    type = 'network';
    code = 'NETWORK_ERROR';
  } else if (errorMessage.includes('audio') || errorMessage.includes('media')) {
    type = 'audio';
    code = 'AUDIO_ERROR';
  } else if (errorMessage.includes('api') || errorMessage.includes('response')) {
    type = 'api';
    code = 'API_ERROR';
  } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    type = 'validation';
    code = 'VALIDATION_ERROR';
  }

  return createUnifiedError(error.message, type, code, error);
};

// ============================================================================
// 统一的格式化函数
// ============================================================================

/**
 * 统一的时间格式化函数 - 整合多个时间格式化实现
 */
export const unifiedFormatTime = (
  time: number | string,
  options: UnifiedTimeFormatOptions = {}
): string => {
  const { format = 'auto', showHours = false, padZero = true } = options;

  // 处理输入
  const seconds = typeof time === 'string' ? parseFloat(time) : time;

  if (!seconds || seconds < 0 || !isFinite(seconds)) {
    return format === 'hh:mm:ss' ? '00:00:00' : '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (num: number) => (padZero ? num.toString().padStart(2, '0') : num.toString());

  // 自动格式判断
  if (format === 'auto') {
    if (hours > 0 || showHours) {
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    }
    return `${pad(minutes)}:${pad(secs)}`;
  }

  // 指定格式
  if (format === 'hh:mm:ss') {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }

  return `${pad(minutes)}:${pad(secs)}`;
};

/**
 * 统一的数字格式化函数
 */
export const unifiedFormatNumber = (
  num: number | string,
  options: UnifiedNumberFormatOptions = {}
): string => {
  const { locale = 'zh-CN', precision = 2, useGrouping = true, notation = 'standard' } = options;

  const number = typeof num === 'string' ? parseFloat(num) : num;

  if (!isFinite(number)) {
    return '0';
  }

  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision,
      useGrouping,
      notation
    }).format(number);
  } catch (error) {
    console.warn('数字格式化失败，使用默认格式:', error);
    return number.toLocaleString();
  }
};

/**
 * 统一的文件大小格式化
 */
export const unifiedFormatFileSize = (bytes: number, precision: number = 2): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(precision))} ${sizes[i]}`;
};

// ============================================================================
// 统一的API响应处理
// ============================================================================

/**
 * 统一的API响应处理函数
 */
export const unifiedHandleApiResponse = <T>(response: any, handler?: ApiResponseHandler<T>): T => {
  try {
    // 如果提供了自定义处理器，使用它
    if (handler) {
      return handler(response);
    }

    // 默认处理逻辑
    if (response && typeof response === 'object') {
      // 处理标准API响应格式
      if ('data' in response) {
        return response.data;
      }
      // 处理Axios响应格式
      if ('data' in response && 'status' in response) {
        return response.data;
      }
    }

    return response;
  } catch (error) {
    console.error('API响应处理失败:', error);
    throw createUnifiedError('API响应处理失败', 'api', 'API_RESPONSE_ERROR', error as Error);
  }
};

/**
 * 安全的API调用包装器
 */
export const unifiedSafeApiCall = async <T>(
  apiCall: () => Promise<any>,
  handler?: ApiResponseHandler<T>,
  fallback?: T
): Promise<T> => {
  try {
    const response = await apiCall();
    return unifiedHandleApiResponse<T>(response, handler);
  } catch (error) {
    console.error('API调用失败:', error);

    if (fallback !== undefined) {
      console.warn('使用回退值:', fallback);
      return fallback;
    }

    throw handleUnifiedError(error as Error);
  }
};

// ============================================================================
// 统一的缓存操作
// ============================================================================

/**
 * 统一的缓存管理器
 */
export class UnifiedCacheManager {
  private memoryCache = new Map<string, UnifiedCacheItem>();
  private maxMemorySize = 100;

  /**
   * 设置缓存项
   */
  async set<T>(
    key: string,
    value: T,
    strategy: CacheStrategy = 'memory',
    expiry?: number
  ): Promise<void> {
    const item: UnifiedCacheItem<T> = {
      key,
      value,
      timestamp: Date.now(),
      expiry,
      strategy,
      metadata: {}
    };

    switch (strategy) {
      case 'memory':
        this.setMemoryCache(item);
        break;
      case 'localStorage':
        this.setLocalStorageCache(item);
        break;
      case 'sessionStorage':
        this.setSessionStorageCache(item);
        break;
      case 'indexedDB':
        await this.setIndexedDBCache(item);
        break;
    }
  }

  /**
   * 获取缓存项
   */
  async get<T>(key: string, strategy: CacheStrategy = 'memory'): Promise<T | null> {
    let item: UnifiedCacheItem<T> | null = null;

    switch (strategy) {
      case 'memory':
        item = this.getMemoryCache<T>(key);
        break;
      case 'localStorage':
        item = this.getLocalStorageCache<T>(key);
        break;
      case 'sessionStorage':
        item = this.getSessionStorageCache<T>(key);
        break;
      case 'indexedDB':
        item = await this.getIndexedDBCache<T>(key);
        break;
    }

    if (!item) return null;

    // 检查是否过期
    if (item.expiry && Date.now() > item.timestamp + item.expiry) {
      await this.delete(key, strategy);
      return null;
    }

    return item.value;
  }

  /**
   * 删除缓存项
   */
  async delete(key: string, strategy: CacheStrategy = 'memory'): Promise<void> {
    switch (strategy) {
      case 'memory':
        this.memoryCache.delete(key);
        break;
      case 'localStorage':
        localStorage.removeItem(key);
        break;
      case 'sessionStorage':
        sessionStorage.removeItem(key);
        break;
      case 'indexedDB':
        // IndexedDB 删除逻辑
        break;
    }
  }

  private setMemoryCache<T>(item: UnifiedCacheItem<T>): void {
    // 如果超过最大大小，删除最旧的项
    if (this.memoryCache.size >= this.maxMemorySize) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }
    this.memoryCache.set(item.key, item);
  }

  private getMemoryCache<T>(key: string): UnifiedCacheItem<T> | null {
    return (this.memoryCache.get(key) as UnifiedCacheItem<T>) || null;
  }

  private setLocalStorageCache<T>(item: UnifiedCacheItem<T>): void {
    try {
      localStorage.setItem(item.key, JSON.stringify(item));
    } catch (error) {
      console.warn('localStorage 设置失败:', error);
    }
  }

  private getLocalStorageCache<T>(key: string): UnifiedCacheItem<T> | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('localStorage 获取失败:', error);
      return null;
    }
  }

  private setSessionStorageCache<T>(item: UnifiedCacheItem<T>): void {
    try {
      sessionStorage.setItem(item.key, JSON.stringify(item));
    } catch (error) {
      console.warn('sessionStorage 设置失败:', error);
    }
  }

  private getSessionStorageCache<T>(key: string): UnifiedCacheItem<T> | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('sessionStorage 获取失败:', error);
      return null;
    }
  }

  private async setIndexedDBCache<T>(_item: UnifiedCacheItem<T>): Promise<void> {
    // IndexedDB 实现
    console.log('IndexedDB 缓存设置 - 待实现');
  }

  private async getIndexedDBCache<T>(_key: string): Promise<UnifiedCacheItem<T> | null> {
    // IndexedDB 实现
    console.log('IndexedDB 缓存获取 - 待实现');
    return null;
  }
}

// 创建全局缓存管理器实例
export const unifiedCache = new UnifiedCacheManager();
