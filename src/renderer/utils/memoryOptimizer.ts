// 内存统计接口
export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryUsage: number; // 使用率百分比
}

// 内存优化器类
class MemoryOptimizer {
  private cleanupTasks: Array<() => void> = [];
  private monitoringInterval: number | null = null;
  private memoryThreshold = 0.8; // 80%内存使用率阈值

  /**
   * 获取当前内存统计信息
   */
  getMemoryStats(): MemoryStats {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
      };
    }

    // 如果不支持memory API，返回默认值
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      memoryUsage: 0
    };
  }

  /**
   * 注册清理任务
   */
  registerCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  /**
   * 执行内存清理
   */
  cleanup(): void {
    // 执行所有注册的清理任务
    this.cleanupTasks.forEach((task) => {
      try {
        task();
      } catch (error) {
        console.warn('Memory cleanup task failed:', error);
      }
    });

    // 强制垃圾回收（如果支持）
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
      } catch (error) {
        console.warn('Manual garbage collection failed:', error);
      }
    }
  }

  /**
   * 开始内存监控
   */
  startMonitoring(interval = 30000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = window.setInterval(() => {
      const stats = this.getMemoryStats();

      if (stats.memoryUsage > this.memoryThreshold) {
        console.warn('High memory usage detected:', stats);
        this.cleanup();
      }
    }, interval);
  }

  /**
   * 停止内存监控
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * 设置内存使用率阈值
   */
  setMemoryThreshold(threshold: number): void {
    this.memoryThreshold = Math.max(0.1, Math.min(0.95, threshold));
  }

  /**
   * 清理图片缓存
   */
  clearImageCache(): void {
    // 清理可能的图片缓存
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (img.src && img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    });
  }

  /**
   * 清理音频缓存
   */
  clearAudioCache(): void {
    // 清理可能的音频缓存
    const audios = document.querySelectorAll('audio');
    audios.forEach((audio) => {
      if (audio.src && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
      }
    });
  }

  /**
   * 获取内存使用建议
   */
  getMemoryAdvice(): string[] {
    const stats = this.getMemoryStats();
    const advice: string[] = [];

    if (stats.memoryUsage > 0.9) {
      advice.push('内存使用率过高，建议关闭一些标签页或重启应用');
    } else if (stats.memoryUsage > 0.7) {
      advice.push('内存使用率较高，建议清理缓存');
    }

    if (stats.usedJSHeapSize > 100 * 1024 * 1024) {
      // 100MB
      advice.push('JavaScript堆内存使用较多，建议清理不必要的数据');
    }

    return advice;
  }
}

// 创建全局实例
export const memoryOptimizer = new MemoryOptimizer();

// 默认导出
export default memoryOptimizer;

// 类型已在接口定义时导出
