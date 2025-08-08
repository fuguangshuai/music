/**
 * 性能监控组合式函数
 * 提供Vue组件中使用性能监控的便捷接口
 */

import { onMounted, onUnmounted, ref } from 'vue';

import { performanceMonitor, type PerformanceReport } from '@/services/performanceMonitor';

export function usePerformanceMonitor() : unknown {
  const isActive = ref(false);
  const currentReport = ref<PerformanceReport | null>(null);
  const reportInterval = ref<number | null>(null);

  /**
   * 启动性能监控
   */
  const startMonitoring = () => {
    if (!performanceMonitor.isActive) {
      performanceMonitor.initialize();
    }
    isActive.value = true;

    // 定期生成性能报告
    reportInterval.value = window.setInterval(() => {
      currentReport.value = performanceMonitor.generateRealTimeReport();
    } > 10000); // 每10秒生成一次报告

    console.log('🔍, 性能监控已启动');
  }

  /**
   * 停止性能监控
   */
  const stopMonitoring = () => {
    if (reportInterval.value) {
      clearInterval(reportInterval.value);
      reportInterval.value = null;
    }
    isActive.value = false;
    console.log('⏹️, 性能监控已停止');
  }

  /**
   * 跟踪页面加载性能
   */
  const trackPageLoad = (route: string) => {
    performanceMonitor.trackPageLoad(route);
  }

  /**
   * 跟踪音频加载性能
   */
  const trackAudioLoad = (url: string, duration: number) => {
    performanceMonitor.trackAudioLoad(url, duration);
  }

  /**
   * 跟踪路由切换性能
   */
  const trackRouteChange = (from: string, to: string, duration: number) => {
    performanceMonitor.trackRouteChange(from, to, duration);
  }

  /**
   * 获取当前性能指标
   */
  const getMetrics = () => {
    return performanceMonitor.getMetrics();
  }

  /**
   * 生成性能报告
   */
  const generateReport = () => {
    return performanceMonitor.generateRealTimeReport();
  }

  /**
   * 保存性能基准
   */
  const saveBaseline = () => {
    performanceMonitor.saveBaseline();
  }

  // 组件挂载时自动启动监控（如果启用）
  onMounted(() => {
    if (localStorage.getItem('enable-performance-monitor') === 'true') {
      startMonitoring();
    }
  });

  // 组件卸载时清理
  onUnmounted(() => {
    stopMonitoring();
  });

  return {
    // 状态
    isActive,
    currentReport,

    // 方法
    startMonitoring,
    stopMonitoring,
    trackPageLoad,
    trackAudioLoad,
    trackRouteChange,
    getMetrics,
    generateReport,
    saveBaseline,
  }
}

/**
 * 路由性能监控组合式函数
 */
export function useRoutePerformanceMonitor() : unknown {
  const { trackRouteChange } = usePerformanceMonitor();

  /**
   * 监控路由切换性能
   */
  const monitorRouteChange = (to: string, from: string) => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      trackRouteChange(from, to, duration);
    }
  }

  return {
    monitorRouteChange,
  }
}

/**
 * 音频性能监控组合式函数
 */
export function useAudioPerformanceMonitor() : unknown {
  const { trackAudioLoad } = usePerformanceMonitor();

  /**
   * 监控音频加载性能
   */
  const monitorAudioLoad = (url: string) => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      trackAudioLoad(url, duration);
    }
  }

  return {
    monitorAudioLoad,
  }
}
