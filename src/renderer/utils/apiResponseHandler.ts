/**
 * 通用API响应处理工具
 * 统一处理API响应的类型断言和错误处理
 * 集成类型安全验证机制，支持运行时类型检查
 */

/**
 * @deprecated 使用 StandardApiResponse 替代
 * 此接口定义已移除，请使用 enhanced-api-types.ts 中的 StandardApiResponse
 */
import type { ApiResponseData, ValidationInput } from '../types/consolidated-types';
import type { StandardApiResponse } from '../types/enhanced-api-types';
import {
  createCachedValidator,
  isEnhancedArtist,
  isEnhancedSearchResult,
  isEnhancedSong,
  isStandardApiResponse
} from './typeSafeHelpers';

// 类型守卫函数类型定义
type TypeGuard<T> = (value: ValidationInput) => value is T;

/**
 * 处理API响应，提取data字段
 * @param response API响应对象
 * @param validator 可选的类型验证器
 * @returns 提取的data数据
 */
export const handleApiResponse = <T>(response: ApiResponseData, validator?: TypeGuard<T>): T => {
  // 验证响应格式
  if (!isStandardApiResponse(response)) {
    throw new Error('API响应格式不正确');
  }

  // 检查响应状态
  if (response.code !== 200) {
    throw new Error(response.message || `API请求失败，状态码: ${response.code}`);
  }

  const data = response.data;

  // 如果提供了验证器，验证数据格式
  if (validator && data !== undefined && !validator(data)) {
    throw new Error('API响应数据格式验证失败');
  }

  return data as T;
};

/**
 * 安全的API调用包装器
 * @param apiCall API调用函数
 * @param validator 可选的类型验证器
 * @param fallback 验证失败时的回退值
 * @returns Promise<T> 返回处理后的数据
 */
export const safeApiCall = async <T>(
  apiCall: () => Promise<unknown>,
  validator?: TypeGuard<T>,
  fallback?: T
): Promise<T> => {
  try {
    const response = await apiCall();
    return handleApiResponse<T>(response, validator);
  } catch (error) {
    console.error('API调用失败:', error);

    // 如果提供了回退值，返回回退值而不是抛出错误
    if (fallback !== undefined) {
      console.warn('使用回退值:', fallback);
      return fallback;
    }

    throw error;
  }
};

/**
 * 批量处理API响应
 * @param responses API响应数组
 * @returns 处理后的数据数组
 */
export const handleBatchApiResponse = <T>(responses: ApiResponseData[]): T[] => {
  return responses.map((response) => handleApiResponse<T>(response));
};

/**
 * 检查API响应是否成功
 * @param response API响应对象
 * @returns 是否成功
 */
export const isApiSuccess = (response: ApiResponseData): boolean => {
  const apiResponse = response as StandardApiResponse<unknown>;
  return apiResponse.code === 200;
};

/**
 * 获取API响应错误信息
 * @param response API响应对象
 * @returns 错误信息
 */
export const getApiErrorMessage = (response: ApiResponseData): string => {
  const apiResponse = response as StandardApiResponse<unknown>;
  return apiResponse.message || '未知错误';
};

/**
 * 类型安全的API响应处理器
 * @param response API响应对象
 * @param validator 可选的验证函数
 * @returns 处理后的数据
 * @deprecated 使用 handleApiResponse 替代
 */
export const safeHandleApiResponse = <T>(
  response: unknown,
  validator?: (data: any) => data is T
): T => {
  return handleApiResponse(response, validator);
};

// ==================== 专用API响应处理器 ====================

/**
 * 创建搜索响应处理器
 * @returns 搜索响应处理函数
 */
export const createSearchResponseHandler = () => {
  const cachedValidator = createCachedValidator(isEnhancedSearchResult);

  return (response: unknown) => {
    return handleApiResponse(response, cachedValidator);
  };
};

/**
 * 创建歌曲响应处理器
 * @returns 歌曲响应处理函数
 */
export const createSongResponseHandler = () => {
  const cachedValidator = createCachedValidator(isEnhancedSong);

  return (response: unknown) => {
    return handleApiResponse(response, cachedValidator);
  };
};

/**
 * 创建艺术家响应处理器
 * @returns 艺术家响应处理函数
 */
export const createArtistResponseHandler = () => {
  const cachedValidator = createCachedValidator(isEnhancedArtist);

  return (response: unknown) => {
    return handleApiResponse(response, cachedValidator);
  };
};

// ==================== 缓存和性能优化 ====================

/**
 * 带缓存的API响应处理器
 * 缓存验证结果以提高性能
 */
export class CachedApiResponseHandler<T> {
  private cache = new WeakMap<object, T>();
  private validator?: TypeGuard<T>;

  constructor(validator?: TypeGuard<T>) {
    this.validator = validator;
  }

  /**
   * 处理API响应
   * @param response API响应对象
   * @returns 处理后的数据
   */
  handle(response: unknown): T {
    // 只对对象类型使用缓存
    if (typeof response === 'object' && response !== null) {
      if (this.cache.has(response)) {
        return this.cache.get(response) as T;
      }
    }

    const result = handleApiResponse(response, this.validator);

    // 缓存结果
    if (typeof response === 'object' && response !== null) {
      this.cache.set(response, result);
    }

    return result;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = new WeakMap<object, T>();
  }
}
