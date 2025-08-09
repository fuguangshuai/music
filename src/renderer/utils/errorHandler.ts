/**
 * 统一错误处理系统
 * 包含错误类型定义、错误类和统一的重试机制
 */

/**
 * 错误类型枚举
 */
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUDIO_ERROR: 'AUDIO_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  API_ERROR: 'API_ERROR',
  LOGIN_ERROR: 'LOGIN_ERROR',
  QR_CODE_ERROR: 'QR_CODE_ERROR'
} as const;

export type ErrorType = (typeof ErrorTypes)[keyof typeof ErrorTypes];

/**
 * 应用错误类
 */
export class AppError extends Error {
  constructor(
    _message: string,
    public type: ErrorType,
    public code?: string,
    public _details?: Record<string, unknown>,
    public recoverable: boolean = true
  ) {
    super(_message);
    this.name = 'AppError';
  }
}

/**
 * 网络错误类
 */
export class NetworkError extends AppError {
  constructor(_message: string, code?: string, _details?: Record<string, unknown>) {
    super(_message, ErrorTypes.NETWORK_ERROR, code, _details, true);
    this.name = 'NetworkError';
  }
}

/**
 * 音频错误类
 */
export class AudioError extends AppError {
  constructor(_message: string, code?: string, _details?: Record<string, unknown>) {
    super(_message, ErrorTypes.AUDIO_ERROR, code, _details, true);
    this.name = 'AudioError';
  }
}

/**
 * 错误处理器接口
 */
interface ErrorHandler {
  handle(error: Error | AppError): void;
}

// 错误恢复策略接口
interface ErrorRecoveryStrategy {
  canRecover(error: AppError): boolean;
  recover(error: AppError): Promise<boolean>;
  getRecoveryMessage(error: AppError): string;
}

// 网络错误恢复策略
class NetworkErrorRecovery implements ErrorRecoveryStrategy {
  canRecover(error: AppError): boolean {
    return error.type === ErrorTypes.NETWORK_ERROR;
  }

  async recover(__error: AppError): Promise<boolean> {
    // 简单的重试机制
    console.log('🔄, 尝试网络错误恢复...');

    // 检查网络连接
    if (!navigator.onLine) {
      console.log('📴, 网络未连接，等待网络恢复...');
      return false;
    }

    // 等待一段时间后重试
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true;
  }

  getRecoveryMessage(__error: AppError): string {
    return '网络连接异常，正在尝试重新连接...';
  }
}

// 音频错误恢复策略
class AudioErrorRecovery implements ErrorRecoveryStrategy {
  canRecover(error: AppError): boolean {
    return error.type === ErrorTypes.AUDIO_ERROR;
  }

  async recover(__error: AppError): Promise<boolean> {
    console.log('🎵, 尝试音频错误恢复...');

    // 尝试重新加载音频
    try {
      // 这里可以添加具体的音频恢复逻辑
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    } catch (recoveryError) {
      console.error('音频恢复失败:', recoveryError);
      return false;
    }
  }

  getRecoveryMessage(__error: AppError): string {
    return '音频播放出现问题，正在尝试修复...';
  }
}

/**
 * 增强的用户友好错误处理器
 */
class EnhancedUserFriendlyErrorHandler implements ErrorHandler {
  private recoveryStrategies: ErrorRecoveryStrategy[] = [
    new NetworkErrorRecovery(),
    new AudioErrorRecovery()
  ];

  private errorHistory: Array<{ error: AppError; timestamp: number; recovered: boolean }> = [];
  private maxHistorySize = 50;

  handle(error: Error | AppError): void {
    console.error('增强错误处理:', error);

    if (error instanceof AppError) {
      this.handleAppErrorWithRecovery(error);
    } else {
      this.handleGenericError(error);
    }
  }

  /**
   * 处理应用错误并尝试恢复
   */
  private async handleAppErrorWithRecovery(error: AppError): Promise<void> {
    // 记录错误历史
    this.addToErrorHistory(error);

    // 检查是否可以恢复
    const strategy = this.recoveryStrategies.find((s) => s.canRecover(error));

    if (strategy && error.recoverable) {
      console.log(`🔧 尝试错误恢复: ${strategy.getRecoveryMessage(error)}`);

      try {
        const recovered = await strategy.recover(error);

        if (recovered) {
          console.log('✅, 错误恢复成功');
          this.updateErrorHistory(error, true);
          return;
        }
      } catch (recoveryError) {
        console.error('❌ 错误恢复失败:', recoveryError);
      }
    }

    // 如果无法恢复，使用原有的错误处理逻辑
    this.handleAppError(error);
    this.updateErrorHistory(error, false);
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

  /**
   * 添加到错误历史
   */
  private addToErrorHistory(error: AppError): void {
    this.errorHistory.push({
      error,
      timestamp: Date.now(),
      recovered: false
    });

    // 限制历史记录大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * 更新错误历史的恢复状态
   */
  private updateErrorHistory(error: AppError, recovered: boolean): void {
    const historyItem = this.errorHistory
      .slice()
      .reverse()
      .find((item) => item.error === error);

    if (historyItem) {
      historyItem.recovered = recovered;
    }
  }

  /**
   * 获取错误统计信息
   */
  getErrorStats(): {
    totalErrors: number;
    recoveredErrors: number;
    recoveryRate: number;
    recentErrors: Array<{ type: string; timestamp: number; recovered: boolean }>;
  } {
    const totalErrors = this.errorHistory.length;
    const recoveredErrors = this.errorHistory.filter((item) => item.recovered).length;
    const recoveryRate = totalErrors > 0 ? (recoveredErrors / totalErrors) * 100 : 0;

    const recentErrors = this.errorHistory.slice(-10).map((item) => ({
      type: item.error.type,
      timestamp: item.timestamp,
      recovered: item.recovered
    }));

    return {
      totalErrors,
      recoveredErrors,
      recoveryRate,
      recentErrors
    };
  }

  private handleGenericError(error: Error): void {
    const _message = (error instanceof Error ? error.message : String(error)) || '未知错误';
    console.error('通用错误:', _message);
  }

  private getErrorMessage(error: AppError): string {
    // 简化错误消息处理，避免i18n依赖
    return (
      (error instanceof Error ? error.message : String(error)) ||
      `${error.type}: ${error.code || 'UNKNOWN'}`
    );
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

// 添加增强的用户友好错误处理器
globalErrorHandler.addHandler(new EnhancedUserFriendlyErrorHandler());

/**
 * 便捷的错误处理函数
 */
export const handleError = (error: Error | AppError): void => {
  globalErrorHandler.handle(error);
};

/**
 * 创建特定类型的错误
 */
export const createNetworkError = (
  _message: string,
  code?: string,
  _details?: Record<string, unknown>
): NetworkError => {
  return new NetworkError(_message, code, _details);
};

export const createAudioError = (
  _message: string,
  code?: string,
  _details?: Record<string, unknown>
): AudioError => {
  return new AudioError(_message, code, _details);
};

/**
 * 错误重试装饰器
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  _delay: number = 1000
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
      const currentDelay = Math.min(_delay * Math.pow(2, i), 10000);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }

  // 这里理论上不会到达，但为了类型安全
  throw lastError || new Error('重试失败，未知错误');
};

/**
 * 创建用户友好的错误消息
 */
export function createUserFriendlyMessage(error: AppError): string {
  const errorMessages: Record<ErrorType, string> = {
    [ErrorTypes.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
    [ErrorTypes.AUDIO_ERROR]: '音频播放出现问题，请稍后重试',
    [ErrorTypes.PERMISSION_ERROR]: '权限不足，请检查相关设置',
    [ErrorTypes.VALIDATION_ERROR]: '输入信息有误，请检查后重试',
    [ErrorTypes.UNKNOWN_ERROR]: '发生未知错误，请稍后重试',
    [ErrorTypes.SERVICE_UNAVAILABLE]: '服务暂时不可用，请稍后重试',
    [ErrorTypes.TIMEOUT_ERROR]: '请求超时，请检查网络连接',
    [ErrorTypes.AUTH_ERROR]: '身份验证失败，请重新登录',
    [ErrorTypes.RESOURCE_NOT_FOUND]: '请求的资源不存在',
    [ErrorTypes.API_ERROR]: 'API服务异常，请稍后重试',
    [ErrorTypes.LOGIN_ERROR]: '登录失败，请检查账号信息',
    [ErrorTypes.QR_CODE_ERROR]: '二维码获取失败，请稍后重试'
  };

  return errorMessages[error.type] || error.message;
}

/**
 * 创建登录错误的用户建议
 */
export function createLoginErrorSuggestion(error: AppError): string[] {
  const suggestions: Partial<Record<ErrorType, string[]>> = {
    [ErrorTypes.NETWORK_ERROR]: ['检查网络连接是否正常', '尝试切换网络环境', '稍后重试'],
    [ErrorTypes.QR_CODE_ERROR]: ['刷新二维码重试', '尝试使用手机号登录', '检查网络连接'],
    [ErrorTypes.API_ERROR]: ['服务可能暂时不可用', '尝试其他登录方式', '稍后重试'],
    [ErrorTypes.SERVICE_UNAVAILABLE]: ['登录服务暂时不可用', '尝试使用Cookie登录', '等待服务恢复'],
    [ErrorTypes.TIMEOUT_ERROR]: ['网络响应较慢', '检查网络连接', '重新尝试'],
    [ErrorTypes.LOGIN_ERROR]: ['检查账号密码是否正确', '尝试其他登录方式', '重置密码']
  };

  return suggestions[error.type] || ['请稍后重试', '如问题持续存在，请联系技术支持'];
}
