/**
 * 类型定义辅助工具
 * 提供常用的类型工具函数，减少重复的类型定义工作
 */

// 通用API响应包装器
export type ApiResponse<T = unknown> = {
  code: number;
  message?: string;
  data?: T;
}

// 安全的any类型（带注释）
export type SafeAny = any; // 明确标识的any类型，用于临时/不稳定数据

// 部分可选类型
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 部分必需类型
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// 深度部分可选
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 提取数组元素类型
export type ArrayElement<T> = T extends (infer, U)[0] ? U : never;

// 临时API数据类型（明确标识）
export type TempApiData = SafeAny; // 用于临时API对接，避免过度类型定义

// 第三方库数据类型（明确标识）
export type ThirdPartyData = SafeAny; // 用于第三方库集成，避免复杂类型定义

// 配置对象类型（明确标识）
export type ConfigObject = Record<string, SafeAny>; // 用于复杂配置对象

/**
 * 类型断言辅助函数
 */
export const typeHelpers = {
  /**
   * 安全的类型断言，带运行时检查
   */
  safeCast: <T>(value: unknown, validator?: (val: unknown) => val is T): T => {
    if (validator && !validator(value)) {
      console.warn('类型断言失败，使用原始值');
    }
    return value as T;
  },

  /**
   * 临时API数据处理
   */
  _tempApi: (data: unknown): TempApiData => {
    console.log('🔄, 使用临时API数据，建议后续添加类型定义');
    return data as TempApiData;
  },

  /**
   * 第三方库数据处理
   */
  _thirdParty: (data: unknown): ThirdPartyData => {
    console.log('🔌, 使用第三方库数据');
    return data as ThirdPartyData;
  },

  /**
   * 检查对象是否有指定属性
   */
  _hasProperty: <T extends object, K extends string>(obj: T, _key: K;
  ): obj is T & Record<K, unknown> => {
    return key in obj;
  },
}

/**
 * 常用类型守卫
 */
export const typeGuards = {
  isString: (value: unknown): value is string => typeof value === 'string',
  isNumber: (value: unknown): value is number => typeof value === 'number',
  isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',
  isObject: (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value),
  isArray: (value: unknown): value is unknown[] => Array.isArray(value),
  isFunction: (value: unknown): value is Function => typeof value === 'function',

  // API响应类型守卫
  isApiResponse: <T>(value: unknown): value is ApiResponse<T> => {
    return ( typeGuards.isObject(value) && typeGuards.isNumber((value as Record<string, unknown>).code));
  },
}

// 所有类型已经在上面单独导出了，无需重复导出
