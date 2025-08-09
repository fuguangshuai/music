import type { AxiosInstance, AxiosRequestConfig } from 'axios';

import { getApiEnvVars } from '@/utils/env';
import { withRetry } from '@/utils/retry';

import { createRequest, type RequestConfig } from './requestFactory';

// API地址配置数组
const getApiUrls = () => {
  const envVars = getApiEnvVars();
  return [
    envVars._musicApi, // 0: 主API
    envVars._musicApiBackup // 1: 备用API
  ].filter(Boolean); // 过滤掉空值
};

/**
 * 创建音乐请求实例
 * @param apiIndex API索引，默认0（主API）
 * @returns axios实例
 */
const requestMusic = (apiIndex: number = 0): AxiosInstance => {
  const apiUrls = getApiUrls();

  // 边界检查
  if (apiIndex < 0 || apiIndex >= apiUrls.length) {
    console.warn(`无效的API索引: ${apiIndex}，使用默认API`);
    apiIndex = 0;
  }

  const baseURL = apiUrls[apiIndex];
  console.log('baseURL', baseURL);

  // 检查API地址是否存在
  if (!baseURL) {
    throw new Error(`API索引 ${apiIndex}, 对应的地址未配置`);
  }

  // 音乐API配置
  const musicApiConfig: RequestConfig = {
    baseURL,
    timeout: 10000,
    withCredentials: false,
    retryConfig: {
      maxRetries: 0, // 音乐API不使用内置重试，使用smartRequest的重试逻辑
      delay: 0,
      noRetryUrls: []
    },
    enableCommonParams: false, // 音乐API不需要通用参数
    enableTokenHandling: false, // 音乐API不需要token处理
    enableProxyConfig: false, // 音乐API不需要代理配置
    interceptors: {
      error: async (error) => {
        // 统一错误处理
        if (error.response && error.response.status === 401) {
          // 处理未授权，比如跳转登录
          // window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
  };

  return createRequest(musicApiConfig);
};

/**
 * 自动主备切换的高阶请求方法
 * @param config axios请求配置
 * @param maxRetry 最大重试次数，默认尝试所有API
 */
export const smartRequest = async (_config: AxiosRequestConfig, maxRetry?: number) => {
  const apiUrls = getApiUrls();
  const actualMaxRetry = maxRetry ?? apiUrls.length - 1;
  return withRetry(
    async () => {
      // 尝试所有可用的API
      let lastError: Error | null = null;

      for (let i = 0; i <= actualMaxRetry; i++) {
        try {
          const instance = requestMusic(i);
          console.log(`尝试使用API ${i}: ${apiUrls[i]}`);
          const result = await instance(_config);
          console.log(`API ${i}, 请求成功`);
          return result;
        } catch (err) {
          console.warn(`API ${i} 请求失败:`, err);
          lastError = err as Error;

          // 如果不是最后一次尝试，添加短暂延迟
          if (i < actualMaxRetry) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }

      // 所有API都失败，抛出最后的错误
      throw new Error(`所有API都请求失败: ${lastError?.message || '未知错误'}`);
    },
    {
      maxRetries: 2, // 额外重试2次
      delay: 1000,
      backoff: 'linear',
      onRetry: (error, _attempt): void => {
        console.log(
          `smartRequest 重试第 ${_attempt + 1} 次: `,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  );
};

/**
 * 获取可用API数量
 */
export const getApiCount = () => getApiUrls().length;

/**
 * 获取API地址
 */
export const getApiUrl = (_index: number) => getApiUrls()[_index];

export default requestMusic;
