/**
 * 网络服务监测器
 * 提供网络状态检测、服务可用性监控和智能重试机制
 *
 * @author TypeScript企业级开发团队
 * @version 1.0.0
 * @since TypeScript 5.0+
 */

import { computed, type Ref, ref } from 'vue';

import type { AppError } from '@/utils/errorHandler';

/**
 * 网络状态枚举
 */
export enum NetworkStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  SLOW = 'slow',
  UNKNOWN = 'unknown'
}

/**
 * 服务状态枚举
 */
export enum ServiceStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  DEGRADED = 'degraded',
  CHECKING = 'checking'
}

/**
 * 服务健康检查结果
 */
export interface ServiceHealth {
  readonly status: ServiceStatus;
  readonly responseTime: number;
  readonly lastCheck: Date;
  readonly error?: AppError;
}

/**
 * 重试配置接口
 */
export interface RetryConfig {
  readonly maxAttempts: number;
  readonly baseDelay: number;
  readonly maxDelay: number;
  readonly backoffFactor: number;
  readonly jitter: boolean;
}

/**
 * 默认重试配置
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true
} as const;

/**
 * 网络监测器类
 * 提供网络状态监控、服务健康检查和智能重试功能
 */
class NetworkMonitor {
  private readonly networkStatus: Ref<NetworkStatus> = ref(NetworkStatus.UNKNOWN);
  private readonly serviceHealthMap = new Map<string, Ref<ServiceHealth>>();
  private readonly checkIntervals = new Map<string, number>();

  /**
   * 当前网络状态（只读）
   */
  public readonly status = computed(() => this.networkStatus.value);

  /**
   * 是否在线
   */
  public readonly isOnline = computed(() => this.networkStatus.value === NetworkStatus.ONLINE);

  /**
   * 网络是否缓慢
   */
  public readonly isSlow = computed(() => this.networkStatus.value === NetworkStatus.SLOW);

  constructor() {
    this.initializeNetworkDetection();
  }

  /**
   * 初始化网络检测
   * @private
   */
  private initializeNetworkDetection(): void {
    // 监听浏览器网络状态变化
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.networkStatus.value = NetworkStatus.ONLINE;
      });

      window.addEventListener('offline', () => {
        this.networkStatus.value = NetworkStatus.OFFLINE;
      });

      // 初始状态检测
      this.networkStatus.value = navigator.onLine ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE;
    }
  }

  /**
   * 注册服务健康检查
   * @param serviceName 服务名称
   * @param healthCheckUrl 健康检查URL
   * @param interval 检查间隔（毫秒）
   */
  public registerService(
    serviceName: string,
    healthCheckUrl: string,
    interval: number = 30000
  ): Ref<ServiceHealth> {
    const healthRef = ref<ServiceHealth>({
      status: ServiceStatus.CHECKING,
      responseTime: 0,
      lastCheck: new Date()
    });

    this.serviceHealthMap.set(serviceName, healthRef);

    // 立即检查一次
    this.checkServiceHealth(serviceName, healthCheckUrl);

    // 设置定期检查
    const intervalId = window.setInterval(() => {
      this.checkServiceHealth(serviceName, healthCheckUrl);
    }, interval);

    this.checkIntervals.set(serviceName, intervalId);

    return healthRef;
  }

  /**
   * 检查服务健康状态
   * @private
   */
  private async checkServiceHealth(serviceName: string, url: string): Promise<void> {
    const healthRef = this.serviceHealthMap.get(serviceName);
    if (!healthRef) return;

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 5000,
        signal: AbortSignal.timeout(5000)
      } as RequestInit);

      const responseTime = Date.now() - startTime;

      healthRef.value = {
        status: response.ok ? ServiceStatus.AVAILABLE : ServiceStatus.DEGRADED,
        responseTime,
        lastCheck: new Date()
      };

      // 根据响应时间判断网络速度
      if (response.ok && responseTime > 3000) {
        this.networkStatus.value = NetworkStatus.SLOW;
      } else if (response.ok) {
        this.networkStatus.value = NetworkStatus.ONLINE;
      }
    } catch (error) {
      healthRef.value = {
        status: ServiceStatus.UNAVAILABLE,
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error as AppError
      };
    }
  }

  /**
   * 获取服务健康状态
   */
  public getServiceHealth(serviceName: string): Ref<ServiceHealth> | undefined {
    return this.serviceHealthMap.get(serviceName);
  }

  /**
   * 智能重试函数
   * 实现指数退避算法，支持抖动和最大延迟限制
   */
  public async retryWithBackoff<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // 最后一次尝试失败，直接抛出错误
        if (attempt === finalConfig.maxAttempts) {
          throw lastError;
        }

        // 计算延迟时间（指数退避 + 可选抖动）
        let delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
          finalConfig.maxDelay
        );

        // 添加抖动以避免雷群效应
        if (finalConfig.jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }

        console.warn(`操作失败，${delay}ms后进行第${attempt + 1}次重试:`, error);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * 延迟函数
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    // 清理所有定时器
    this.checkIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.checkIntervals.clear();
    this.serviceHealthMap.clear();
  }
}

/**
 * 全局网络监测器实例
 */
export const networkMonitor = new NetworkMonitor();

/**
 * Vue组合式API钩子
 * 提供响应式的网络状态和服务健康监控
 */
export function useNetworkMonitor() {
  return {
    networkStatus: networkMonitor.status,
    isOnline: networkMonitor.isOnline,
    isSlow: networkMonitor.isSlow,
    registerService: networkMonitor.registerService.bind(networkMonitor),
    getServiceHealth: networkMonitor.getServiceHealth.bind(networkMonitor),
    retryWithBackoff: networkMonitor.retryWithBackoff.bind(networkMonitor)
  };
}

/**
 * 网络错误类型守卫
 */
export function isNetworkError(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;

  const networkErrorPatterns = [
    'ERR_NETWORK',
    'ERR_CONNECTION_REFUSED',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NAME_NOT_RESOLVED',
    'Failed to fetch',
    'Network request failed'
  ];

  return networkErrorPatterns.some(
    (pattern) => error.message.includes(pattern) || error.name.includes(pattern)
  );
}
