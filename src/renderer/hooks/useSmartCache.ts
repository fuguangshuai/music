/**
 * 智能缓存管理组合式函数
 * 提供Vue组件中使用智能缓存的便捷接口
 */

import { computed, type ComputedRef, onMounted, onUnmounted, type Ref, ref } from 'vue';

import { type CacheStats, CacheType, smartCacheService } from '@/services/cacheService';
import { CacheUtils } from '@/utils/cacheUtils';

/**
 * 智能缓存Hook返回类型接口
 */
export interface UseSmartCacheReturn {
  /** 缓存统计信息 */
  cacheStats: Ref<Map<string, CacheStats> | null>;
  /** 加载状态 */
  isLoading: Ref<boolean>;
  /** 错误信息 */
  error: Ref<string | null>;
  /** 总缓存大小 */
  totalCacheSize: ComputedRef<number>;
  /** 平均命中率 */
  averageHitRate: ComputedRef<number>;
  /** 总缓存项数 */
  totalCacheItems: ComputedRef<number>;
  /** 缓存数据 */
  cacheData: <T>(type: CacheType, key: string, data: T, ttl?: number) => Promise<boolean>;
  /** 获取缓存数据 */
  getCachedData: <T>(type: CacheType, key: string) => Promise<T | undefined>;
  /** 清理缓存 */
  clearCache: (type: CacheType) => Promise<boolean>;
  /** 刷新统计 */
  refreshStats: () => Promise<void>;
  /** 分析性能 */
  analyzePerformance: () => Promise<any>;
  /** 智能清理 */
  smartCleanup: () => Promise<any>;
  /** 开始自动刷新 */
  startAutoRefresh: (intervalMs?: number) => void;
  /** 停止自动刷新 */
  stopAutoRefresh: () => void;
}

export function useSmartCache(): UseSmartCacheReturn {
  const cacheStats = ref<Map<string, CacheStats> | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const refreshInterval = ref<number | null>(null);

  /**
   * 💾 缓存数据
   */
  const cacheData = async <T>(
    type: CacheType,
    _key: string,
    data: T,
    ttl?: number
  ): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await smartCacheService.cacheData(type, _key, data, ttl);

      if (result) {
        await refreshStats();
      }

      return result;
    } catch (err) {
      error.value = `缓存数据失败: ${err}`;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 🔍 获取缓存数据
   */
  const getCachedData = async <T>(type: CacheType, _key: string): Promise<T | undefined> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await smartCacheService.getCachedData<T>(type, _key);
      await refreshStats();

      return result;
    } catch (err) {
      error.value = `获取缓存数据失败: ${err}`;
      return undefined;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 🗑️ 清理缓存
   */
  const clearCache = async (type: CacheType): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await smartCacheService.clearCache(type);

      if (result) {
        await refreshStats();
      }

      return result;
    } catch (err) {
      error.value = `清理缓存失败: ${err}`;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 📊 刷新缓存统计
   */
  const refreshStats = async (): Promise<void> => {
    try {
      const stats = await smartCacheService.getCacheStats();
      cacheStats.value = stats as Map<string, CacheStats> | null;
    } catch (err) {
      error.value = `获取缓存统计失败: ${err}`;
    }
  };

  /**
   * 📈 分析缓存性能
   */
  const analyzePerformance = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      return await CacheUtils.analyzeCachePerformance();
    } catch (err) {
      error.value = `缓存性能分析失败: ${err}`;
      return { totalStats: null, recommendations: [] };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 🧹 智能清理
   */
  const smartCleanup = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await CacheUtils.smartCleanup();
      await refreshStats();

      return result;
    } catch (err) {
      error.value = `智能清理失败: ${err}`;
      return { cleaned: [], errors: [`智能清理失败: ${err}`] };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * ⏰ 开始自动刷新统计
   */
  const startAutoRefresh = (intervalMs: number = 30000) => {
    if (refreshInterval.value) return;

    refreshInterval.value = window.setInterval(() => {
      refreshStats();
    }, intervalMs);

    console.log('📊, 缓存统计自动刷新已启动');
  };

  /**
   * ⏹️ 停止自动刷新
   */
  const stopAutoRefresh = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
      refreshInterval.value = null;
      console.log('⏹️, 缓存统计自动刷新已停止');
    }
  };

  // 计算属性
  const totalCacheSize = computed(() => {
    if (!cacheStats.value) return 0;

    let total = 0;
    if (cacheStats.value instanceof Map) {
      for (const stats of cacheStats.value.values()) {
        total += stats.memoryUsage;
      }
    }
    return total;
  });

  const averageHitRate = computed(() => {
    if (!cacheStats.value) return 0;

    let totalHitRate = 0;
    let count = 0;

    if (cacheStats.value instanceof Map) {
      for (const stats of cacheStats.value.values()) {
        totalHitRate += stats.hitRate;
        count++;
      }
    }

    return count > 0 ? totalHitRate / count : 0;
  });

  const totalCacheItems = computed(() => {
    if (!cacheStats.value) return 0;

    let total = 0;
    if (cacheStats.value instanceof Map) {
      for (const stats of cacheStats.value.values()) {
        total += stats.totalItems;
      }
    }
    return total;
  });

  // 生命周期钩子
  onMounted(() => {
    refreshStats();
  });

  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    // 状态
    cacheStats,
    isLoading,
    error,

    // 计算属性
    totalCacheSize,
    averageHitRate,
    totalCacheItems,

    // 方法
    cacheData,
    getCachedData,
    clearCache,
    refreshStats,
    analyzePerformance,
    smartCleanup,
    startAutoRefresh,
    stopAutoRefresh
  };
}

/**
 * 图片缓存Hook返回类型接口
 */
export interface UseImageCacheReturn {
  /** 缓存图片 */
  cacheImage: (url: string, imageData: Blob, ttl?: number) => Promise<boolean>;
  /** 获取缓存图片 */
  getCachedImage: (url: string) => Promise<string | Blob | undefined>;
  /** 清理图片缓存 */
  clearImageCache: () => Promise<boolean>;
}

/**
 * 特定类型缓存的组合式函数
 */
export function useImageCache(): UseImageCacheReturn {
  const { clearCache } = useSmartCache();

  const cacheImage = async (url: string, imageData: string | Blob, ttl?: number) => {
    return await CacheUtils.cacheImage(url, imageData, ttl);
  };

  const getCachedImage = async (url: string) => {
    return await CacheUtils.getCachedImage(url);
  };

  const clearImageCache = async () => {
    return await clearCache(CacheType.IMAGE);
  };

  return {
    cacheImage,
    getCachedImage,
    clearImageCache
  };
}

/**
 * API缓存Hook返回类型接口
 */
export interface UseApiCacheReturn {
  /** 缓存API响应 */
  cacheApiResponse: (
    endpoint: string,
    params: Record<string, unknown>,
    response: any,
    ttl?: number
  ) => Promise<boolean>;
  /** 获取缓存API响应 */
  getCachedApiResponse: (endpoint: string, params: Record<string, unknown>) => Promise<any>;
  /** 清理API缓存 */
  clearApiCache: () => Promise<boolean>;
}

export function useApiCache(): UseApiCacheReturn {
  const { clearCache } = useSmartCache();

  const cacheApiResponse = async (
    endpoint: string,
    params: Record<string, unknown>,
    response: any,
    ttl?: number
  ) => {
    return await CacheUtils.cacheApiResponse(endpoint, params, response, ttl);
  };

  const getCachedApiResponse = async (endpoint: string, params: Record<string, unknown>) => {
    return await CacheUtils.getCachedApiResponse(endpoint, params);
  };

  const clearApiCache = async () => {
    return await clearCache(CacheType.API_RESPONSE);
  };

  return {
    cacheApiResponse,
    getCachedApiResponse,
    clearApiCache
  };
}

/**
 * 用户数据缓存Hook返回类型接口
 */
export interface UseUserDataCacheReturn {
  /** 缓存用户数据 */
  cacheUserData: (userId: string, data: Record<string, unknown>, ttl?: number) => Promise<boolean>;
  /** 获取缓存用户数据 */
  getCachedUserData: (userId: string) => Promise<Record<string, unknown> | undefined>;
  /** 清理用户数据缓存 */
  clearUserDataCache: () => Promise<boolean>;
}

export function useUserDataCache(): UseUserDataCacheReturn {
  const { clearCache } = useSmartCache();

  const cacheUserData = async (userId: string, data: Record<string, unknown>, ttl?: number) => {
    return await CacheUtils.cacheUserData(userId, data, ttl);
  };

  const getCachedUserData = async (userId: string) => {
    return await CacheUtils.getCachedUserData(userId);
  };

  const clearUserDataCache = async () => {
    return await clearCache(CacheType.USER_DATA);
  };

  return {
    cacheUserData,
    getCachedUserData,
    clearUserDataCache
  };
}
