/**
 * 🔒 统一类型守卫工具库
 * 整合项目中所有重复的类型检查和验证函数
 *
 * 功能特性：
 * - 基础类型检查（string, number, boolean等）
 * - 复合类型检查（object, array, function等）
 * - API响应验证
 * - 音乐数据验证
 * - 配置数据验证
 * - 性能优化的缓存验证器
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import type { GenericObject, ValidationInput } from '../types/consolidated-types';

// ============================================================================
// 基础类型守卫 - 替代项目中重复的基础类型检查
// ============================================================================

/**
 * 基础类型守卫集合
 * 整合 typeHelpers.ts, consolidated-types.ts 等文件中的重复函数
 */
export const basicTypeGuards = {
  /**
   * 检查是否为字符串
   */
  isString: (value: ValidationInput): value is string => typeof value === 'string',

  /**
   * 检查是否为数字（排除NaN和Infinity）
   */
  isNumber: (value: ValidationInput): value is number =>
    typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value),

  /**
   * 检查是否为整数
   */
  isInteger: (value: ValidationInput): value is number =>
    basicTypeGuards.isNumber(value) && Number.isInteger(value),

  /**
   * 检查是否为正数
   */
  isPositiveNumber: (value: ValidationInput): value is number =>
    basicTypeGuards.isNumber(value) && value > 0,

  /**
   * 检查是否为布尔值
   */
  isBoolean: (value: ValidationInput): value is boolean => typeof value === 'boolean',

  /**
   * 检查是否为null
   */
  isNull: (value: ValidationInput): value is null => value === null,

  /**
   * 检查是否为undefined
   */
  isUndefined: (value: ValidationInput): value is undefined => value === undefined,

  /**
   * 检查是否为null或undefined
   */
  isNullish: (value: ValidationInput): value is null | undefined =>
    value === null || value === undefined,

  /**
   * 检查是否为函数
   */
  isFunction: (value: ValidationInput): value is Function => typeof value === 'function'
} as const;

// ============================================================================
// 复合类型守卫 - 整合复杂类型检查
// ============================================================================

/**
 * 复合类型守卫集合
 * 整合 object, array 等复杂类型的检查函数
 */
export const complexTypeGuards = {
  /**
   * 检查是否为普通对象（排除null、数组、Date等）
   */
  isObject: (value: ValidationInput): value is GenericObject =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]',

  /**
   * 检查是否为数组
   */
  isArray: <T = any>(value: ValidationInput): value is T[] => Array.isArray(value),

  /**
   * 检查是否为非空数组
   */
  isNonEmptyArray: <T = any>(value: ValidationInput): value is [T, ...T[]] =>
    Array.isArray(value) && value.length > 0,

  /**
   * 检查是否为有效的JSON值
   */
  isJsonValue: (value: ValidationInput): boolean => {
    if (value === null) return true;

    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return true;
    }

    if (Array.isArray(value)) {
      return value.every(complexTypeGuards.isJsonValue);
    }

    if (complexTypeGuards.isObject(value)) {
      return Object.values(value).every(complexTypeGuards.isJsonValue);
    }

    return false;
  },

  /**
   * 检查是否为空对象
   */
  isEmptyObject: (value: ValidationInput): boolean =>
    complexTypeGuards.isObject(value) && Object.keys(value).length === 0,

  /**
   * 检查是否为空数组
   */
  isEmptyArray: (value: ValidationInput): boolean => Array.isArray(value) && value.length === 0
} as const;

// ============================================================================
// API响应类型守卫 - 整合API相关的验证函数
// ============================================================================

/**
 * API响应类型守卫集合
 * 整合各种API响应格式的验证函数
 */
export const apiTypeGuards = {
  /**
   * 检查是否为标准API响应格式
   */
  isStandardApiResponse: (value: ValidationInput): boolean =>
    complexTypeGuards.isObject(value) &&
    basicTypeGuards.isNumber((value as Record<string, any>).code),

  /**
   * 检查是否为成功的API响应
   */
  isSuccessApiResponse: (value: ValidationInput): boolean =>
    apiTypeGuards.isStandardApiResponse(value) && (value as Record<string, any>).code === 200,

  /**
   * 检查是否为错误的API响应
   */
  isErrorApiResponse: (value: ValidationInput): boolean =>
    apiTypeGuards.isStandardApiResponse(value) && (value as Record<string, any>).code !== 200,

  /**
   * 检查是否包含data字段
   */
  hasDataField: (value: ValidationInput): boolean =>
    complexTypeGuards.isObject(value) && 'data' in value,

  /**
   * 检查是否为分页响应
   */
  isPaginatedResponse: (value: ValidationInput): boolean =>
    apiTypeGuards.hasDataField(value) &&
    complexTypeGuards.isObject((value as Record<string, any>).data) &&
    basicTypeGuards.isNumber((value as Record<string, any>).data.total)
} as const;

// ============================================================================
// 音乐数据类型守卫 - 整合音乐相关的验证函数
// ============================================================================

/**
 * 音乐数据类型守卫集合
 * 整合歌曲、艺术家、专辑等音乐数据的验证函数
 */
export const musicTypeGuards = {
  /**
   * 检查是否为有效的歌曲ID
   */
  isValidSongId: (value: ValidationInput): value is number =>
    basicTypeGuards.isInteger(value) && value > 0,

  /**
   * 检查是否为有效的歌曲数据
   */
  isValidSongData: (value: ValidationInput): boolean =>
    complexTypeGuards.isObject(value) &&
    musicTypeGuards.isValidSongId((value as Record<string, any>).id) &&
    basicTypeGuards.isString((value as Record<string, any>).name),

  /**
   * 检查是否为有效的艺术家数据
   */
  isValidArtistData: (value: ValidationInput): boolean =>
    complexTypeGuards.isObject(value) &&
    basicTypeGuards.isString((value as Record<string, any>).name),

  /**
   * 检查是否为有效的专辑数据
   */
  isValidAlbumData: (value: ValidationInput): boolean =>
    complexTypeGuards.isObject(value) &&
    basicTypeGuards.isString((value as Record<string, any>).name),

  /**
   * 检查是否为有效的播放列表数据
   */
  isValidPlaylistData: (value: ValidationInput): boolean =>
    complexTypeGuards.isObject(value) &&
    musicTypeGuards.isValidSongId((value as Record<string, any>).id) &&
    basicTypeGuards.isString((value as Record<string, any>).name),

  /**
   * 检查歌曲是否可播放（基于fee字段）
   */
  isSongPlayable: (value: ValidationInput): boolean => {
    if (!musicTypeGuards.isValidSongData(value)) return false;
    const fee = (value as Record<string, any>).fee;
    return fee !== 1 && fee !== 4;
  }
} as const;

// ============================================================================
// 统一导出
// ============================================================================

// 临时导出，将在下面重新定义

// ============================================================================
// 配置数据类型守卫 - 整合配置相关的验证函数
// ============================================================================

/**
 * 配置数据类型守卫集合
 * 整合应用配置、用户设置等配置数据的验证函数
 */
export const configTypeGuards = {
  /**
   * 检查是否为有效的代理配置
   */
  isValidProxyConfig: (value: ValidationInput): boolean =>
    complexTypeGuards.isObject(value) &&
    basicTypeGuards.isString((value as Record<string, any>).host) &&
    basicTypeGuards.isNumber((value as Record<string, any>).port),

  /**
   * 检查是否为有效的音频配置
   */
  isValidAudioConfig: (value: ValidationInput): boolean =>
    complexTypeGuards.isObject(value) &&
    basicTypeGuards.isNumber((value as Record<string, any>).volume) &&
    (value as Record<string, any>).volume >= 0 &&
    (value as Record<string, any>).volume <= 1,

  /**
   * 检查是否为有效的主题配置
   */
  isValidThemeConfig: (value: ValidationInput): boolean =>
    complexTypeGuards.isObject(value) &&
    basicTypeGuards.isString((value as Record<string, any>).mode) &&
    ['light', 'dark', 'auto'].includes((value as Record<string, any>).mode),

  /**
   * 检查是否为有效的语言配置
   */
  isValidLanguageConfig: (value: ValidationInput): boolean =>
    basicTypeGuards.isString(value) && /^[a-z]{2}(-[A-Z]{2})?$/.test(value as string)
} as const;

// ============================================================================
// 错误处理类型守卫 - 整合错误相关的验证函数
// ============================================================================

/**
 * 错误处理类型守卫集合
 * 整合各种错误类型的验证函数
 */
export const errorTypeGuards = {
  /**
   * 检查是否为Error实例
   */
  isError: (value: ValidationInput): value is Error => value instanceof Error,

  /**
   * 检查是否为网络错误
   */
  isNetworkError: (value: ValidationInput): boolean =>
    errorTypeGuards.isError(value) &&
    ((value as Error).message.includes('network') ||
      (value as Error).message.includes('fetch') ||
      (value as Record<string, any>).code === 'NETWORK_ERROR'),

  /**
   * 检查是否为音频错误
   */
  isAudioError: (value: ValidationInput): boolean =>
    errorTypeGuards.isError(value) &&
    ((value as Error).message.includes('audio') ||
      (value as Record<string, any>).code === 'AUDIO_ERROR'),

  /**
   * 检查是否为API错误
   */
  isApiError: (value: ValidationInput): boolean =>
    complexTypeGuards.isObject(value) &&
    basicTypeGuards.isNumber((value as Record<string, any>).code) &&
    (value as Record<string, any>).code !== 200,

  /**
   * 检查是否为可恢复的错误
   */
  isRecoverableError: (value: ValidationInput): boolean =>
    errorTypeGuards.isNetworkError(value) || errorTypeGuards.isAudioError(value)
} as const;

// ============================================================================
// 性能优化工具 - 缓存验证器
// ============================================================================

/**
 * 创建带缓存的类型验证器
 * 用于性能敏感的场景，避免重复验证相同对象
 */
export const createCachedValidator = <T>(validator: (value: ValidationInput) => value is T) => {
  const cache = new WeakMap<object, boolean>();

  return (value: ValidationInput): value is T => {
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

/**
 * 创建组合验证器
 * 将多个验证器组合成一个
 */
export const createCompositeValidator = <T>(
  validators: Array<(value: ValidationInput) => boolean>
) => {
  return (value: ValidationInput): value is T => {
    return validators.every((validator) => validator(value));
  };
};

/**
 * 创建条件验证器
 * 根据条件选择不同的验证器
 */
export const createConditionalValidator = <T>(
  condition: (value: ValidationInput) => boolean,
  trueValidator: (value: ValidationInput) => value is T,
  falseValidator: (value: ValidationInput) => value is T
) => {
  return (value: ValidationInput): value is T => {
    return condition(value) ? trueValidator(value) : falseValidator(value);
  };
};

// ============================================================================
// 统一导出（更新）
// ============================================================================

/**
 * 统一的类型守卫工具集合
 * 替代项目中分散的类型检查函数
 */
export const unifiedTypeGuards = {
  ...basicTypeGuards,
  ...complexTypeGuards,
  ...apiTypeGuards,
  ...musicTypeGuards,
  ...configTypeGuards,
  ...errorTypeGuards
} as const;

/**
 * 工具函数集合
 */
export const typeGuardUtils = {
  createCachedValidator,
  createCompositeValidator,
  createConditionalValidator
} as const;

/**
 * 默认导出统一的类型守卫
 */
export default unifiedTypeGuards;
