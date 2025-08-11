/**
 * 智能性能监控服务
 * 基于现有optimization-test.js扩展，提供运行时性能监控和分析
 *
 * 功能特性:
 * - 实时性能指标收集（页面加载、音频加载、内存使用）
 * - Web Performance API集成
 * - Electron性能指标监控
 * - 性能基准对比和退化检测
 * - 实时性能报告生成
 */

import { reactive, ref } from 'vue';

import { isElectron } from '@/utils';
import { SafePerformanceAPI } from '@/utils/unified-browser-api';

// 性能指标接口定义
export interface PerformanceMetrics {
  pageLoad: {
    domContentLoaded: number;
    loadComplete: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    timestamp: number;
  };
  audio: {
    loadTime: number;
    bufferHealth: number;
    playbackQuality: number;
  };
  navigation: {
    routeChangeTime: number;
    componentMountTime: number;
  };
}

// 性能报告接口
export interface PerformanceReport {
  timestamp: string;
  metrics: PerformanceMetrics;
  baseline: PerformanceBaseline | null;
  analysis: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

// 性能基准数据
interface PerformanceBaseline {
  pageLoadTime: number;
  memoryUsage: number;
  audioLoadTime: number;
  routeChangeTime: number;
}

class PerformanceMonitor {
  private metrics = reactive<PerformanceMetrics>({
    pageLoad: {
      domContentLoaded: 0,
      loadComplete: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0
    },
    memory: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      timestamp: 0
    },
    audio: {
      loadTime: 0,
      bufferHealth: 0,
      playbackQuality: 0
    },
    navigation: {
      routeChangeTime: 0,
      componentMountTime: 0
    }
  });

  private baseline: PerformanceBaseline | null = null;
  private isMonitoring = ref(false);
  private monitoringInterval: number | null = null;

  /**
   * 初始化性能监控
   */
  initialize(): void {
    if (this.isMonitoring.value) return;

    this.isMonitoring.value = true;
    this.setupPerformanceObservers();
    this.startMemoryMonitoring();
    this.loadBaseline();

    console.log('🔍, 性能监控服务已启动');
  }

  /**
   * 停止性能监控
   */
  stop(): void {
    this.isMonitoring.value = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('⏹️, 性能监控服务已停止');
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObservers(): void {
    // 页面加载性能监控
    if ('performance' in window && 'getEntriesByType' in performance) {
      // 监控导航时间
      const navigationEntries = performance.getEntriesByType(
        'navigation'
      ) as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        this.metrics.pageLoad.domContentLoaded =
          nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
        this.metrics.pageLoad.loadComplete = nav.loadEventEnd - nav.loadEventStart;
      }

      // 监控绘制性能
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.pageLoad.firstContentfulPaint = entry.startTime;
        }
      });

      // 监控LCP (Largest Contentful, Paint)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.pageLoad.largestContentfulPaint = lastEntry.startTime;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (error) {
          console.warn('LCP observer not supported:', error);
        }
      }
    }
  }

  /**
   * 开始内存监控
   */
  private startMemoryMonitoring(): void {
    this.monitoringInterval = window.setInterval(() => {
      this.trackMemoryUsage();
    }, 5000); // 每5秒监控一次内存
  }

  /**
   * 跟踪内存使用情况
   */
  trackMemoryUsage(): void {
    const memoryInfo = SafePerformanceAPI.getMemoryInfo();
    if (memoryInfo) {
      this.metrics.memory = {
        usedJSHeapSize: memoryInfo.usedJSHeapSize || 0,
        totalJSHeapSize: memoryInfo.totalJSHeapSize || 0,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit || 0,
        timestamp: Date.now()
      };
    }

    // Electron进程内存监控
    if (isElectron && window.electron) {
      // 可以通过IPC获取主进程内存信息
      // window.electron.ipcRenderer.invoke('get-memory-usage').then(...)
    }
  }

  /**
   * 跟踪页面加载性能
   */
  trackPageLoad(route: string): void {
    const startTime = performance.now();

    // 使用requestIdleCallback在空闲时测量
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const loadTime = performance.now() - startTime;
        console.log(`📊 页面加载性能 [${route}]: ${loadTime.toFixed(2)}ms`);
      });
    }
  }

  /**
   * 跟踪音频加载性能
   */
  trackAudioLoad(url: string, duration: number): void {
    this.metrics.audio.loadTime = duration;

    // 计算缓冲健康度（简化版）
    this.metrics.audio.bufferHealth =
      duration < 1000 ? 100 : Math.max(0, 100 - (duration - 1000) / 100);

    console.log(`🎵 音频加载性能 [${url}]: ${duration.toFixed(2)}ms`);
  }

  /**
   * 跟踪路由切换性能
   */
  trackRouteChange(from: string, to: string, duration: number): void {
    this.metrics.navigation.routeChangeTime = duration;
    console.log(`🔄 路由切换性能 [${from} → ${to}]: ${duration.toFixed(2)}ms`);
  }

  /**
   * 生成实时性能报告
   */
  generateRealTimeReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      baseline: this.baseline,
      analysis: this.analyzePerformance()
    };

    return report;
  }

  /**
   * 分析性能数据
   */
  private analyzePerformance() {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // 内存使用分析
    const memoryUsagePercent =
      (this.metrics.memory.usedJSHeapSize / this.metrics.memory.jsHeapSizeLimit) * 100;
    if (memoryUsagePercent > 80) {
      issues.push('内存使用率过高');
      recommendations.push('考虑优化内存使用或增加垃圾回收');
      score -= 20;
    }

    // 页面加载性能分析
    if (this.metrics.pageLoad.largestContentfulPaint > 2500) {
      issues.push('LCP时间过长');
      recommendations.push('优化关键资源加载和渲染');
      score -= 15;
    }

    // 音频加载性能分析
    if (this.metrics.audio.loadTime > 2000) {
      issues.push('音频加载时间过长');
      recommendations.push('优化音频预加载策略');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  /**
   * 加载性能基准
   */
  private loadBaseline(): void {
    try {
      const stored = localStorage.getItem('performance-baseline');
      if (stored) {
        this.baseline = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('无法加载性能基准:', error);
    }
  }

  /**
   * 保存性能基准
   */
  saveBaseline(): void {
    const baseline: PerformanceBaseline = {
      pageLoadTime: this.metrics.pageLoad.loadComplete,
      memoryUsage: this.metrics.memory.usedJSHeapSize,
      audioLoadTime: this.metrics.audio.loadTime,
      routeChangeTime: this.metrics.navigation.routeChangeTime
    };

    try {
      localStorage.setItem('performance-baseline', JSON.stringify(baseline));
      this.baseline = baseline;
      console.log('💾, 性能基准已保存');
    } catch (error) {
      console.error('保存性能基准失败:', error);
    }
  }

  /**
   * 获取当前性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 检查是否正在监控
   */
  get isActive(): boolean {
    return this.isMonitoring.value;
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 自动初始化（在开发环境或启用性能监控时）
if (import.meta.env.DEV || localStorage.getItem('enable-performance-monitor') === 'true') {
  performanceMonitor.initialize();
}

export default performanceMonitor;
