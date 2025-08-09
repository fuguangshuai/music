/**
 * 🌐 统一浏览器API类型安全工具
 * 整合项目中重复的浏览器API调用和类型安全包装
 *
 * 功能特性：
 * - 网络连接API的类型安全包装
 * - 性能监控API的类型安全访问
 * - 音频API的类型安全操作
 * - 存储API的类型安全管理
 * - 导航API的类型安全使用
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import { unifiedTypeGuards } from './unified-type-guards';

// ============================================================================
// 网络连接API类型安全包装器
// ============================================================================

/**
 * 网络连接信息接口
 */
export interface SafeNetworkConnection {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
}

/**
 * 网络连接API类型安全工具
 * 用于替代项目中的 (navigator as any).connection 模式
 */
export class SafeNetworkAPI {
  /**
   * 安全获取网络连接信息
   */
  static getConnection(): SafeNetworkConnection | null {
    if (typeof navigator === 'undefined') {
      console.warn('🌐 Navigator API不可用');
      return null;
    }

    // 尝试多种可能的连接API
    const possibleConnections = [
      (navigator as any).connection,
      (navigator as any).mozConnection,
      (navigator as any).webkitConnection
    ];

    for (const connection of possibleConnections) {
      if (unifiedTypeGuards.isObject(connection)) {
        return {
          effectiveType: this.validateEffectiveType(connection.effectiveType),
          downlink: unifiedTypeGuards.isNumber(connection.downlink)
            ? connection.downlink
            : undefined,
          rtt: unifiedTypeGuards.isNumber(connection.rtt) ? connection.rtt : undefined,
          saveData: unifiedTypeGuards.isBoolean(connection.saveData)
            ? connection.saveData
            : undefined,
          type: this.validateConnectionType(connection.type)
        };
      }
    }

    return null;
  }

  /**
   * 检查网络连接是否可用
   */
  static isOnline(): boolean {
    if (typeof navigator === 'undefined') {
      return true; // 默认假设在线
    }
    return navigator.onLine;
  }

  /**
   * 检查是否为慢速网络
   */
  static isSlowConnection(): boolean {
    const connection = this.getConnection();
    if (!connection) return false;

    return (
      connection.effectiveType === '2g' ||
      connection.effectiveType === 'slow-2g' ||
      (connection.downlink !== undefined && connection.downlink < 1.5)
    );
  }

  /**
   * 验证有效类型
   */
  private static validateEffectiveType(value: any): SafeNetworkConnection['effectiveType'] {
    const validTypes = ['2g', '3g', '4g', 'slow-2g'];
    return validTypes.includes(value) ? value : undefined;
  }

  /**
   * 验证连接类型
   */
  private static validateConnectionType(value: any): SafeNetworkConnection['type'] {
    const validTypes = [
      'bluetooth',
      'cellular',
      'ethernet',
      'none',
      'wifi',
      'wimax',
      'other',
      'unknown'
    ];
    return validTypes.includes(value) ? value : undefined;
  }
}

// ============================================================================
// 性能监控API类型安全包装器
// ============================================================================

/**
 * 内存信息接口
 */
export interface SafeMemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

/**
 * 性能监控API类型安全工具
 * 用于替代项目中的 (performance as any).memory 模式
 */
export class SafePerformanceAPI {
  /**
   * 安全获取内存信息
   */
  static getMemoryInfo(): SafeMemoryInfo | null {
    if (typeof performance === 'undefined') {
      console.warn('🌐 Performance API不可用');
      return null;
    }

    const memory = (performance as any).memory;
    if (!unifiedTypeGuards.isObject(memory)) {
      return null;
    }

    return {
      usedJSHeapSize: unifiedTypeGuards.isNumber(memory.usedJSHeapSize)
        ? memory.usedJSHeapSize
        : undefined,
      totalJSHeapSize: unifiedTypeGuards.isNumber(memory.totalJSHeapSize)
        ? memory.totalJSHeapSize
        : undefined,
      jsHeapSizeLimit: unifiedTypeGuards.isNumber(memory.jsHeapSizeLimit)
        ? memory.jsHeapSizeLimit
        : undefined
    };
  }

  /**
   * 安全获取当前时间戳
   */
  static now(): number {
    if (typeof performance !== 'undefined' && unifiedTypeGuards.isFunction(performance.now)) {
      return performance.now();
    }
    return Date.now();
  }

  /**
   * 安全标记性能时间点
   */
  static mark(name: string): boolean {
    if (typeof performance === 'undefined' || !unifiedTypeGuards.isFunction(performance.mark)) {
      return false;
    }

    try {
      performance.mark(name);
      return true;
    } catch (error) {
      console.warn('🌐 性能标记失败', error);
      return false;
    }
  }

  /**
   * 安全测量性能
   */
  static measure(name: string, startMark?: string, endMark?: string): boolean {
    if (typeof performance === 'undefined' || !unifiedTypeGuards.isFunction(performance.measure)) {
      return false;
    }

    try {
      if (startMark && endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name);
      }
      return true;
    } catch (error) {
      console.warn('🌐 性能测量失败', error);
      return false;
    }
  }

  /**
   * 格式化内存大小
   */
  static formatMemorySize(bytes?: number): string {
    if (!unifiedTypeGuards.isNumber(bytes)) {
      return '未知';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

// ============================================================================
// 存储API类型安全包装器
// ============================================================================

/**
 * 存储API类型安全工具
 * 用于替代项目中不安全的存储操作
 */
export class SafeStorageAPI {
  /**
   * 安全的localStorage操作
   */
  static localStorage = {
    /**
     * 安全获取localStorage项
     */
    getItem(key: string): string | null {
      if (typeof localStorage === 'undefined') {
        console.warn('🌐 localStorage不可用');
        return null;
      }

      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('🌐 localStorage读取失败', error);
        return null;
      }
    },

    /**
     * 安全设置localStorage项
     */
    setItem(key: string, value: string): boolean {
      if (typeof localStorage === 'undefined') {
        console.warn('🌐 localStorage不可用');
        return false;
      }

      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.error('🌐 localStorage写入失败', error);
        return false;
      }
    },

    /**
     * 安全删除localStorage项
     */
    removeItem(key: string): boolean {
      if (typeof localStorage === 'undefined') {
        console.warn('🌐 localStorage不可用');
        return false;
      }

      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('🌐 localStorage删除失败', error);
        return false;
      }
    },

    /**
     * 安全获取JSON数据
     */
    getJSON<T>(key: string, fallback?: T): T | null {
      const value = this.getItem(key);
      if (!value) return fallback || null;

      try {
        return JSON.parse(value);
      } catch (error) {
        console.error('🌐 JSON解析失败', error);
        return fallback || null;
      }
    },

    /**
     * 安全设置JSON数据
     */
    setJSON(key: string, value: any): boolean {
      try {
        const jsonString = JSON.stringify(value);
        return this.setItem(key, jsonString);
      } catch (error) {
        console.error('🌐 JSON序列化失败', error);
        return false;
      }
    }
  };

  /**
   * 安全的sessionStorage操作
   */
  static sessionStorage = {
    /**
     * 安全获取sessionStorage项
     */
    getItem(key: string): string | null {
      if (typeof sessionStorage === 'undefined') {
        console.warn('🌐 sessionStorage不可用');
        return null;
      }

      try {
        return sessionStorage.getItem(key);
      } catch (error) {
        console.error('🌐 sessionStorage读取失败', error);
        return null;
      }
    },

    /**
     * 安全设置sessionStorage项
     */
    setItem(key: string, value: string): boolean {
      if (typeof sessionStorage === 'undefined') {
        console.warn('🌐 sessionStorage不可用');
        return false;
      }

      try {
        sessionStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.error('🌐 sessionStorage写入失败', error);
        return false;
      }
    }
  };
}

// ============================================================================
// 便捷的工具函数
// ============================================================================

/**
 * 快速获取网络连接信息
 */
export const getNetworkConnection = (): SafeNetworkConnection | null => {
  return SafeNetworkAPI.getConnection();
};

/**
 * 快速检查网络状态
 */
export const isOnline = (): boolean => {
  return SafeNetworkAPI.isOnline();
};

/**
 * 快速检查慢速网络
 */
export const isSlowConnection = (): boolean => {
  return SafeNetworkAPI.isSlowConnection();
};

/**
 * 快速获取内存信息
 */
export const getMemoryInfo = (): SafeMemoryInfo | null => {
  return SafePerformanceAPI.getMemoryInfo();
};

/**
 * 快速格式化内存大小
 */
export const formatMemorySize = (bytes?: number): string => {
  return SafePerformanceAPI.formatMemorySize(bytes);
};

/**
 * 默认导出
 */
export default {
  SafeNetworkAPI,
  SafePerformanceAPI,
  SafeStorageAPI,
  getNetworkConnection,
  isOnline,
  isSlowConnection,
  getMemoryInfo,
  formatMemorySize
};
