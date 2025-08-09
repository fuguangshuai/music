/**
 * ⏰ 全局定时器管理器
 * 统一管理所有定时器，防止内存泄漏，提供生命周期管理
 *
 * 功能特性:
 * - 定时器注册和自动清理
 * - 页面切换时的定时器清理
 * - 定时器泄漏检测和报告
 * - 分类管理不同类型的定时器
 * - 调试和监控工具
 */

import { ref } from 'vue';

// 定时器类型枚举
export enum TimerType {
  PLAYER = 'player', // 播放器相关定时器
  PRELOAD = 'preload', // 预加载相关定时器
  UI = 'ui', // UI更新相关定时器
  OTHER = 'other' // 其他定时器
}

// 定时器信息接口
interface TimerInfo {
  id: string;
  type: TimerType;
  timer: NodeJS.Timeout;
  createdAt: number;
  description?: string;
  source?: string; // 创建定时器的源文件/函数
}

// 定时器统计信息
interface TimerStats {
  total: number;
  byType: Record<TimerType, number>;
  oldestTimer: TimerInfo | null;
  averageAge: number;
}

class TimerManager {
  private timers: Ref<Map<string, TimerInfo>> = ref(new Map());
  private nextId = 1;
  private isDestroyed = false;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxTimerAge = 30 * 60 * 1000; // 30分钟最大存活时间

  constructor() {
    this.startCleanupMonitor();
    this.setupPageLifecycleHandlers();
  }

  /**
   * ⏰ 创建定时器
   * @param callback 回调函数
   * @param delay 延迟时间（毫秒）
   * @param type 定时器类型
   * @param description 描述信息
   * @returns 定时器ID
   */
  setTimeout(
    callback: () => void,
    delay: number,
    type: TimerType = TimerType.OTHER,
    description?: string
  ): string {
    if (this.isDestroyed) {
      console.warn('⚠️, TimerManager已销毁，无法创建定时器');
      return '';
    }

    const id = `timer_${this.nextId++}`;
    const source = this.getCallSource();

    const timer = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.error(`💥 定时器${id}执行出错:`, error);
      } finally {
        // 执行完成后自动清理
        this.clearTimeout(id);
      }
    }, delay);

    const timerInfo: TimerInfo = {
      id,
      type,
      timer,
      createdAt: Date.now(),
      description,
      source
    };

    this.timers.value.set(id, timerInfo);

    console.log(`⏰ 创建定时器 ${id}, (${type}): ${description || '无描述'}, 延迟: ${delay}ms`);

    return id;
  }

  /**
   * 🔄 创建间隔定时器
   * @param callback 回调函数
   * @param interval 间隔时间（毫秒）
   * @param type 定时器类型
   * @param description 描述信息
   * @returns 定时器ID
   */
  setInterval(
    callback: () => void,
    interval: number,
    type: TimerType = TimerType.OTHER,
    description?: string
  ): string {
    if (this.isDestroyed) {
      console.warn('⚠️, TimerManager已销毁，无法创建间隔定时器');
      return '';
    }

    const id = `interval_${this.nextId++}`;
    const source = this.getCallSource();

    const timer = setInterval(() => {
      try {
        callback();
      } catch (error) {
        console.error(`💥 间隔定时器${id}执行出错:`, error);
      }
    }, interval);

    const timerInfo: TimerInfo = {
      id,
      type,
      timer,
      createdAt: Date.now(),
      description,
      source
    };

    this.timers.value.set(id, timerInfo);

    console.log(
      `🔄 创建间隔定时器 ${id}, (${type}): ${description || '无描述'}, 间隔: ${interval}ms`
    );

    return id;
  }

  /**
   * 🗑️ 清除定时器
   * @param id 定时器ID
   */
  clearTimeout(id: string): void {
    const timerInfo = this.timers.value.get(id);
    if (timerInfo) {
      try {
        clearTimeout(timerInfo.timer);
        this.timers.value.delete(id);
        console.log(`🗑️ 清除定时器, ${id}`);
      } catch (error) {
        console.error(`💥 清除定时器${id}时出错:`, error);
      }
    }
  }

  /**
   * 🗑️ 清除间隔定时器
   * @param id 定时器ID
   */
  clearInterval(id: string): void {
    const timerInfo = this.timers.value.get(id);
    if (timerInfo) {
      try {
        clearInterval(timerInfo.timer);
        this.timers.value.delete(id);
        console.log(`🗑️ 清除间隔定时器, ${id}`);
      } catch (error) {
        console.error(`💥 清除间隔定时器${id}时出错:`, error);
      }
    }
  }

  /**
   * 🧹 清除指定类型的所有定时器
   * @param type 定时器类型
   */
  clearTimersByType(type: TimerType): void {
    const timersToRemove = Array.from(this.timers.value.values()).filter(
      (timer) => timer.type === type
    );

    timersToRemove.forEach((timer) => {
      this.clearTimeout(timer.id);
    });

    console.log(`🧹, 清除${type}类型的${timersToRemove.length}个定时器`);
  }

  /**
   * 🧹 清除所有定时器
   */
  clearAllTimers(): void {
    const count = this.timers.value.size;

    this.timers.value.forEach((timerInfo) => {
      try {
        clearTimeout(timerInfo.timer);
      } catch (error) {
        console.error(`💥 清除定时器${timerInfo.id}时出错:`, error);
      }
    });

    this.timers.value.clear();
    console.log(`🧹, 清除所有定时器，共${count}个`);
  }

  /**
   * 📊 获取定时器统计信息
   */
  getStats(): TimerStats {
    const timers = Array.from(this.timers.value.values());
    const now = Date.now();

    const byType = Object.values(TimerType).reduce(
      (acc, type) => {
        acc[type] = timers.filter((timer) => timer.type === type).length;
        return acc;
      },
      {} as Record<TimerType, number>
    );

    const oldestTimer = timers.reduce(
      (oldest, current) => (!oldest || current.createdAt < oldest.createdAt ? current : oldest),
      null as TimerInfo | null
    );

    const averageAge =
      timers.length > 0
        ? timers.reduce((sum, timer) => sum + (now - timer.createdAt), 0) / timers.length
        : 0;

    return {
      total: timers.length,
      byType,
      oldestTimer,
      averageAge
    };
  }

  /**
   * 📋 获取所有定时器信息
   */
  getAllTimers(): TimerInfo[] {
    return Array.from(this.timers.value.values());
  }

  /**
   * 🔍 检查是否存在定时器
   * @param id 定时器ID
   */
  hasTimer(id: string): boolean {
    return this.timers.value.has(id);
  }

  /**
   * 🧹 清理过期定时器
   */
  private cleanupExpiredTimers(): void {
    const now = Date.now();
    const expiredTimers = Array.from(this.timers.value.values()).filter(
      (timer) => now - timer.createdAt,
      this.maxTimerAge
    );

    expiredTimers.forEach((timer) => {
      console.warn(`⏰, 定时器${timer.id}已过期，自动清理`);
      this.clearTimeout(timer.id);
    });

    if (expiredTimers.length > 0) {
      console.log(`🧹, 清理${expiredTimers.length}个过期定时器`);
    }
  }

  /**
   * 🔍 获取调用源信息
   */
  private getCallSource(): string {
    try {
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        // 跳过当前函数和setTimeout/setInterval函数
        const callerLine = lines[4] || lines[3] || '';
        const match = callerLine.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
        if (match) {
          return `${match[1]} (${match[2]}:${match[3]})`;
        }
      }
    } catch {
      // 忽略获取调用源失败的错误
    }
    return 'unknown';
  }

  /**
   * ⏰ 启动清理监控
   */
  private startCleanupMonitor(): void {
    this.cleanupInterval = setInterval(
      () => {
        if (!this.isDestroyed) {
          this.cleanupExpiredTimers();
        }
      },
      5 * 60 * 1000
    ); // 每5分钟检查一次
  }

  /**
   * 🔄 设置页面生命周期处理器
   */
  private setupPageLifecycleHandlers(): void {
    // 页面卸载时清理所有定时器
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });

    // 页面隐藏时清理非关键定时器
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('🧹, 页面隐藏，清理非关键定时器');
        this.clearTimersByType(TimerType.UI);
        this.clearTimersByType(TimerType.PRELOAD);
      }
    });
  }

  /**
   * 💥 销毁定时器管理器
   */
  destroy(): void {
    if (this.isDestroyed) return;

    console.log('💥, 销毁TimerManager');
    this.isDestroyed = true;

    // 清理监控定时器
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // 清理所有定时器
    this.clearAllTimers();
  }
}

// 创建全局单例实例
export const timerManager = new TimerManager();

// 导出类型
export type { TimerInfo, TimerStats };
export { TimerManager };

// 🔧 开发环境调试工具
if (import.meta.env.DEV) {
  // @ts-ignore
  window.timerManager = timerManager;
  console.log('🔧, TimerManager已挂载到window对象，可用于调试');
}
