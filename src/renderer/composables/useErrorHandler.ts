/**
 * Vue 组合式函数：错误处理
 * 专门用于在 Vue 组件中处理错误
 */

import { useMessage } from 'naive-ui';
import { useI18n } from 'vue-i18n';

import { AppError } from '@/utils/errorHandler';
import { ErrorTypes } from '@/utils/errorHandler';

/**
 * 错误处理组合式函数
 */
export const useErrorHandler = () => {
  const message = useMessage();
  const { t } = useI18n();

  /**
   * 处理应用错误
   */
  const handleAppError = (error: AppError) => {
    const errorMessage = getErrorMessage(error);

    switch (error.type) {
      case ErrorTypes.NETWORK_ERROR:
        message.error(errorMessage, {
          duration: 5000,
          closable: true
        });
        break;

      case ErrorTypes.AUDIO_ERROR:
        message.warning(errorMessage, {
          duration: 3000,
          closable: true
        });
        break;

      case ErrorTypes.PERMISSION_ERROR:
        message.error(errorMessage, {
          duration: 0, // 不自动关闭
          closable: true
        });
        break;

      default:
        message.error(errorMessage);
    }
  };

  /**
   * 处理通用错误
   */
  const handleGenericError = (error: Error) => {
    const errorMessage = error.message || t('error.unknown', '发生了未知错误');
    message.error(errorMessage);
  };

  /**
   * 统一错误处理入口
   */
  const handleError = (error: Error | AppError) => {
    console.error('组件错误处理:', error);

    if (error instanceof AppError) {
      handleAppError(error);
    } else {
      handleGenericError(error);
    }
  };

  /**
   * 获取本地化的错误消息
   */
  const getErrorMessage = (error: AppError): string => {
    // 尝试获取本地化消息，如果失败则使用默认消息
    try {
      const key = `error.${error.type.toLowerCase()}.${error.code || 'default'}`;
      const localizedMessage = t(key);

      // 如果本地化消息就是 key 本身，说明没有找到对应的翻译
      if (localizedMessage === key) {
        return getDefaultErrorMessage(error);
      }

      return localizedMessage;
    } catch {
      return getDefaultErrorMessage(error);
    }
  };

  /**
   * 获取默认错误消息
   */
  const getDefaultErrorMessage = (error: AppError): string => {
    const typeMessages = {
      [ErrorTypes.NETWORK_ERROR]: '网络连接错误',
      [ErrorTypes.AUDIO_ERROR]: '音频播放错误',
      [ErrorTypes.PERMISSION_ERROR]: '权限错误',
      [ErrorTypes.VALIDATION_ERROR]: '数据验证错误',
      [ErrorTypes.UNKNOWN_ERROR]: '未知错误'
    };

    const typeMessage = typeMessages[error.type] || '未知错误';
    return `${typeMessage}: ${error.message}`;
  };

  /**
   * 显示成功消息
   */
  const showSuccess = (msg: string) => {
    message.success(msg);
  };

  /**
   * 显示警告消息
   */
  const showWarning = (msg: string) => {
    message.warning(msg);
  };

  /**
   * 显示信息消息
   */
  const showInfo = (msg: string) => {
    message.info(msg);
  };

  return {
    handleError,
    handleAppError,
    handleGenericError,
    showSuccess,
    showWarning,
    showInfo
  };
};
