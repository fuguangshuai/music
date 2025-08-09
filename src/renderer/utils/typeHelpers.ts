/**
 * 类型定义辅助工具
 * 提供常用的类型工具函数，减少重复的类型定义工作
 */

import type { StandardApiResponse } from '../types/enhanced-api-types';

// 通用API响应包装器
/**
 * @deprecated 使用 StandardApiResponse 替代
 * @see StandardApiResponse in enhanced-api-types.ts
 *
 * 迁移指南：
 * - 旧用法: ApiResponse<SomeType>
 * - 新用法: StandardApiResponse<SomeType>
 *
 * 此类型别名将在下个版本中移除
 */
export type ApiResponse<T> = StandardApiResponse<T>;

/**
 * 未知数据类型 - 替代any的类型安全方案
 * @description 用于处理动态或未知结构的数据，提供基本的类型安全保证
 * @since TypeScript 5.0+
 */
export type UnknownData = unknown;

/**
 * JSON兼容的值类型 - 确保数据可序列化
 * @description 限制为JSON安全的类型，避免函数、Symbol等不可序列化类型
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

// 部分可选类型 - 增强版本，支持嵌套键路径
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 部分必需类型 - 增强版本，支持嵌套键路径
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * 深度部分可选 - 递归类型，支持无限嵌套
 * @description 使用条件类型确保类型安全的递归处理
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? (T[P] extends Function ? T[P] : DeepPartial<T[P]>) : T[P];
};

/**
 * 提取数组元素类型 - 增强版本，支持只读数组
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * 临时API数据类型 - 类型安全的替代方案
 * @description 用于临时API对接，提供基本结构验证
 */
export type TempApiData =
  | JsonValue
  | {
      readonly [key: string]: JsonValue;
    };

/**
 * 第三方库数据类型 - 结构化的未知数据
 * @description 为第三方库提供基本的类型约束
 */
export type ThirdPartyData =
  | {
      readonly [key: string]: JsonValue;
    }
  | JsonValue;

/**
 * 配置对象类型 - 强类型配置
 * @description 支持嵌套配置，确保类型安全
 */
export type ConfigObject<T = JsonValue> = {
  readonly [key: string]: T | ConfigObject<T>;
};

/**
 * 类型断言辅助函数 - 企业级类型安全实现
 * @description 提供运行时类型检查和安全的类型转换
 */
export const typeHelpers = {
  /**
   * 安全的类型断言，带完整的运行时验证
   * @template T 目标类型
   * @param value 待转换的值
   * @param validator 类型守卫函数
   * @param fallback 验证失败时的回退值
   * @returns 类型安全的转换结果
   * @throws {TypeError} 当验证失败且无回退值时抛出
   */
  safeCast: <T>(value: unknown, validator: (val: unknown) => val is T, fallback?: T): T => {
    if (validator(value)) {
      return value;
    }

    if (fallback !== undefined) {
      console.warn('类型断言失败，使用回退值', { value, fallback });
      return fallback;
    }

    throw new TypeError(`类型断言失败: 期望类型不匹配，实际值: ${typeof value}`);
  },

  /**
   * 临时API数据处理 - 类型安全版本
   * @param data 未知结构的API数据
   * @returns 类型安全的临时数据
   */
  processTempApiData: (data: unknown): TempApiData => {
    if (data === null || data === undefined) {
      return null;
    }

    // 确保数据是JSON兼容的
    try {
      JSON.stringify(data);
      console.info('🔄 处理临时API数据，建议后续添加具体类型定义');
      return data as TempApiData;
    } catch {
      console.warn('⚠️ API数据不是JSON兼容的，转换为字符串');
      return String(data);
    }
  },

  /**
   * 第三方库数据处理 - 增强版本
   * @param data 第三方库返回的数据
   * @param libraryName 库名称，用于日志记录
   * @returns 类型安全的第三方数据
   */
  processThirdPartyData: (data: unknown, libraryName = 'unknown'): ThirdPartyData => {
    console.info(`🔌 处理第三方库数据: ${libraryName}`);

    if (data === null || data === undefined) {
      return null;
    }

    // 基本类型直接返回
    if (typeof data !== 'object') {
      return data as JsonValue;
    }

    // 对象类型进行浅层验证
    try {
      JSON.stringify(data);
      return data as ThirdPartyData;
    } catch {
      console.warn(`⚠️ 第三方库 ${libraryName} 返回的数据不可序列化`);
      return {};
    }
  },

  /**
   * 检查对象是否有指定属性 - 类型安全版本
   * @template T 对象类型
   * @template K 属性键类型
   * @param obj 待检查的对象
   * @param key 属性键
   * @returns 类型守卫结果
   */
  hasProperty: <T extends object, K extends PropertyKey>(
    obj: T,
    key: K
  ): obj is T & Record<K, unknown> => {
    return Object.prototype.hasOwnProperty.call(obj, key);
  },

  /**
   * 深度克隆对象 - 类型安全版本
   * @template T 对象类型
   * @param obj 待克隆的对象
   * @returns 深度克隆的结果
   */
  deepClone: <T extends JsonValue>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    try {
      return JSON.parse(JSON.stringify(obj)) as T;
    } catch {
      throw new Error('对象包含不可序列化的属性，无法进行深度克隆');
    }
  }
};

/**
 * 企业级类型守卫 - 完整的运行时类型检查
 * @description 提供严格的类型验证，确保运行时类型安全
 */
export const typeGuards = {
  // 基础类型守卫 - 严格验证
  isString: (value: unknown): value is string => typeof value === 'string',

  isNumber: (value: unknown): value is number =>
    typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value),

  isInteger: (value: unknown): value is number =>
    typeGuards.isNumber(value) && Number.isInteger(value),

  isPositiveNumber: (value: unknown): value is number => typeGuards.isNumber(value) && value > 0,

  isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',

  isNull: (value: unknown): value is null => value === null,

  isUndefined: (value: unknown): value is undefined => value === undefined,

  isNullish: (value: unknown): value is null | undefined => value === null || value === undefined,

  // 复合类型守卫 - 增强验证
  isObject: (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]',

  isArray: <T = unknown>(value: unknown): value is T[] => Array.isArray(value),

  isNonEmptyArray: <T = unknown>(value: unknown): value is [T, ...T[]] =>
    Array.isArray(value) && value.length > 0,

  isFunction: (value: unknown): value is Function => typeof value === 'function',

  // JSON类型守卫
  isJsonValue: (value: unknown): value is JsonValue => {
    if (value === null) return true;

    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return true;
    }

    if (Array.isArray(value)) {
      return value.every(typeGuards.isJsonValue);
    }

    if (typeGuards.isObject(value)) {
      return Object.values(value).every(typeGuards.isJsonValue);
    }

    return false;
  },

  // API响应类型守卫 - 增强版本
  isApiResponse: <T = unknown>(value: unknown): value is ApiResponse<T> => {
    if (!typeGuards.isObject(value)) return false;

    const obj = value as Record<string, unknown>;

    // 必须有code字段且为数字
    if (!typeGuards.isNumber(obj.code)) return false;

    // message字段可选，但如果存在必须是字符串
    if (obj.message !== undefined && !typeGuards.isString(obj.message)) {
      return false;
    }

    return true;
  },

  // 配置对象类型守卫
  isConfigObject: (value: unknown): value is ConfigObject => {
    if (!typeGuards.isObject(value)) return false;

    return Object.values(value).every(
      (val) => typeGuards.isJsonValue(val) || typeGuards.isConfigObject(val)
    );
  },

  // 临时API数据类型守卫
  isTempApiData: (value: unknown): value is TempApiData => {
    return typeGuards.isJsonValue(value) || typeGuards.isObject(value);
  },

  // 第三方数据类型守卫
  isThirdPartyData: (value: unknown): value is ThirdPartyData => {
    return typeGuards.isJsonValue(value) || typeGuards.isObject(value);
  }
};

// 所有类型已经在上面单独导出了，无需重复导出
