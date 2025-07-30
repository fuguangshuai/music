/**
 * localStorage 性能优化工具
 * 通过防抖和缓存机制减少频繁的 localStorage 操作
 */

interface StorageCache {
  [key: string]: {
    value: any;
    timer?: NodeJS.Timeout;
  };
}

class StorageOptimizer {
  private cache: StorageCache = {};
  private debounceTime = 300; // 防抖时间 300ms

  /**
   * 设置带防抖的 localStorage 值
   * @param key 存储键
   * @param value 存储值
   * @param immediate 是否立即存储，默认false
   */
  setItem(key: string, value: any, immediate = false): void {
    // 更新缓存
    if (this.cache[key]?.timer) {
      clearTimeout(this.cache[key].timer);
    }

    this.cache[key] = {
      value,
      timer: immediate
        ? undefined
        : setTimeout(() => {
            try {
              localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
              delete this.cache[key];
            } catch (error) {
              console.error(`Failed to save to localStorage: ${key}`, error);
            }
          }, this.debounceTime)
    };

    // 如果需要立即存储
    if (immediate) {
      try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      } catch (error) {
        console.error(`Failed to save to localStorage immediately: ${key}`, error);
      }
    }
  }

  /**
   * 获取 localStorage 值，优先从缓存获取
   * @param key 存储键
   * @param defaultValue 默认值
   * @returns 存储的值或默认值
   */
  getItem<T = any>(key: string, defaultValue?: T): T | null {
    // 优先从缓存获取
    if (this.cache[key]) {
      return this.cache[key].value;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue ?? null;
      }

      // 尝试解析 JSON，如果失败则返回原始字符串
      try {
        return JSON.parse(item);
      } catch {
        return item as T;
      }
    } catch (error) {
      console.error(`Failed to get from localStorage: ${key}`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * 立即刷新所有待写入的缓存到 localStorage
   */
  flush(): void {
    Object.keys(this.cache).forEach((key) => {
      const cacheItem = this.cache[key];
      if (cacheItem.timer) {
        clearTimeout(cacheItem.timer);
        try {
          localStorage.setItem(
            key,
            typeof cacheItem.value === 'string' ? cacheItem.value : JSON.stringify(cacheItem.value)
          );
        } catch (error) {
          console.error(`Failed to flush to localStorage: ${key}`, error);
        }
      }
    });
    this.cache = {};
  }

  /**
   * 清理指定键的缓存
   * @param key 存储键
   */
  clearCache(key: string): void {
    if (this.cache[key]?.timer) {
      clearTimeout(this.cache[key].timer);
    }
    delete this.cache[key];
  }

  /**
   * 清理所有缓存
   */
  clearAllCache(): void {
    Object.values(this.cache).forEach((item) => {
      if (item.timer) {
        clearTimeout(item.timer);
      }
    });
    this.cache = {};
  }
}

// 导出单例实例
export const storageOptimizer = new StorageOptimizer();

// 在页面卸载前刷新所有缓存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    storageOptimizer.flush();
  });
}
