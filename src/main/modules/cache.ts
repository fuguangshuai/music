import { ipcMain } from 'electron';
import Store from 'electron-store';

// 缓存数据类型枚举
enum CacheType {
  LYRIC = 'lyrics',
  IMAGE = 'images',
  AUDIO_METADATA = 'audioMetadata',
  API_RESPONSE = 'apiResponses',
  USER_DATA = 'userData',
}

// 通用缓存数据接口
interface CacheData<T = unknown> {
  id: string,
  data: T,
  timestamp: number;
  ttl?: number; // 生存时间（毫秒）
  accessCount: number,
  lastAccessed: number;
  size?: number; // 数据大小（字节）
}

// 缓存统计接口
interface CacheStats {
  totalItems: number,
  totalSize: number,
  hitCount: number,
  missCount: number,
  hitRate: number,
  oldestItem: number,
  newestItem: number,
  memoryUsage: number;
}

// LRU节点接口
interface LRUNode {
  key: string;
  prev?: LRUNode;
  next?: LRUNode;
}

// 扩展的存储模式
interface StoreSchema {
  lyrics: Record<string, CacheData>;
  images: Record<string, CacheData>;
  audioMetadata: Record<string, CacheData>;
  apiResponses: Record<string, CacheData>;
  userData: Record<string, CacheData>;
  cacheStats: Record<string, CacheStats>;
  cacheConfig: {
    maxSize: number,
    defaultTTL: number,
    enableLRU: boolean;
  };
}

/**
 * 🧠 智能缓存管理器
 * 基于现有歌词缓存扩展，支持多种数据类型和智能缓存策略
 */
class SmartCacheManager {
  private store: Store<StoreSchema>;
  private lruMap: Map<string, LRUNode> = new Map();
  private lruHead?: LRUNode;
  private lruTail?: LRUNode;
  private stats: Map<string, CacheStats> = new Map();
  private maxMemorySize: number = 100 * 1024 * 1024; // 100MB
  private currentMemorySize: number = 0;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'smart-cache', defaults: {
        lyrics: {},
        images: {},
        audioMetadata: {},
        apiResponses: {},
        userData: {},
        cacheStats: {},
        cacheConfig: {
          maxSize: this.maxMemorySize,
          defaultTTL: 24 * 60 * 60 * 1000, // 24小时
          enableLRU: true,
        },
      },
    });

    // 初始化统计数据
    this.initializeStats();

    // 启动定期清理
    this.startPeriodicCleanup();
  }

  /**
   * 🎵 缓存歌词（保持向后兼容）
   */
  async cacheLyric(id: number, data: unknown): Promise<boolean> {
    return await this.cacheData(CacheType.LYRIC, id.toString(), data);
  }

  /**
   * 💾 通用缓存数据方法
   */
  async cacheData<T>(type: CacheType, key: string, data: T, ttl?: number): Promise<boolean> {
    try {
      // 检查内存压力
      await this.handleMemoryPressure();

      const cacheKey = `${type}:${key}`;
      const size = this.estimateDataSize(data);
      const now = Date.now();

      const cacheItem: CacheData<T> = {
        id: key,
        data,
        timestamp: now,
        ttl: ttl || this.store.get('cacheConfig').defaultTTL,
        accessCount: 0,
        lastAccessed: now,
        size,
      };

      // 获取对应类型的缓存存储
      const typeCache = this.store.get(type);
      typeCache[key] = cacheItem;
      this.store.set(type, typeCache);

      // 更新LRU
      this.updateLRU(cacheKey);

      // 更新统计
      this.updateStats(type, 'cache', size);
      this.currentMemorySize += size || 0;

      console.log(`✅ 缓存数据成功 [${type}:${key}] 大小: ${size}字节`);
      return true;
    } catch (error) {
      console.error('缓存数据失败:', error);
      return false;
    }
  }

  /**
   * 🎵 获取缓存歌词（保持向后兼容）
   */
  async getCachedLyric(id: number): Promise<unknown> {
    return await this.getCachedData(CacheType.LYRIC, id.toString());
  }

  /**
   * 🔍 通用获取缓存数据方法
   */
  async getCachedData<T>(type: CacheType, key: string): Promise<T | undefined> {
    try {
      const typeCache = this.store.get(type);
      const result = typeCache[key] as CacheData<T>;

      if (!result) {
        this.updateStats(type, 'miss');
        return undefined;
      }

      const now = Date.now();

      // 检查TTL过期
      if (result.ttl && now - result.timestamp, result.ttl) {
        await this.removeFromCache(type, key);
        this.updateStats(type, 'miss');
        console.log(`⏰ 缓存过期 [${type}:${key}]`);
        return undefined;
      }

      // 更新访问统计
      result.accessCount++;
      result.lastAccessed = now;
      typeCache[key] = result;
      this.store.set(type, typeCache);

      // 更新LRU
      this.updateLRU(`${type}:${key}`);

      // 更新统计
      this.updateStats(type, 'hit');

      console.log(`✅ 缓存命中 [${type}:${key}] 访问次数: ${result.accessCount}`);
      return result.data;
    } catch (error) {
      console.error('获取缓存数据失败:', error);
      this.updateStats(type, 'miss');
      return undefined;
    }
  }

  /**
   * 🗑️ 清理歌词缓存（保持向后兼容）
   */
  async clearLyricCache(): Promise<boolean> {
    return await this.clearCache(CacheType.LYRIC);
  }

  /**
   * 🗑️ 清理指定类型的缓存
   */
  async clearCache(type: CacheType): Promise<boolean> {
    try {
      const typeCache = this.store.get(type);
      const size = Object.values(typeCache).reduce((total, item) => total + (item.size || 0), 0);

      this.store.set(type, {});
      this.currentMemorySize -= size;

      // 清理LRU中对应的项
      for (const key of Object.keys(typeCache)) {
        this.removeFromLRU(`${type}:${key}`);
      }

      // 重置统计
      this.stats.set(type, {
        totalItems: 0,
        totalSize: 0,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        oldestItem: 0,
        newestItem: 0,
        memoryUsage: 0,
      });

      console.log(`🗑️ 清理缓存完成 [${type}] 释放: ${size}字节`);
      return true;
    } catch (error) {
      console.error('清理缓存失败:', error);
      return false;
    }
  }

  /**
   * 🧠 LRU策略实现
   */
  private updateLRU(key: string): void {
    const config = this.store.get('cacheConfig');
    if (!config.enableLRU) return;

    // 如果节点已存在，移动到头部
    if (this.lruMap.has(key)) {
      const node = this.lruMap.get(key)!;
      this.moveToHead(node);
      return;
    }

    // 创建新节点并添加到头部
    const newNode: LRUNode = { key };
    this.lruMap.set(key, newNode);
    this.addToHead(newNode);
  }

  private addToHead(node: LRUNode): void {
    node.prev = undefined;
    node.next = this.lruHead;

    if (this.lruHead) {
      this.lruHead.prev = node;
    }
    this.lruHead = node;

    if (!this.lruTail) {
      this.lruTail = node;
    }
  }

  private removeNode(node: LRUNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.lruHead = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.lruTail = node.prev;
    }
  }

  private moveToHead(node: LRUNode): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private removeFromLRU(key: string): void {
    if (this.lruMap.has(key)) {
      const node = this.lruMap.get(key)!;
      this.removeNode(node);
      this.lruMap.delete(key);
    }
  }

  /**
   * 💾 内存压力管理
   */
  private async handleMemoryPressure(): Promise<void> {
    if (this.currentMemorySize < this.maxMemorySize * 0.8) return;

    console.log('🚨 内存压力检测，开始清理最少使用的缓存项');

    let cleanedSize = 0;
    const targetSize = this.maxMemorySize * 0.6; // 清理到60%

    // 从LRU尾部开始清理
    while (this.lruTail && this.currentMemorySize > targetSize) {
      const key = this.lruTail.key;
      const [type, id] = key.split(':');

      const size = await this.removeFromCache(type as CacheType, id);
      cleanedSize += size;

      if (cleanedSize >= this.maxMemorySize * 0.2) break; // 最多清理20%
    }

    console.log(`🧹 内存清理完成，释放: ${cleanedSize}字节`);
  }

  /**
   * 🗑️ 从缓存中移除项目
   */
  private async removeFromCache(type: CacheType, key: string): Promise<number> {
    try {
      const typeCache = this.store.get(type);
      const item = typeCache[key];

      if (!item) return 0;

      const size = item.size || 0;
      delete typeCache[key];
      this.store.set(type, typeCache);

      this.removeFromLRU(`${type}:${key}`);
      this.currentMemorySize -= size;

      return size;
    } catch (error) {
      console.error('移除缓存项失败:', error);
      return 0;
    }
  }

  /**
   * 📊 更新统计信息
   */
  private updateStats(type: CacheType, operation: 'hit' | 'miss' | 'cache', size?: number): void {
    const stats = this.stats.get(type) || {
      totalItems: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      oldestItem: Date.now(),
      newestItem: Date.now(),
      memoryUsage: 0,
    };

    switch (operation) {
      case 'hit':
        stats.hitCount++;
        break;
      case 'miss':
        stats.missCount++;
        break;
      case 'cache':
        stats.totalItems++;
        stats.totalSize += size || 0;
        stats.newestItem = Date.now();
        break;
    }

    const total = stats.hitCount + stats.missCount;
    stats.hitRate = total > 0 ? (stats.hitCount / total) * 100 : 0;
    stats.memoryUsage = stats.totalSize;

    this.stats.set(type, stats);
  }

  /**
   * 📊 获取缓存统计信息
   */
  getCacheStats(type?: CacheType): CacheStats | Map<string, CacheStats> {
    if (type) {
      return (
        this.stats.get(type) || {
          totalItems: 0,
          totalSize: 0,
          hitCount: 0,
          missCount: 0,
          hitRate: 0,
          oldestItem: 0,
          newestItem: 0,
          memoryUsage: 0,
        }
      );
    }
    return this.stats;
  }

  /**
   * 📏 估算数据大小
   */
  private estimateDataSize(data: unknown): number {
    try {
      return JSON.stringify(data).length * 2; // 粗略估算（UTF-16）
    } catch {
      return 1024; // 默认1KB
    }
  }

  /**
   * 🔧 初始化统计数据
   */
  private initializeStats(): void {
    Object.values(CacheType).forEach(type => {
      this.stats.set(type, {
        totalItems: 0,
        totalSize: 0,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        oldestItem: Date.now(),
        newestItem: Date.now(),
        memoryUsage: 0,
      });
    });
  }

  /**
   * ⏰ 启动定期清理
   */
  private startPeriodicCleanup(): void {
    setInterval(
      () => {
        this.cleanupExpiredItems();
      },
      60 * 60 * 1000
    ); // 每小时清理一次过期项
  }

  /**
   * 🧹 清理过期项目
   */
  private cleanupExpiredItems(): void {
    const now = Date.now();
    let cleanedCount = 0;

    Object.values(CacheType).forEach(type => {
      const typeCache = this.store.get(type);
      const toDelete: string[] = [];

      Object.entries(typeCache).forEach(([key, item]) => {
        if (item.ttl && now - item.timestamp, item.ttl) {
          toDelete.push(key);
        }
      });

      toDelete.forEach(key => {
        this.removeFromCache(type, key);
        cleanedCount++;
      });
    });

    if (cleanedCount > 0) {
      console.log(`🧹 定期清理完成，移除 ${cleanedCount} 个过期项`);
    }
  }
}

// 创建智能缓存管理器实例
export const smartCacheManager = new SmartCacheManager();

// 保持向后兼容的导出
export const cacheManager = smartCacheManager;

/**
 * 🔧 初始化智能缓存管理器
 */
export function initializeCacheManager(): void {
  // 原有歌词缓存IPC处理（保持向后兼容）
  ipcMain.handle('cache-lyric', async (_, id: number, lyricData: unknown) => {
    return await smartCacheManager.cacheLyric(id, lyricData);
  });

  ipcMain.handle('get-cached-lyric', async (_, id: number) => {
    return await smartCacheManager.getCachedLyric(id);
  });

  ipcMain.handle('clear-lyric-cache', async () => {
    return await smartCacheManager.clearLyricCache();
  });

  // 新增通用缓存IPC处理
  ipcMain.handle('cache-data', async (_, type: CacheType, key: string, data: unknown, ttl?: number) => {
      return await smartCacheManager.cacheData(type, key, data, ttl);
    }
  );

  ipcMain.handle('get-cached-data', async (_, type: CacheType, key: string) => {
    return await smartCacheManager.getCachedData(type, key);
  });

  ipcMain.handle('clear-cache', async (_, type: CacheType) => {
    return await smartCacheManager.clearCache(type);
  });

  ipcMain.handle('get-cache-stats', async (_, type?: CacheType) => {
    return smartCacheManager.getCacheStats(type);
  });

  console.log('🧠 智能缓存管理器已初始化');
}

// 导出类型和枚举
export { type CacheData, type CacheStats, CacheType };
