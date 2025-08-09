/**
 * ⚡ 统一异步处理工具模块
 * 提供一致的异步操作工具，包括重试、防抖、节流、队列等
 *
 * 功能特性：
 * - 智能重试机制（指数退避、条件重试）
 * - 防抖和节流函数
 * - 异步队列和并发控制
 * - Promise工具函数
 * - 超时控制和取消机制
 */

// 重试配置接口
export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential' | 'fixed';
  maxDelay?: number;
  retryCondition?: (error: unknown, _attempt: number) => boolean;
  onRetry?: (error: unknown, _attempt: number) => void;
}

// 防抖配置接口
export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

// 节流配置接口
export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

// 队列任务接口
export interface QueueTask<T = unknown> {
  id: string;
  fn: () => Promise<T>;
  priority?: number;
  timeout?: number;
}

/**
 * 🔄 智能重试函数
 * @deprecated 请使用 unified-helpers 中的 unifiedRetry 函数替代
 * 此函数将在下个版本中移除，请迁移到统一的重试工厂
 */
export const retry = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  console.warn('async/retry 已废弃，请使用 unified-helpers 中的 unifiedRetry');

  // 导入统一的重试函数
  const { unifiedRetry } = await import('../../unified-helpers');

  return unifiedRetry(fn, {
    maxRetries: options.maxRetries,
    delay: options.delay,
    backoff: options.backoff === 'fixed' ? 'linear' : options.backoff,
    maxDelay: options.maxDelay,
    shouldRetry: options.retryCondition,
    onRetry: options.onRetry
  });
};

/**
 * 🛡️ 网络请求重试（专门针对网络错误）
 * @deprecated 请使用 unified-helpers 中的 unifiedRetry 函数替代
 */
export const retryNetwork = <T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'retryCondition'> = {}
): Promise<T> => {
  return retry(fn, {
    ...options,
    retryCondition: (error) => {
      // 网络错误或5xx服务器错误才重试
      return (
        (error as any).code === 'NETWORK_ERROR' ||
        (error as any).code === 'TIMEOUT' ||
        ((error as any).response && (error as any).response.status >= 500)
      );
    }
  });
};

/**
 * ⏰ 防抖函数
 */
export const debounce = <T extends (...args: unknown[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): T & { cancel(): void; flush(): ReturnType<T> | undefined } => {
  const { leading = false, trailing = true, maxWait } = options;

  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let result: ReturnType<T> | undefined;

  const invokeFunc = (time: number): ReturnType<T> | undefined => {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  };

  const leadingEdge = (time: number): ReturnType<T> | undefined => {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  };

  const remainingWait = (time: number): number => {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  };

  const shouldInvoke = (time: number): boolean => {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const timerExpired = (): ReturnType<T> | undefined => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
    return undefined;
  };

  const trailingEdge = (time: number): ReturnType<T> | undefined => {
    timeoutId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = null;
    lastThis = null;
    return result;
  };

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = null;
    lastCallTime = null;
    lastThis = null;
    timeoutId = null;
    maxTimeoutId = null;
  };

  const flush = (): ReturnType<T> | undefined => {
    return timeoutId === null ? result : trailingEdge(Date.now());
  };

  const debounced = function (this: unknown, ...args: Parameters<T>): ReturnType<T> | undefined {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, wait);
    }
    return result;
  };

  (debounced as any).cancel = cancel;
  (debounced as any).flush = flush;

  return debounced as T & { cancel(): void; flush(): ReturnType<T> | undefined };
};

/**
 * 🚦 节流函数
 */
export const throttle = <T extends (...args: unknown[]) => any>(
  func: T,
  wait: number,
  _options: ThrottleOptions = {}
): T & { cancel(): void; flush(): ReturnType<T> | undefined } => {
  const { leading = true, trailing = true } = _options;

  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait
  });
};

/**
 * 😴 睡眠函数
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * ⏱️ 超时控制
 */
export const timeout = <T>(promise: Promise<T>, ms: number, message = '操作超时'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    })
  ]);
};

/**
 * 🎯 并发控制队列
 */
export class ConcurrencyQueue {
  private queue: QueueTask[] = [];
  private running: Set<string> = new Set();
  private maxConcurrency: number;

  constructor(maxConcurrency: number = 3) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * 添加任务到队列
   */
  add<T>(task: QueueTask<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask: QueueTask<T> = {
        ...task,
        fn: async () => {
          try {
            this.running.add(task.id);

            let result: T;
            if (task.timeout) {
              result = await timeout(task.fn(), task.timeout);
            } else {
              result = await task.fn();
            }

            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          } finally {
            this.running.delete(task.id);
            this.processQueue();
          }
        }
      };

      this.queue.push(wrappedTask);
      this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      this.processQueue();
    });
  }

  /**
   * 处理队列
   */
  private processQueue(): void {
    if (this.running.size >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (task) {
      task.fn().catch(() => {}); // 错误已在wrappedTask中处理
    }
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * 获取队列状态
   */
  getStatus(): {
    pending: number;
    running: number;
    maxConcurrency: number;
  } {
    return {
      pending: this.queue.length,
      running: this.running.size,
      maxConcurrency: this.maxConcurrency
    };
  }
}

/**
 * 🔄 批处理函数
 */
export const batch = async <T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: {
    batchSize?: number;
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<R[]> => {
  const { batchSize = 10, concurrency = 3, onProgress } = options;
  const results: R[] = [];
  const queue = new ConcurrencyQueue(concurrency);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map((item, batchIndex) => {
      const globalIndex = i + batchIndex;
      return queue.add({
        id: `batch-${globalIndex}`,
        fn: () => processor(item, globalIndex),
        priority: -globalIndex // 保持顺序
      });
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (onProgress) {
      onProgress(results.length, items.length);
    }
  }

  return results;
};

/**
 * 🎲 随机延迟
 */
export const randomDelay = (min: number, max: number): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return sleep(delay);
};

/**
 * 🔁 轮询函数
 */
export const poll = async <T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  options: {
    interval?: number;
    maxAttempts?: number;
    timeout?: number;
  } = {}
): Promise<T> => {
  const { interval = 1000, maxAttempts = 10, timeout: maxTimeout } = options;

  const startTime = Date.now();
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (maxTimeout && Date.now() - startTime > maxTimeout) {
      throw new Error('轮询超时');
    }

    try {
      const result = await fn();
      if (condition(result)) {
        return result;
      }
    } catch (error) {
      console.warn(`轮询第 ${attempts + 1} 次失败:`, error);
    }

    attempts++;
    if (attempts < maxAttempts) {
      await sleep(interval);
    }
  }

  throw new Error(`轮询失败，已尝试 ${maxAttempts}, 次`);
};

// 导出所有异步工具的集合
export const asyncUtils = {
  retry,
  retryNetwork,
  debounce,
  throttle,
  sleep,
  timeout,
  batch,
  randomDelay,
  poll,
  ConcurrencyQueue
} as const;
