/**
 * 智能缓存管理组合式函数
 * 提供Vue组件中使用智能缓存的便捷接口
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { smartCacheService, CacheType, type CacheStats } from '@/services/cacheService';
import { CacheUtils } from '@/utils/cacheUtils';

export function useSmartCache() {
  const cacheStats = ref<Map<string, CacheStats> | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const refreshInterval = ref<number | null>(null);

  /**
   * 💾 缓存数据
   */
  const cacheData = async <T>(
    type: CacheType, 
    key: string, 
    data: T, 
    ttl?: number
  ): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await smartCacheService.cacheData(type, key, data, ttl);
      
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
  const getCachedData = async <T>(type: CacheType, key: string): Promise<T | undefined> => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const result = await smartCacheService.getCachedData<T>(type, key);
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

    console.log('📊 缓存统计自动刷新已启动');
  };

  /**
   * ⏹️ 停止自动刷新
   */
  const stopAutoRefresh = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
      refreshInterval.value = null;
      console.log('⏹️ 缓存统计自动刷新已停止');
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
 * 特定类型缓存的组合式函数
 */
export function useImageCache() {
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

export function useApiCache() {
  const { clearCache } = useSmartCache();

  const cacheApiResponse = async (
    endpoint: string, 
    params: Record<string, unknown>, 
    response: unknown, 
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

export function useUserDataCache() {
  const { clearCache } = useSmartCache();

  const cacheUserData = async (
    userId: string, 
    data: Record<string, unknown>, 
    ttl?: number
  ) => {
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
