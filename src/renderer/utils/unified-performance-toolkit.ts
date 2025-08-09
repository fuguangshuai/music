/**
 * 统一性能优化工具集
 *
 * 目标：整合项目中分散的性能优化功能，提供统一的性能管理接口
 *
 * 整合内容：
 * 1. 内存优化（来自 memoryOptimizer.ts）
 * 2. 缓存管理（来自 cacheUtils.ts）
 * 3. 性能监控（来自 performanceMonitor.ts）
 * 4. 资源预加载（来自 preload 相关模块）
 * 5. 懒加载优化
 * 6. 防抖节流优化
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import { computed, ComputedRef, Ref, ref } from 'vue';

// ============================================================================
// 性能配置接口
// ============================================================================

/**
 * 性能优化配置
 */
export interface PerformanceConfig {
  enableMemoryOptimization: boolean;
  enableCacheOptimization: boolean;
  enableResourcePreloading: boolean;
  enableLazyLoading: boolean;
  enablePerformanceMonitoring: boolean;
  memoryThreshold: number; // 内存使用率阈值 (0-1)
  cacheMaxSize: number; // 缓存最大大小 (字节)
  preloadConcurrency: number; // 预加载并发数
  monitoringInterval: number; // 监控间隔 (毫秒)
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cache: {
    hitRate: number;
    size: number;
    itemCount: number;
  };
  network: {
    requestCount: number;
    averageResponseTime: number;
    failureRate: number;
  };
  rendering: {
    fps: number;
    frameDrops: number;
    paintTime: number;
  };
}

/**
 * 性能建议
 */
export interface PerformanceRecommendation {
  id: string;
  type: 'memory' | 'cache' | 'network' | 'rendering';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  impact: string;
}

// ============================================================================
// 内存优化管理器
// ============================================================================

/**
 * 增强的内存优化管理器
 */
export class EnhancedMemoryOptimizer {
  private cleanupTasks: (() => void)[] = [];
  private monitoringInterval: number | null = null;
  private memoryThreshold: number = 0.8;
  private lastCleanupTime: number = 0;
  private cleanupCooldown: number = 30000; // 30秒冷却时间

  /**
   * 注册清理任务
   */
  registerCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): { used: number; total: number; percentage: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.jsHeapSizeLimit,
        percentage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
      };
    }
    return { used: 0, total: 0, percentage: 0 };
  }

  /**
   * 执行内存清理
   */
  cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanupTime < this.cleanupCooldown) {
      return; // 冷却时间内不执行清理
    }

    console.log('🧹 开始内存清理...');

    // 执行注册的清理任务
    this.cleanupTasks.forEach((task, index) => {
      try {
        task();
      } catch (error) {
        console.warn(`内存清理任务 ${index} 失败:`, error);
      }
    });

    // 清理图片缓存
    this.clearImageCache();

    // 清理音频缓存
    this.clearAudioCache();

    // 强制垃圾回收（如果支持）
    this.forceGarbageCollection();

    this.lastCleanupTime = now;
    console.log('✅ 内存清理完成');
  }

  /**
   * 清理图片缓存
   */
  private clearImageCache(): void {
    const images = document.querySelectorAll('img');
    let revokedCount = 0;

    images.forEach((img) => {
      if (img.src && img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
        revokedCount++;
      }
    });

    if (revokedCount > 0) {
      console.log(`🖼️ 清理了 ${revokedCount} 个图片缓存`);
    }
  }

  /**
   * 清理音频缓存
   */
  private clearAudioCache(): void {
    const audios = document.querySelectorAll('audio');
    let revokedCount = 0;

    audios.forEach((audio) => {
      if (audio.src && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
        revokedCount++;
      }
    });

    if (revokedCount > 0) {
      console.log(`🎵 清理了 ${revokedCount} 个音频缓存`);
    }
  }

  /**
   * 强制垃圾回收
   */
  private forceGarbageCollection(): void {
    const windowWithGC = window as Window & { gc?: () => void };
    if ('gc' in window && typeof windowWithGC.gc === 'function') {
      try {
        windowWithGC.gc();
        console.log('🗑️ 执行了强制垃圾回收');
      } catch (error) {
        console.warn('强制垃圾回收失败:', error);
      }
    }
  }

  /**
   * 开始内存监控
   */
  startMonitoring(interval: number = 30000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = window.setInterval(() => {
      const usage = this.getMemoryUsage();

      if (usage.percentage > this.memoryThreshold) {
        console.warn('⚠️ 内存使用率过高:', `${(usage.percentage * 100).toFixed(1)}%`);
        this.cleanup();
      }
    }, interval);

    console.log('📊 内存监控已启动');
  }

  /**
   * 停止内存监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('📊 内存监控已停止');
    }
  }

  /**
   * 设置内存阈值
   */
  setMemoryThreshold(threshold: number): void {
    this.memoryThreshold = Math.max(0.1, Math.min(0.95, threshold));
  }
}

// ============================================================================
// 防抖节流工具
// ============================================================================

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: number | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCallTime >= delay) {
      func(...args);
      lastCallTime = now;
    } else if (timeoutId === null) {
      timeoutId = window.setTimeout(
        () => {
          func(...args);
          lastCallTime = Date.now();
          timeoutId = null;
        },
        delay - (now - lastCallTime)
      );
    }
  };
}

// ============================================================================
// 资源预加载管理器
// ============================================================================

/**
 * 资源预加载管理器
 */
export class ResourcePreloader {
  private preloadQueue: Array<{
    url: string;
    type: 'image' | 'audio' | 'script';
    priority: number;
  }> = [];
  private preloadedResources: Map<string, any> = new Map();
  private concurrency: number = 3;
  private activeRequests: number = 0;

  /**
   * 设置并发数
   */
  setConcurrency(concurrency: number): void {
    this.concurrency = Math.max(1, Math.min(10, concurrency));
  }

  /**
   * 添加预加载资源
   */
  addResource(url: string, type: 'image' | 'audio' | 'script', priority: number = 1): void {
    if (this.preloadedResources.has(url)) {
      return; // 已经预加载过
    }

    this.preloadQueue.push({ url, type, priority });
    this.preloadQueue.sort((a, b) => b.priority - a.priority); // 按优先级排序

    this.processQueue();
  }

  /**
   * 处理预加载队列
   */
  private async processQueue(): Promise<void> {
    while (this.preloadQueue.length > 0 && this.activeRequests < this.concurrency) {
      const resource = this.preloadQueue.shift();
      if (resource) {
        this.activeRequests++;
        this.preloadResource(resource).finally(() => {
          this.activeRequests--;
          this.processQueue(); // 继续处理队列
        });
      }
    }
  }

  /**
   * 预加载单个资源
   */
  private async preloadResource(resource: {
    url: string;
    type: string;
    priority: number;
  }): Promise<void> {
    try {
      let loadedResource: any;

      switch (resource.type) {
        case 'image':
          loadedResource = await this.preloadImage(resource.url);
          break;
        case 'audio':
          loadedResource = await this.preloadAudio(resource.url);
          break;
        case 'script':
          loadedResource = await this.preloadScript(resource.url);
          break;
        default:
          throw new Error(`不支持的资源类型: ${resource.type}`);
      }

      this.preloadedResources.set(resource.url, loadedResource);
      console.log(`✅ 预加载完成: ${resource.url}`);
    } catch (error) {
      console.warn(`❌ 预加载失败: ${resource.url}`, error);
    }
  }

  /**
   * 预加载图片
   */
  private preloadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * 预加载音频
   */
  private preloadAudio(url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => resolve(audio);
      audio.onerror = reject;
      audio.src = url;
    });
  }

  /**
   * 预加载脚本
   */
  private preloadScript(url: string): Promise<HTMLScriptElement> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = () => resolve(script);
      script.onerror = reject;
      script.src = url;
      document.head.appendChild(script);
    });
  }

  /**
   * 获取预加载的资源
   */
  getResource(url: string): any | null {
    return this.preloadedResources.get(url) || null;
  }

  /**
   * 清理预加载缓存
   */
  clearCache(): void {
    this.preloadedResources.clear();
    this.preloadQueue.length = 0;
    console.log('🧹 预加载缓存已清理');
  }
}

// ============================================================================
// 懒加载管理器
// ============================================================================

/**
 * 懒加载管理器
 */
export class LazyLoadManager {
  private observer: IntersectionObserver | null = null;
  private loadedElements: Set<Element> = new Set();

  /**
   * 初始化懒加载
   */
  initialize(): void {
    if (!('IntersectionObserver' in window)) {
      console.warn('浏览器不支持 IntersectionObserver，懒加载功能不可用');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.loadedElements.has(entry.target)) {
            this.loadElement(entry.target);
            this.loadedElements.add(entry.target);
            this.observer?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1
      }
    );

    console.log('👁️ 懒加载管理器已初始化');
  }

  /**
   * 观察元素
   */
  observe(element: Element): void {
    if (this.observer && !this.loadedElements.has(element)) {
      this.observer.observe(element);
    }
  }

  /**
   * 停止观察元素
   */
  unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }

  /**
   * 加载元素
   */
  private loadElement(element: Element): void {
    if (element instanceof HTMLImageElement) {
      const dataSrc = element.getAttribute('data-src');
      if (dataSrc) {
        element.src = dataSrc;
        element.removeAttribute('data-src');
      }
    } else if (element instanceof HTMLElement) {
      const dataSrc = element.getAttribute('data-src');
      if (dataSrc) {
        element.style.backgroundImage = `url(${dataSrc})`;
        element.removeAttribute('data-src');
      }
    }

    console.log('🖼️ 懒加载元素:', element);
  }

  /**
   * 销毁懒加载管理器
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.loadedElements.clear();
    console.log('🗑️ 懒加载管理器已销毁');
  }
}

// ============================================================================
// 统一性能工具集主类
// ============================================================================

/**
 * 统一性能优化工具集
 */
export class UnifiedPerformanceToolkit {
  private config: PerformanceConfig;
  private memoryOptimizer: EnhancedMemoryOptimizer;
  private resourcePreloader: ResourcePreloader;
  private lazyLoadManager: LazyLoadManager;
  private metrics: Ref<PerformanceMetrics>;
  private recommendations: Ref<PerformanceRecommendation[]> = ref([]);
  private isInitialized = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableMemoryOptimization: true,
      enableCacheOptimization: true,
      enableResourcePreloading: true,
      enableLazyLoading: true,
      enablePerformanceMonitoring: true,
      memoryThreshold: 0.8,
      cacheMaxSize: 100 * 1024 * 1024, // 100MB
      preloadConcurrency: 3,
      monitoringInterval: 30000,
      ...config
    };

    this.memoryOptimizer = new EnhancedMemoryOptimizer();
    this.resourcePreloader = new ResourcePreloader();
    this.lazyLoadManager = new LazyLoadManager();

    this.metrics = ref({
      memory: { used: 0, total: 0, percentage: 0 },
      cache: { hitRate: 0, size: 0, itemCount: 0 },
      network: { requestCount: 0, averageResponseTime: 0, failureRate: 0 },
      rendering: { fps: 0, frameDrops: 0, paintTime: 0 }
    });
  }

  /**
   * 初始化性能工具集
   */
  initialize(): void {
    if (this.isInitialized) return;

    console.log('⚡ 统一性能工具集初始化中...', this.config);

    if (this.config.enableMemoryOptimization) {
      this.memoryOptimizer.setMemoryThreshold(this.config.memoryThreshold);
      this.memoryOptimizer.startMonitoring(this.config.monitoringInterval);
    }

    if (this.config.enableResourcePreloading) {
      this.resourcePreloader.setConcurrency(this.config.preloadConcurrency);
    }

    if (this.config.enableLazyLoading) {
      this.lazyLoadManager.initialize();
    }

    if (this.config.enablePerformanceMonitoring) {
      this.startPerformanceMonitoring();
    }

    this.isInitialized = true;
    console.log('✅ 统一性能工具集初始化完成');
  }

  /**
   * 开始性能监控
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateMetrics();
      this.generateRecommendations();
    }, this.config.monitoringInterval);
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(): void {
    // 更新内存指标
    const memoryUsage = this.memoryOptimizer.getMemoryUsage();
    this.metrics.value.memory = memoryUsage;

    // 更新其他指标（这里是示例，实际项目中需要根据具体情况实现）
    this.metrics.value.cache = {
      hitRate: Math.random() * 100, // 示例数据
      size: Math.random() * this.config.cacheMaxSize,
      itemCount: Math.floor(Math.random() * 1000)
    };
  }

  /**
   * 生成性能建议
   */
  private generateRecommendations(): void {
    const recommendations: PerformanceRecommendation[] = [];
    const metrics = this.metrics.value;

    // 内存建议
    if (metrics.memory.percentage > 0.9) {
      recommendations.push({
        id: 'memory-critical',
        type: 'memory',
        priority: 'critical',
        title: '内存使用率过高',
        description: `当前内存使用率 ${(metrics.memory.percentage * 100).toFixed(1)}%`,
        action: '立即执行内存清理',
        impact: '可能导致应用卡顿或崩溃'
      });
    } else if (metrics.memory.percentage > 0.7) {
      recommendations.push({
        id: 'memory-warning',
        type: 'memory',
        priority: 'medium',
        title: '内存使用率较高',
        description: `当前内存使用率 ${(metrics.memory.percentage * 100).toFixed(1)}%`,
        action: '考虑清理不必要的缓存',
        impact: '可能影响应用性能'
      });
    }

    // 缓存建议
    if (metrics.cache.hitRate < 50) {
      recommendations.push({
        id: 'cache-low-hit-rate',
        type: 'cache',
        priority: 'medium',
        title: '缓存命中率较低',
        description: `当前缓存命中率 ${metrics.cache.hitRate.toFixed(1)}%`,
        action: '优化缓存策略或增加缓存时间',
        impact: '增加网络请求和加载时间'
      });
    }

    this.recommendations.value = recommendations;
  }

  /**
   * 获取性能指标
   */
  getMetrics(): ComputedRef<PerformanceMetrics> {
    return computed(() => this.metrics.value);
  }

  /**
   * 获取性能建议
   */
  getRecommendations(): ComputedRef<PerformanceRecommendation[]> {
    return computed(() => this.recommendations.value);
  }

  /**
   * 执行内存清理
   */
  cleanupMemory(): void {
    this.memoryOptimizer.cleanup();
  }

  /**
   * 预加载资源
   */
  preloadResource(url: string, type: 'image' | 'audio' | 'script', priority: number = 1): void {
    this.resourcePreloader.addResource(url, type, priority);
  }

  /**
   * 观察懒加载元素
   */
  observeLazyLoad(element: Element): void {
    this.lazyLoadManager.observe(element);
  }

  /**
   * 销毁性能工具集
   */
  destroy(): void {
    this.memoryOptimizer.stopMonitoring();
    this.resourcePreloader.clearCache();
    this.lazyLoadManager.destroy();
    console.log('🗑️ 统一性能工具集已销毁');
  }
}

// ============================================================================
// 便捷导出
// ============================================================================

/**
 * 创建性能工具集实例
 */
export const createPerformanceToolkit = (config?: Partial<PerformanceConfig>) => {
  return new UnifiedPerformanceToolkit(config);
};

/**
 * 默认性能工具集实例
 */
export const defaultPerformanceToolkit = createPerformanceToolkit();

// 自动初始化
if (typeof window !== 'undefined') {
  defaultPerformanceToolkit.initialize();
}

/**
 * 便捷的性能工具函数
 */
export const performance = {
  // 内存管理
  memory: {
    cleanup: () => defaultPerformanceToolkit.cleanupMemory(),
    getUsage: () => defaultPerformanceToolkit.getMetrics().value.memory
  },

  // 资源预加载
  preload: {
    image: (url: string, priority?: number) =>
      defaultPerformanceToolkit.preloadResource(url, 'image', priority),
    audio: (url: string, priority?: number) =>
      defaultPerformanceToolkit.preloadResource(url, 'audio', priority),
    script: (url: string, priority?: number) =>
      defaultPerformanceToolkit.preloadResource(url, 'script', priority)
  },

  // 懒加载
  lazyLoad: {
    observe: (element: Element) => defaultPerformanceToolkit.observeLazyLoad(element)
  },

  // 防抖节流
  debounce,
  throttle,

  // 性能监控
  getMetrics: () => defaultPerformanceToolkit.getMetrics(),
  getRecommendations: () => defaultPerformanceToolkit.getRecommendations()
};
