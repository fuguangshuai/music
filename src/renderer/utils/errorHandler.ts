/**
 * 统一错误处理系统
 */

/**
 * 错误类型枚举
 */
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUDIO_ERROR: 'AUDIO_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorType = (typeof ErrorTypes)[keyof typeof ErrorTypes];

/**
 * 应用错误类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public code?: string,
    public details?: any,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 网络错误类
 */
export class NetworkError extends AppError {
  constructor(message: string, code?: string, details?: any) {
    super(message, ErrorTypes.NETWORK_ERROR, code, details, true);
    this.name = 'NetworkError';
  }
}

/**
 * 音频错误类
 */
export class AudioError extends AppError {
  constructor(message: string, code?: string, details?: any) {
    super(message, ErrorTypes.AUDIO_ERROR, code, details, true);
    this.name = 'AudioError';
  }
}

/**
 * 错误处理器接口
 */
interface ErrorHandler {
  handle(error: Error | AppError): void;
}

/**
 * 用户友好的错误处理器
 */
class UserFriendlyErrorHandler implements ErrorHandler {
  handle(error: Error | AppError): void {
    console.error('错误处理:', error);

    if (error instanceof AppError) {
      this.handleAppError(error);
    } else {
      this.handleGenericError(error);
    }
  }

  private handleAppError(error: AppError): void {
    const errorMessage = this.getErrorMessage(error);

    // 使用console输出，避免Vue组合式API问题
    switch (error.type) {
      case ErrorTypes.NETWORK_ERROR:
        console.error('网络错误:', errorMessage);
        break;

      case ErrorTypes.AUDIO_ERROR:
        console.warn('音频错误:', errorMessage);
        break;

      case ErrorTypes.PERMISSION_ERROR:
        console.error('权限错误:', errorMessage);
        break;

      default:
        console.error('未知错误:', errorMessage);
    }
  }

  private handleGenericError(error: Error): void {
    const message = error.message || '未知错误';
    console.error('通用错误:', message);
  }

  private getErrorMessage(error: AppError): string {
    // 简化错误消息处理，避免i18n依赖
    return error.message || `${error.type}: ${error.code || 'UNKNOWN'}`;
  }
}

/**
 * 全局错误处理器
 */
class GlobalErrorHandler {
  private handlers: ErrorHandler[] = [];
  private isHandlingError = false; // 防止递归错误处理

  constructor() {
    this.setupGlobalHandlers();
  }

  addHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  handle(error: Error | AppError): void {
    this.handlers.forEach((handler) => {
      try {
        handler.handle(error);
      } catch (handlerError) {
        console.error('错误处理器本身出错:', handlerError);
      }
    });
  }

  private setupGlobalHandlers(): void {
    // 捕获未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      try {
        // 防止递归错误处理
        if (this.isHandlingError) {
          console.error('错误处理器本身出错，直接输出:', event.reason);
          return;
        }

        console.error('未处理的 Promise 拒绝:', event.reason);
        this.isHandlingError = true;
        this.handle(
          new AppError(
            '发生了未预期的错误',
            ErrorTypes.UNKNOWN_ERROR,
            'UNHANDLED_REJECTION',
            event.reason
          )
        );
        event.preventDefault();
      } catch (handlerError) {
        console.error('错误处理器异常:', handlerError);
      } finally {
        this.isHandlingError = false;
      }
    });

    // 捕获全局错误
    window.addEventListener('error', (event) => {
      try {
        // 防止递归错误处理
        if (this.isHandlingError) {
          console.error('错误处理器本身出错，直接输出:', event.error);
          return;
        }

        console.error('全局错误:', event.error);
        this.isHandlingError = true;
        this.handle(
          new AppError('发生了未预期的错误', ErrorTypes.UNKNOWN_ERROR, 'GLOBAL_ERROR', event.error)
        );
      } catch (handlerError) {
        console.error('错误处理器异常:', handlerError);
      } finally {
        this.isHandlingError = false;
      }
    });
  }
}

// 创建全局错误处理器实例
export const globalErrorHandler = new GlobalErrorHandler();

// 添加用户友好的错误处理器
globalErrorHandler.addHandler(new UserFriendlyErrorHandler());

/**
 * 便捷的错误处理函数
 */
export const handleError = (error: Error | AppError): void => {
  globalErrorHandler.handle(error);
};

/**
 * 创建特定类型的错误
 */
export const createNetworkError = (message: string, code?: string, details?: any): NetworkError => {
  return new NetworkError(message, code, details);
};

export const createAudioError = (message: string, code?: string, details?: any): AudioError => {
  return new AudioError(message, code, details);
};

/**
 * 错误重试装饰器
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (i === maxRetries) {
        throw lastError;
      }

      // 指数退避，但限制最大延迟
      const currentDelay = Math.min(delay * Math.pow(2, i), 10000);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }

  // 这里理论上不会到达，但为了类型安全
  throw lastError || new Error('重试失败，未知错误');
};
