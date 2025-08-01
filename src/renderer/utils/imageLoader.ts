/**
 * 图片懒加载和错误处理工具
 */

import { onMounted, readonly, ref } from 'vue';

import { createNetworkError, handleError } from './errorHandler';

/**
 * 图片加载状态
 */
export enum ImageLoadState {
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
  RETRY = 'retry'
}

/**
 * 图片加载选项
 */
export interface ImageLoadOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackUrl?: string;
  onStateChange?: (state: ImageLoadState) => void;
  onError?: (error: Error) => void;
}

/**
 * 图片加载结果
 */
export interface ImageLoadResult {
  success: boolean;
  url: string;
  error?: Error;
  retryCount: number;
}

/**
 * 图片加载器类
 */
export class ImageLoader {
  private cache = new Map<string, Promise<ImageLoadResult>>();
  private readonly maxCacheSize = 100; // 最大缓存数量
  private accessOrder = new Map<string, number>(); // 访问顺序跟踪
  private defaultOptions: Required<ImageLoadOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackUrl: '/default-cover.jpg',
    onStateChange: () => {},
    onError: () => {}
  };

  /**
   * LRU缓存清理
   */
  private evictLRU() {
    if (this.cache.size <= this.maxCacheSize) return;

    // 找到最久未访问的项目
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }

  /**
   * 加载图片
   */
  async loadImage(url: string, options: ImageLoadOptions = {}): Promise<ImageLoadResult> {
    const opts = { ...this.defaultOptions, ...options };

    // 更新访问时间
    this.accessOrder.set(url, Date.now());

    // 原子性检查和设置，防止竞态条件
    let loadPromise = this.cache.get(url);
    if (!loadPromise) {
      this.evictLRU(); // 清理旧缓存
      loadPromise = this.performLoad(url, opts);
      this.cache.set(url, loadPromise);
    }

    return loadPromise;
  }

  /**
   * 执行图片加载
   */
  private async performLoad(
    url: string,
    options: Required<ImageLoadOptions>
  ): Promise<ImageLoadResult> {
    let retryCount = 0;
    let lastError: Error = new Error('未知错误');

    while (retryCount <= options.maxRetries) {
      try {
        options.onStateChange(retryCount === 0 ? ImageLoadState.LOADING : ImageLoadState.RETRY);

        await this.loadSingleImage(url);

        options.onStateChange(ImageLoadState.LOADED);
        return {
          success: true,
          url,
          retryCount
        };
      } catch (error) {
        lastError = error as Error;
        retryCount++;

        if (retryCount <= options.maxRetries) {
          console.warn(`图片加载失败，准备重试 ${retryCount}/${options.maxRetries}:`, url, error);
          await this.delay(options.retryDelay * retryCount);
        }
      }
    }

    // 所有重试都失败，尝试使用备用图片
    if (options.fallbackUrl && options.fallbackUrl !== url) {
      try {
        await this.loadSingleImage(options.fallbackUrl);
        options.onStateChange(ImageLoadState.LOADED);
        return {
          success: true,
          url: options.fallbackUrl,
          retryCount
        };
      } catch (fallbackError) {
        console.error('备用图片也加载失败:', options.fallbackUrl, fallbackError);
      }
    }

    // 完全失败
    const networkError = createNetworkError(`图片加载失败: ${url}`, 'IMAGE_LOAD_FAILED', {
      url,
      retryCount,
      originalError: lastError
    });

    options.onStateChange(ImageLoadState.ERROR);
    options.onError(networkError);

    return {
      success: false,
      url,
      error: networkError,
      retryCount
    };
  }

  /**
   * 加载单个图片
   */
  private loadSingleImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

      // 设置超时
      const timeout = setTimeout(() => {
        reject(new Error(`Image load timeout: ${url}`));
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 预加载图片
   */
  async preloadImages(urls: string[], options: ImageLoadOptions = {}): Promise<ImageLoadResult[]> {
    const promises = urls.map((url) => this.loadImage(url, options));
    return Promise.all(promises);
  }
}

// 创建全局图片加载器实例
export const imageLoader = new ImageLoader();

/**
 * Vue 组合式函数：使用图片懒加载
 */
export const useImageLoader = (initialUrl: string, options: ImageLoadOptions = {}) => {
  const state = ref<ImageLoadState>(ImageLoadState.LOADING);
  const currentUrl = ref<string>(initialUrl);
  const error = ref<Error | null>(null);

  const loadImage = async (url: string) => {
    if (!url) return;

    try {
      const result = await imageLoader.loadImage(url, {
        ...options,
        onStateChange: (newState) => {
          state.value = newState;
          options.onStateChange?.(newState);
        },
        onError: (err) => {
          error.value = err;
          options.onError?.(err);
        }
      });

      if (result.success) {
        currentUrl.value = result.url;
        error.value = null;
      } else {
        error.value = result.error || new Error('Unknown image load error');
      }
    } catch (err) {
      error.value = err as Error;
      handleError(err as Error);
    }
  };

  // 初始加载
  onMounted(() => {
    if (initialUrl) {
      loadImage(initialUrl);
    }
  });

  return {
    state: readonly(state),
    currentUrl: readonly(currentUrl),
    error: readonly(error),
    loadImage
  };
};
