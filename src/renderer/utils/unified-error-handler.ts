/**
 * ⚠️ 统一错误处理工具
 * 整合项目中所有重复的错误处理逻辑
 *
 * 功能特性：
 * - 统一的错误类型定义
 * - 错误分类和优先级处理
 * - 用户友好的错误消息
 * - 错误恢复策略
 * - 错误日志和监控
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import type { ValidationInput } from '../types/consolidated-types';
import { unifiedTypeGuards } from './unified-type-guards';

// ============================================================================
// 统一的错误类型定义
// ============================================================================

/**
 * 错误类型枚举
 * 整合项目中分散的错误类型定义
 */
export enum UnifiedErrorType {
  NETWORK_ERROR = 'network',
  AUDIO_ERROR = 'audio',
  API_ERROR = 'api',
  VALIDATION_ERROR = 'validation',
  PERMISSION_ERROR = 'permission',
  TIMEOUT_ERROR = 'timeout',
  AUTH_ERROR = 'auth',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  LOGIN_ERROR = 'login',
  QR_CODE_ERROR = 'qr_code',
  UNKNOWN_ERROR = 'unknown'
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 统一错误类
 * 整合 AppError 和其他错误类的功能
 */
export class UnifiedAppError extends Error {
  public readonly type: UnifiedErrorType;
  public readonly severity: ErrorSeverity;
  public readonly recoverable: boolean;
  public readonly context?: Record<string, any>;
  public readonly originalError?: Error;
  public readonly timestamp: number;

  constructor(
    type: UnifiedErrorType,
    message: string,
    options: {
      severity?: ErrorSeverity;
      recoverable?: boolean;
      context?: Record<string, any>;
      originalError?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'UnifiedAppError';
    this.type = type;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.recoverable = options.recoverable ?? true;
    this.context = options.context;
    this.originalError = options.originalError;
    this.timestamp = Date.now();
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserFriendlyMessage(): string {
    return UnifiedErrorHandler.getUserFriendlyMessage(this);
  }

  /**
   * 获取错误的详细信息
   */
  getDetails(): Record<string, any> {
    return {
      type: this.type,
      severity: this.severity,
      recoverable: this.recoverable,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      originalError: this.originalError?.message
    };
  }
}

// ============================================================================
// 统一的错误处理器
// ============================================================================

/**
 * 统一错误处理器类
 * 整合 errorHandler.ts 和其他错误处理文件的功能
 */
export class UnifiedErrorHandler {
  private static errorHistory: Array<{
    error: UnifiedAppError;
    timestamp: number;
    recovered: boolean;
  }> = [];

  private static maxHistorySize = 50;
  private static recoveryStrategies: Map<
    UnifiedErrorType,
    (error: UnifiedAppError) => Promise<boolean>
  > = new Map();

  /**
   * 处理错误的主要方法
   * 整合项目中重复的错误处理逻辑
   */
  static handle(error: Error | UnifiedAppError | ValidationInput): void {
    const unifiedError = this.normalizeError(error);

    // 记录错误历史
    this.addToHistory(unifiedError);

    // 尝试错误恢复
    this.attemptRecovery(unifiedError);

    // 记录错误日志
    this.logError(unifiedError);

    // 通知用户（如果需要）
    this.notifyUser(unifiedError);
  }

  /**
   * 将各种错误类型标准化为UnifiedAppError
   */
  static normalizeError(error: Error | UnifiedAppError | ValidationInput): UnifiedAppError {
    if (error instanceof UnifiedAppError) {
      return error;
    }

    if (error instanceof Error) {
      return this.convertStandardError(error);
    }

    // 处理其他类型的错误
    return new UnifiedAppError(UnifiedErrorType.UNKNOWN_ERROR, String(error), {
      severity: ErrorSeverity.LOW
    });
  }

  /**
   * 转换标准Error为UnifiedAppError
   */
  private static convertStandardError(error: Error): UnifiedAppError {
    // 网络错误检测
    if (unifiedTypeGuards.isNetworkError(error)) {
      return new UnifiedAppError(UnifiedErrorType.NETWORK_ERROR, error.message, {
        severity: ErrorSeverity.HIGH,
        recoverable: true,
        originalError: error
      });
    }

    // 音频错误检测
    if (unifiedTypeGuards.isAudioError(error)) {
      return new UnifiedAppError(UnifiedErrorType.AUDIO_ERROR, error.message, {
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        originalError: error
      });
    }

    // 默认处理
    return new UnifiedAppError(UnifiedErrorType.UNKNOWN_ERROR, error.message, {
      severity: ErrorSeverity.MEDIUM,
      originalError: error
    });
  }

  /**
   * 获取用户友好的错误消息
   * 整合用户友好消息的生成逻辑
   */
  static getUserFriendlyMessage(error: UnifiedAppError): string {
    const messageMap: Record<UnifiedErrorType, string> = {
      [UnifiedErrorType.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
      [UnifiedErrorType.AUDIO_ERROR]: '音频播放出现问题，请稍后重试',
      [UnifiedErrorType.API_ERROR]: 'API服务异常，请稍后重试',
      [UnifiedErrorType.VALIDATION_ERROR]: '输入信息有误，请检查后重试',
      [UnifiedErrorType.PERMISSION_ERROR]: '权限不足，请检查相关设置',
      [UnifiedErrorType.TIMEOUT_ERROR]: '请求超时，请检查网络连接',
      [UnifiedErrorType.AUTH_ERROR]: '身份验证失败，请重新登录',
      [UnifiedErrorType.RESOURCE_NOT_FOUND]: '请求的资源不存在',
      [UnifiedErrorType.SERVICE_UNAVAILABLE]: '服务暂时不可用，请稍后重试',
      [UnifiedErrorType.LOGIN_ERROR]: '登录失败，请检查账号信息',
      [UnifiedErrorType.QR_CODE_ERROR]: '二维码获取失败，请稍后重试',
      [UnifiedErrorType.UNKNOWN_ERROR]: '发生未知错误，请稍后重试'
    };

    return messageMap[error.type] || error.message;
  }

  /**
   * 尝试错误恢复
   */
  private static async attemptRecovery(error: UnifiedAppError): Promise<boolean> {
    if (!error.recoverable) {
      return false;
    }

    const strategy = this.recoveryStrategies.get(error.type);
    if (strategy) {
      try {
        const recovered = await strategy(error);
        this.updateHistoryRecoveryStatus(error, recovered);
        return recovered;
      } catch (recoveryError) {
        console.error('🔄 错误恢复失败', recoveryError);
        return false;
      }
    }

    return false;
  }

  /**
   * 记录错误到历史
   */
  private static addToHistory(error: UnifiedAppError): void {
    this.errorHistory.push({
      error,
      timestamp: Date.now(),
      recovered: false
    });

    // 保持历史记录大小限制
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * 更新历史记录的恢复状态
   */
  private static updateHistoryRecoveryStatus(error: UnifiedAppError, recovered: boolean): void {
    const historyItem = this.errorHistory.reverse().find((item) => item.error === error);

    if (historyItem) {
      historyItem.recovered = recovered;
    }
  }

  /**
   * 记录错误日志
   */
  private static logError(error: UnifiedAppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.type}] ${error.message}`;

    switch (logLevel) {
      case 'error':
        console.error('❌', logMessage, error.getDetails());
        break;
      case 'warn':
        console.warn('⚠️', logMessage, error.getDetails());
        break;
      case 'info':
        console.info('ℹ️', logMessage, error.getDetails());
        break;
      default:
        console.log('📝', logMessage, error.getDetails());
    }
  }

  /**
   * 获取日志级别
   */
  private static getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  /**
   * 通知用户（可以集成消息组件）
   */
  private static notifyUser(error: UnifiedAppError): void {
    // 这里可以集成具体的消息通知组件
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      // 显示错误通知
      console.error('🚨 用户通知:', error.getUserFriendlyMessage());
    }
  }

  /**
   * 注册错误恢复策略
   */
  static registerRecoveryStrategy(
    type: UnifiedErrorType,
    strategy: (error: UnifiedAppError) => Promise<boolean>
  ): void {
    this.recoveryStrategies.set(type, strategy);
  }

  /**
   * 获取错误历史
   */
  static getErrorHistory(): Array<{
    error: UnifiedAppError;
    timestamp: number;
    recovered: boolean;
  }> {
    return [...this.errorHistory];
  }

  /**
   * 清理错误历史
   */
  static clearErrorHistory(): void {
    this.errorHistory = [];
  }
}

// ============================================================================
// 便捷的工具函数
// ============================================================================

/**
 * 快速创建网络错误
 */
export const createNetworkError = (
  message: string,
  context?: Record<string, any>
): UnifiedAppError => {
  return new UnifiedAppError(UnifiedErrorType.NETWORK_ERROR, message, {
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    context
  });
};

/**
 * 快速创建音频错误
 */
export const createAudioError = (
  message: string,
  context?: Record<string, any>
): UnifiedAppError => {
  return new UnifiedAppError(UnifiedErrorType.AUDIO_ERROR, message, {
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    context
  });
};

/**
 * 快速创建API错误
 */
export const createApiError = (message: string, context?: Record<string, any>): UnifiedAppError => {
  return new UnifiedAppError(UnifiedErrorType.API_ERROR, message, {
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    context
  });
};

/**
 * 快速处理错误
 */
export const handleError = (error: Error | UnifiedAppError | ValidationInput): void => {
  UnifiedErrorHandler.handle(error);
};

// ============================================================================
// 默认导出
// ============================================================================

export default UnifiedErrorHandler;
