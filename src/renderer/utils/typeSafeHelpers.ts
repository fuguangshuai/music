/**
 * 🔒 类型安全工具层
 * 基于enhanced-api-types.ts提供类型安全的工具函数
 *
 * 功能特性：
 * - 运行时类型验证和类型守卫
 * - 类型安全的数据提取器
 * - 错误处理和回退机制
 * - 开发环境详细日志，生产环境性能优化
 *
 * @author PM - 齐天大圣
 * @since TypeScript 5.0+
 */

// {{P.A.C.E. Path: [B]}}
// {{Task_ID: [#9e5175ad-2985-42e4-b3c8-b304982588ce]}}
// {{Author: [PM]}}
// {{START_MODIFICATIONS}}

import type {
  EnhancedAlbum,
  EnhancedArtist,
  EnhancedSearchResult,
  EnhancedSong,
  EnhancedUser,
  StandardApiResponse
} from '../types/enhanced-api-types';
import { typeGuards } from './typeHelpers';

// ==================== 类型守卫函数 ====================

/**
 * 验证是否为增强型歌曲对象
 * @param value 待验证的值
 * @returns 类型守卫结果
 */
export const isEnhancedSong = (value: unknown): value is EnhancedSong => {
  if (!typeGuards.isObject(value)) return false;

  const obj = value as Record<string, unknown>;

  // 验证必需字段
  if (!typeGuards.isNumber(obj.id) || !typeGuards.isString(obj.name)) {
    return false;
  }

  // 验证artists数组
  if (!typeGuards.isArray(obj.artists) || !obj.artists.every(isEnhancedArtist)) {
    return false;
  }

  // 验证album对象
  if (!isEnhancedAlbum(obj.album)) {
    return false;
  }

  // 验证duration
  if (!typeGuards.isNumber(obj.duration)) {
    return false;
  }

  return true;
};

/**
 * 验证是否为增强型艺术家对象
 * @param value 待验证的值
 * @returns 类型守卫结果
 */
export const isEnhancedArtist = (value: unknown): value is EnhancedArtist => {
  if (!typeGuards.isObject(value)) return false;

  const obj = value as Record<string, unknown>;

  // 验证必需字段
  if (!typeGuards.isNumber(obj.id) || !typeGuards.isString(obj.name)) {
    return false;
  }

  // 验证可选字段类型
  if (obj.picUrl !== undefined && !typeGuards.isString(obj.picUrl)) {
    return false;
  }

  if (obj.alias !== undefined && !typeGuards.isArray(obj.alias)) {
    return false;
  }

  return true;
};

/**
 * 验证是否为增强型专辑对象
 * @param value 待验证的值
 * @returns 类型守卫结果
 */
export const isEnhancedAlbum = (value: unknown): value is EnhancedAlbum => {
  if (!typeGuards.isObject(value)) return false;

  const obj = value as Record<string, unknown>;

  // 验证必需字段
  if (!typeGuards.isNumber(obj.id) || !typeGuards.isString(obj.name)) {
    return false;
  }

  // 验证可选的artist字段
  if (obj.artist !== undefined && !isEnhancedArtist(obj.artist)) {
    return false;
  }

  // 验证可选的artists数组
  if (obj.artists !== undefined) {
    if (!typeGuards.isArray(obj.artists) || !obj.artists.every(isEnhancedArtist)) {
      return false;
    }
  }

  return true;
};

/**
 * 验证是否为增强型搜索结果对象
 * @param value 待验证的值
 * @returns 类型守卫结果
 */
export const isEnhancedSearchResult = (value: unknown): value is EnhancedSearchResult => {
  if (!typeGuards.isObject(value)) return false;

  const obj = value as Record<string, unknown>;

  // 验证songs字段
  if (obj.songs !== undefined) {
    if (!typeGuards.isObject(obj.songs)) return false;
    const songs = obj.songs as Record<string, unknown>;

    if (!typeGuards.isArray(songs.songs) || !typeGuards.isNumber(songs.songCount)) {
      return false;
    }

    // 验证songs数组中的每个元素
    if (!songs.songs.every(isEnhancedSong)) {
      return false;
    }
  }

  // 验证artists字段
  if (obj.artists !== undefined) {
    if (!typeGuards.isObject(obj.artists)) return false;
    const artists = obj.artists as Record<string, unknown>;

    if (!typeGuards.isArray(artists.artists) || !typeGuards.isNumber(artists.artistCount)) {
      return false;
    }

    // 验证artists数组中的每个元素
    if (!artists.artists.every(isEnhancedArtist)) {
      return false;
    }
  }

  return true;
};

// ==================== 类型安全提取器 ====================

/**
 * 将EnhancedSong转换为SongResult格式
 * @param song 增强型歌曲对象
 * @returns SongResult格式的歌曲对象
 */
export const convertToSongResult = (song: EnhancedSong): any => {
  return {
    id: song.id,
    name: song.name,
    picUrl: song.album?.picUrl || '',
    ar: song.artists || [],
    al: song.album || { id: 0, name: '' },
    dt: song.duration || 0,
    duration: song.duration || 0,
    count: 0,
    // 保持其他SongResult需要的字段
    playCount: 0,
    type: 1,
    canDislike: true,
    source: 'netease' as const
  };
};

/**
 * 从搜索结果中安全提取歌曲列表并转换为SongResult格式
 * @param searchResult 搜索结果对象
 * @returns 类型安全的SongResult数组
 */
export const extractSearchSongs = (searchResult: unknown): any[] => {
  try {
    if (!isEnhancedSearchResult(searchResult)) {
      console.warn('🔍 搜索结果格式不正确，返回空数组');
      return [];
    }

    const songs = searchResult.songs?.songs || [];
    const validSongs = songs.filter(isEnhancedSong);

    if (validSongs.length !== songs.length) {
      console.warn(`🔍 过滤了 ${songs.length - validSongs.length} 个无效歌曲`);
    }

    return validSongs.map(convertToSongResult);
  } catch (error) {
    console.error('🔍 提取搜索歌曲失败:', error);
    return [];
  }
};

/**
 * 从搜索结果中安全提取艺术家列表
 * @param searchResult 搜索结果对象
 * @returns 类型安全的艺术家数组
 */
export const extractSearchArtists = (searchResult: unknown): EnhancedArtist[] => {
  try {
    if (!isEnhancedSearchResult(searchResult)) {
      console.warn('🔍 搜索结果格式不正确，返回空数组');
      return [];
    }

    const artists = searchResult.artists?.artists || [];
    const validArtists = artists.filter(isEnhancedArtist);

    if (validArtists.length !== artists.length) {
      console.warn(`🔍 过滤了 ${artists.length - validArtists.length} 个无效艺术家`);
    }

    return validArtists;
  } catch (error) {
    console.error('🔍 提取搜索艺术家失败:', error);
    return [];
  }
};

// ==================== 通用工具函数 ====================

/**
 * 创建类型安全的提取器函数
 * @template T 目标类型
 * @param validator 类型守卫函数
 * @param fallback 验证失败时的回退值
 * @returns 类型安全的提取器函数
 */
export const createTypeSafeExtractor = <T>(
  validator: (value: unknown) => value is T,
  fallback: T
) => {
  return (data: unknown): T => {
    if (validator(data)) {
      return data;
    }

    if (import.meta.env.DEV) {
      console.warn('🔒 类型验证失败，使用回退值', { data, fallback });
    }

    return fallback;
  };
};

/**
 * 安全的类型断言函数
 * @template T 目标类型
 * @param value 待断言的值
 * @param validator 类型守卫函数
 * @param errorMessage 错误消息
 * @returns 类型安全的断言结果
 * @throws {TypeError} 当验证失败时抛出
 */
export const safeTypeAssertion = <T>(
  value: unknown,
  validator: (val: unknown) => val is T,
  errorMessage?: string
): T => {
  if (validator(value)) {
    return value;
  }

  const message = errorMessage || `类型断言失败: 期望类型不匹配，实际值: ${typeof value}`;
  throw new TypeError(message);
};

// {{END_MODIFICATIONS}}

/**
 * 验证是否为增强型用户对象
 * @param value 待验证的值
 * @returns 类型守卫结果
 */
export const isEnhancedUser = (value: unknown): value is EnhancedUser => {
  if (!typeGuards.isObject(value)) return false;

  const obj = value as Record<string, unknown>;

  // 验证必需字段
  if (!typeGuards.isNumber(obj.userId) || !typeGuards.isString(obj.nickname)) {
    return false;
  }

  return true;
};

/**
 * 验证是否为标准API响应
 * @template T 数据类型
 * @param value 待验证的值
 * @param dataValidator 可选的数据验证器
 * @returns 类型守卫结果
 */
export const isStandardApiResponse = <T = unknown>(
  value: unknown,
  dataValidator?: (data: unknown) => data is T
): value is StandardApiResponse<T> => {
  if (!typeGuards.isObject(value)) return false;

  const obj = value as Record<string, unknown>;

  // 验证必需的code字段
  if (!typeGuards.isNumber(obj.code)) return false;

  // 验证可选的message字段
  if (obj.message !== undefined && !typeGuards.isString(obj.message)) {
    return false;
  }

  // 如果提供了数据验证器，验证data字段
  if (dataValidator && obj.data !== undefined) {
    return dataValidator(obj.data);
  }

  return true;
};

// ==================== 高级提取器函数 ====================

/**
 * 从API响应中安全提取数据
 * @template T 数据类型
 * @param response API响应对象
 * @param dataValidator 数据验证器
 * @param fallback 回退值
 * @returns 类型安全的数据
 */
export const extractApiResponseData = <T>(
  response: unknown,
  dataValidator: (data: unknown) => data is T,
  fallback: T
): T => {
  try {
    if (!isStandardApiResponse(response, dataValidator)) {
      if (import.meta.env.DEV) {
        console.warn('🔒 API响应格式不正确，使用回退值', { response, fallback });
      }
      return fallback;
    }

    return response.data as T;
  } catch (error) {
    console.error('🔒 提取API响应数据失败:', error);
    return fallback;
  }
};

/**
 * 批量验证数组中的元素
 * @template T 元素类型
 * @param array 待验证的数组
 * @param validator 元素验证器
 * @returns 验证通过的元素数组
 */
export const validateArrayElements = <T>(
  array: unknown,
  validator: (item: unknown) => item is T
): T[] => {
  if (!typeGuards.isArray(array)) {
    if (import.meta.env.DEV) {
      console.warn('🔒 输入不是数组，返回空数组');
    }
    return [];
  }

  const validElements = array.filter(validator);

  if (import.meta.env.DEV && validElements.length !== array.length) {
    console.warn(`🔒 过滤了 ${array.length - validElements.length} 个无效元素`);
  }

  return validElements;
};

// ==================== 性能优化工具 ====================

/**
 * 带缓存的类型验证器
 * @template T 目标类型
 * @param validator 原始验证器
 * @returns 带缓存的验证器
 */
export const createCachedValidator = <T>(validator: (value: unknown) => value is T) => {
  const cache = new WeakMap<object, boolean>();

  return (value: unknown): value is T => {
    // 只对对象类型使用缓存
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return cache.get(value) as boolean;
      }

      const result = validator(value);
      cache.set(value, result);
      return result;
    }

    return validator(value);
  };
};

// ==================== 导出的工具集合 ====================

/**
 * 类型安全工具集合
 */
export const typeSafeHelpers = {
  // 类型守卫
  isEnhancedSong,
  isEnhancedArtist,
  isEnhancedAlbum,
  isEnhancedSearchResult,
  isEnhancedUser,
  isStandardApiResponse,

  // 提取器
  extractSearchSongs,
  extractSearchArtists,
  extractApiResponseData,
  validateArrayElements,

  // 工具函数
  createTypeSafeExtractor,
  safeTypeAssertion,
  createCachedValidator
} as const;

// ==================== 开发环境调试工具 ====================

if (import.meta.env.DEV) {
  // @ts-ignore
  window.TypeSafeHelpers = typeSafeHelpers;
  console.log('🔧 TypeSafeHelpers已挂载到window对象，可用于调试');
}
