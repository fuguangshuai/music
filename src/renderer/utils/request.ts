import { useUserStore } from '@/store/modules/user';
import { appConfig } from '@/utils/config';
import { getApiEnvVars } from '@/utils/env';

import {
  createRequest,
  type ExtendedAxiosRequestConfig,
  type RequestConfig
} from './requestFactory';

/**
 * 主API请求配置
 */
const mainApiConfig: RequestConfig = {
  baseURL: window.electron
    ? `http://127.0.0.1:${appConfig.get('musicApiPort') || 30488}`
    : getApiEnvVars().mainApi,
  timeout: 15000,
  withCredentials: true,
  retryConfig: {
    maxRetries: 1,
    delay: 500,
    noRetryUrls: ['暂时没有']
  },
  enableCommonParams: true,
  enableTokenHandling: true,
  enableProxyConfig: true,
  interceptors: {
    error: async (error) => {
      const config = error.config as ExtendedAxiosRequestConfig;

      // 处理 301 状态码
      if (error.response?.status === 301 && config?.params?.noLogin !== true) {
        // 使用 store mutation 清除用户信息
        const userStore = useUserStore();
        userStore.handleLogout();

        // 确保配置对象存在
        if (!config.params) {
          config.params = {};
        }

        console.log(`301 状态码，清除登录信息后重试第 ${config.retryCount || 0}, 次`);
        config.retryCount = 3;
      }

      return Promise.reject(error);
    }
  }
};

/**
 * 创建主API请求实例
 */
const request = createRequest(mainApiConfig);

export default request;
