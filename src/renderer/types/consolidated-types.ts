/**
 * 整合类型定义文件
 *
 * 目标：
 * 1. 替换项目中的 unknown 类型为更具体的类型
 * 2. 整合重复的类型定义
 * 3. 提供类型安全的工具函数
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import type { StandardApiResponse } from './enhanced-api-types';

// ============================================================================
// 基础类型定义
// ============================================================================

/**
 * 通用对象类型 - 替代 [key: string]: unknown
 * @description 用于动态对象结构，提供基本的类型安全
 */
export type GenericObject = Record<string, any>;

/**
 * 通用数组类型 - 替代 unknown[]
 * @description 用于动态数组内容，支持泛型约束
 */
export type GenericArray<T = any> = T[];

/**
 * 错误类型 - 替代 catch (error: unknown)
 * @description 统一的错误处理类型，兼容各种错误格式
 */
export type ErrorType = Error | string | any;

/**
 * 事件处理器参数类型 - 替代 unknown 参数
 * @description 事件回调函数的参数类型
 */
export type EventHandlerArgs = any[];

/**
 * API响应数据类型 - 替代 unknown 响应
 * @description 用于处理动态API响应结构
 */
export type ApiResponseData = any;

/**
 * 配置对象类型 - 替代 unknown 配置
 * @description 用于动态配置对象
 */
export type ConfigData = Record<string, any>;

/**
 * 验证函数参数类型 - 替代 unknown 验证参数
 * @description 类型守卫和验证函数的输入类型
 */
export type ValidationInput = any;

/**
 * 函数参数类型 - 替代 ...args: unknown[]
 */
export type FunctionArgs = any[];

// ============================================================================
// API 相关类型
// ============================================================================

/**
 * 共享媒体“Like”类型：用于统一 utils 返回值类型，避免直接使用 any/any[]
 * 说明：保持字段可选与宽松（索引签名），不改变现有运行时结构
 */
export interface ArtistLike extends GenericObject {
  id?: number | string;
  name?: string;
  picUrl?: string;
  alias?: string[];
}

export interface AlbumLike extends GenericObject {
  id?: number | string;
  name?: string;
  picUrl?: string;
  artist?: ArtistLike;
  artists?: ArtistLike[];
  publishTime?: number;
}

export interface SongLike extends GenericObject {
  id?: number | string;
  name?: string;
  ar?: ArtistLike[];
  artists?: ArtistLike[];
  al?: AlbumLike;
  album?: AlbumLike;
  duration?: number;
  dt?: number;
  picUrl?: string;
}

export interface PlaylistLike extends GenericObject {
  id?: number | string;
  name?: string;
  coverImgUrl?: string;
  playCount?: number;
  bookCount?: number;
  tracks?: SongLike[];
}

/**
 * 统一的 API 响应类型
 */
export type ApiResponse<T = any> = StandardApiResponse<T>;

/**
 * 歌曲记录项类型 - 替代用户页面中的 unknown
 */
export interface SongRecord {
  id: number;
  name: string;
  song?: {
    id: number;
    name: string;
    al?: {
      picUrl?: string;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * 艺术家类型 - 替代艺术家相关的 unknown
 */
export interface Artist {
  id: number;
  name: string;
  picUrl?: string;
  [key: string]: any;
}

/**
 * 歌曲类型 - 替代歌曲相关的 unknown
 */
export interface Song {
  id: number;
  name: string;
  artists?: Artist[];
  album?: {
    id: number;
    name: string;
    picUrl?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * 榜单项类型 - 替代榜单相关的 unknown
 */
export interface ToplistItem {
  id: number;
  name: string;
  coverImgUrl?: string;
  [key: string]: any;
}

// ============================================================================
// 工具函数类型
// ============================================================================

/**
 * 防抖函数类型 - 替代 unknown 参数
 */
export type DebounceFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T> | undefined;

/**
 * 类型守卫函数类型
 */
export type TypeGuard<T> = (value: any) => value is T;

/**
 * 验证器函数类型
 */
export type Validator = (value: any) => boolean;

/**
 * 格式化函数类型
 */
export type Formatter<T, R = string> = (input: T) => R;

// ============================================================================
// 组件相关类型
// ============================================================================

/**
 * 组件 Props 基础类型
 */
export interface BaseComponentProps {
  [key: string]: any;
}

/**
 * 事件处理器类型
 */
export type EventHandler<T = any> = (event: T) => void;

/**
 * 异步事件处理器类型
 */
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

// ============================================================================
// 服务相关类型
// ============================================================================

/**
 * 音频均衡器类型 - 替代 eqService 中的 unknown
 */
export interface AudioEqualizer {
  connect: (node: AudioNode) => void;
  disconnect: () => void;
  [key: string]: any;
}

/**
 * 音频处理器类型
 */
export interface AudioProcessor {
  context: AudioContext;
  source?: AudioNode;
  destination?: AudioNode;
  [key: string]: any;
}

/**
 * 插件类型 - 替代插件系统中的 unknown
 */
export interface Plugin {
  name: string;
  version: string;
  install: (app: any) => void | Promise<void>;
  [key: string]: any;
}

// ============================================================================
// 缓存相关类型
// ============================================================================

/**
 * 缓存项类型
 */
export interface CacheItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiry?: number;
}

/**
 * 缓存配置类型
 */
export interface CacheConfig {
  maxSize?: number;
  ttl?: number;
  [key: string]: any;
}

// ============================================================================
// 类型断言工具函数
// ============================================================================

/**
 * 检查是否为对象
 */
export const isObject = (value: any): value is GenericObject => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * 检查是否为数组
 */
export const isArray = (value: any): value is GenericArray => {
  return Array.isArray(value);
};

/**
 * 检查是否为函数
 */
export const isFunction = (value: any): value is Function => {
  return typeof value === 'function';
};

/**
 * 检查是否为字符串
 */
export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

/**
 * 检查是否为数字
 */
export const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * 安全的类型转换
 */
export const safeTypeConversion = <T>(value: any, validator: TypeGuard<T>, fallback: T): T => {
  return validator(value) ? value : fallback;
};

// ============================================================================
// 统一的重试和错误处理类型
// ============================================================================

/**
 * 重试配置选项 - 整合项目中的重试逻辑
 *
 * 整合来源：
 * - utils/modules/async/index.ts 中的 RetryOptions 接口
 * - utils/retry.ts 中的重试配置
 * - utils/errorHandler.ts 中的重试逻辑
 *
 * 统一了项目中分散的重试配置，提供一致的重试行为
 */
export interface UnifiedRetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  maxDelay?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * 统一的错误类型 - 替代项目中分散的错误处理
 */
export interface UnifiedError {
  code: string;
  message: string;
  type: 'network' | 'audio' | 'api' | 'validation' | 'unknown';
  recoverable: boolean;
  context?: Record<string, any>;
  originalError?: Error;
}

/**
 * API 响应处理器类型
 */
export type ApiResponseHandler<T> = (response: any) => T;

/**
 * 错误恢复策略类型
 */
export type ErrorRecoveryStrategy = (error: UnifiedError) => Promise<boolean>;

// ============================================================================
// 统一的格式化函数类型
// ============================================================================

/**
 * 时间格式化选项 - 整合多个格式化模块
 */
export interface UnifiedTimeFormatOptions {
  format?: 'mm:ss' | 'hh:mm:ss' | 'auto';
  showHours?: boolean;
  padZero?: boolean;
}

/**
 * 数字格式化选项
 */
export interface UnifiedNumberFormatOptions {
  locale?: string;
  precision?: number;
  useGrouping?: boolean;
  notation?: 'standard' | 'compact';
}

// ============================================================================
// 统一的缓存类型
// ============================================================================

/**
 * 缓存策略类型
 */
export type CacheStrategy = 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';

/**
 * 缓存项接口 - 整合项目中的缓存实现
 */
export interface UnifiedCacheItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiry?: number;
  strategy: CacheStrategy;
  metadata?: Record<string, any>;
}

// ============================================================================
// 统一的API接口模式
// ============================================================================

/**
 * 通用API参数接口 - 整合项目中重复的参数定义
 *
 * 整合来源：
 * - utils/modules/async/index.ts 中的 QueueTask 接口
 * - types/enhanced-api-types.ts 中的分页参数
 * - 各个API文件中的重复参数定义
 */
export interface BaseApiParams {
  limit?: number;
  offset?: number;
}

/**
 * 分页参数接口
 */
export interface PaginationParams extends BaseApiParams {
  page?: number;
  pageSize?: number;
}

/**
 * 搜索参数接口
 */
export interface SearchParams extends BaseApiParams {
  keyword?: string;
  type?: string;
}

/**
 * 音乐相关API参数
 */
export interface MusicApiParams extends BaseApiParams {
  id?: number | string;
  ids?: (number | string)[];
  br?: number;
  cookie?: string;
}

/**
 * 用户相关API参数
 */
export interface UserApiParams extends BaseApiParams {
  uid?: number;
  userId?: number;
}

// ============================================================================
// 统一的验证规则类型
// ============================================================================

/**
 * 验证规则接口 - 整合项目中的验证逻辑
 */
export interface UnifiedValidationRule<T = any> {
  name: string;
  validate: (value: T) => boolean | Promise<boolean>;
  message: string;
  level?: 'error' | 'warning';
}

/**
 * 验证结果接口
 */
export interface UnifiedValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 验证器类型
 */
export type UnifiedValidator<T = any> = (
  value: T
) => UnifiedValidationResult | Promise<UnifiedValidationResult>;

// ============================================================================
// 统一的服务接口模式
// ============================================================================

/**
 * 基础服务接口
 */
export interface BaseService {
  name: string;
  version: string;
  initialize(): Promise<void> | void;
  destroy(): Promise<void> | void;
}

/**
 * 缓存服务接口
 */
export interface CacheServiceInterface extends BaseService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<boolean>;
  getStats(): Promise<Record<string, any>>;
}

/**
 * 音频服务接口
 */
export interface AudioServiceInterface extends BaseService {
  play(url: string): Promise<void>;
  pause(): void;
  stop(): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  getDuration(): number;
}

// ============================================================================
// 统一的组件Props模式
// ============================================================================

/**
 * 基础组件Props
 */
export interface BaseComponentProps {
  id?: string;
  className?: string;
  style?: Record<string, any>;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * 音乐组件Props
 */
export interface MusicComponentProps extends BaseComponentProps {
  songId?: number | string;
  playlistId?: number | string;
  autoPlay?: boolean;
}

/**
 * 列表组件Props
 */
export interface ListComponentProps extends BaseComponentProps {
  data: any[];
  loading?: boolean;
  empty?: boolean;
  pagination?: PaginationParams;
  onLoadMore?: () => void;
}
