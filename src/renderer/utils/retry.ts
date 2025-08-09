/**
 * 统一重试工具函数
 * 提供一致的重试逻辑，支持多种退避策略
 */

// 错误详情接口
interface ErrorDetails {
  code?: string;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * 重试选项配置
 */
export interface RetryOptions {
  /** 最大重试次数，默认3次 */
  maxRetries?: number;
  /** 基础延迟时间（毫秒），默认1000ms */
  delay?: number;
  /** 退避策略，默认指数退避 */
  backoff?: 'linear' | 'exponential';
  /** 最大延迟时间（毫秒），默认10000ms */
  maxDelay?: number;
  /** 重试条件判断函数，返回true时才重试 */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** 重试前的回调函数 */
  onRetry?: (error: Error, attempt: number, details?: ErrorDetails) => void;
}

/**
 * 重试结果类型
 */
export interface RetryResult<T> {
  /** 执行结果 */
  result: T;
  /** 实际重试次数 */
  attempts: number;
  /** 总耗时（毫秒） */
  duration: number;
}

/**
 * 默认的重试条件判断
 */
const defaultShouldRetry = (error: Error, _attempt: number): boolean => {
  // 网络错误或超时错误通常可以重试
  const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'ECONNRESET', 'ENOTFOUND'];
  return retryableErrors.some((type) => error.message.includes(type) || error.name.includes(type));
};

/**
 * 统一的重试函数
 * @deprecated 请使用 unifiedRetry 替代，此函数将在下个版本中移除
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 执行结果
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  // 导入统一的重试函数
  const { unifiedRetry } = await import('./unified-helpers');

  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 'exponential',
    maxDelay = 10000,
    shouldRetry = defaultShouldRetry,
    onRetry
  } = options;

  return unifiedRetry(fn, {
    maxRetries,
    delay,
    backoff,
    maxDelay,
    shouldRetry,
    onRetry
  });
};

/**
 * 带有详细结果的重试函数
 * @deprecated 请使用 unifiedRetry 替代，此函数将在下个版本中移除
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 包含详细信息的执行结果
 */
export const withRetryDetailed = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> => {
  const startTime = Date.now();
  let attempts = 0;

  const result = await withRetry(fn, {
    ...options,
    onRetry: (error, attempt) => {
      attempts = attempt + 1;
      options.onRetry?.(error, attempt);
    }
  });

  return {
    result,
    attempts: attempts + 1,
    duration: Date.now() - startTime
  };
};

/**
 * 为特定错误类型创建重试函数
 * @deprecated 请使用 unifiedRetry 替代，此函数将在下个版本中移除
 * @param errorTypes 可重试的错误类型
 * @returns 重试函数
 */
export const createRetryForErrors = (errorTypes: string[]) => {
  return <T>(fn: () => Promise<T>, options: Omit<RetryOptions, 'shouldRetry'> = {}) => {
    return withRetry(fn, {
      ...options,
      shouldRetry: (error: Error) => {
        return errorTypes.some((type) => error.message.includes(type) || error.name.includes(type));
      }
    });
  };
};

/**
 * 网络请求专用重试函数
 * @deprecated 请使用 unifiedRetry 替代，此函数将在下个版本中移除
 */
export const withNetworkRetry = createRetryForErrors([
  'NETWORK_ERROR',
  'TIMEOUT',
  'ECONNRESET',
  'ENOTFOUND',
  'ECONNREFUSED',
  'ERR_NETWORK'
]);

/**
 * 音频操作专用重试函数
 * @deprecated 请使用 unifiedRetry 替代，此函数将在下个版本中移除
 */
export const withAudioRetry = createRetryForErrors([
  'AUDIO_ERROR',
  'MediaError',
  'NotAllowedError',
  'NotSupportedError'
]);
