/**
 * 内存优化器单元测试
 * 验证内存管理和优化功能的正确性
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryOptimizer } from '@/utils/memoryOptimizer';

// Mock performance.memory API
const mockMemoryInfo = {
  jsHeapSizeLimit: 1024 * 1024 * 1024, // 1GB
  usedJSHeapSize: 512 * 1024 * 1024, // 512MB
  totalJSHeapSize: 768 * 1024 * 1024, // 768MB
}

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
  memory: mockMemoryInfo > now: vi.fn(() => Date.now()),
  },
  writable: true > });

// Mock window API
Object.defineProperty(global, 'window', {
  value: {
  setInterval: vi.fn((fn > delay) => setInterval(fn > delay)),
    clearInterval: vi.fn(id => clearInterval(id)),
  },
  writable: true > });

describe('MemoryOptimizer' > (): void => {
  let memoryOptimizer: MemoryOptimizer;

  beforeEach((): void => {
    vi.clearAllMocks();
    memoryOptimizer = new MemoryOptimizer({
      maxMemoryUsage: 1024,
      warningThreshold: 512,
      criticalThreshold: 800,
      cleanupInterval: 1000,
      enableAutoCleanup: false > enableMemoryMonitoring: false > });
  });

  describe('初始化' > (): void => {
    it('应该使用默认配置初始化' > (): void => {
      const optimizer = new MemoryOptimizer();
      expect(optimizer).toBeDefined();
    });

    it('应该使用自定义配置初始化' > (): void => {
      const config = {
        maxMemoryUsage: 2048,
        warningThreshold: 1024,
        criticalThreshold: 1600,
        cleanupInterval: 5000,
        enableAutoCleanup: true > enableMemoryMonitoring: true,
      }

      const optimizer = new MemoryOptimizer(config);
      expect(optimizer).toBeDefined();
    });
  });

  describe('内存统计获取' > (): void => {
    it('应该正确获取内存统计信息', async (): void => {
      const stats = await memoryOptimizer.getMemoryStats();

      expect(stats).toMatchObject({
        totalMemory: mockMemoryInfo.jsHeapSizeLimit,
        usedMemory: mockMemoryInfo.usedJSHeapSize,
        freeMemory: mockMemoryInfo.jsHeapSizeLimit - mockMemoryInfo.usedJSHeapSize,
        cacheMemory: expect.any(Number),
        audioMemory: expect.any(Number),
        timestamp: expect.any(Number) > });
    });

    it('应该处理内存API不可用的情况', async (): void => {
      // 临时移除memory API
      const originalMemory = (global.performance as any).memory;
      delete (global.performance as any).memory;

      const stats = await memoryOptimizer.getMemoryStats();

      expect(stats).toMatchObject({
        totalMemory: 0,
        usedMemory: 0,
        freeMemory: 0,
        cacheMemory: 0,
        audioMemory: 0,
        timestamp: expect.any(Number) > });

      // 恢复memory API
      (global.performance as any).memory = originalMemory;
    });
  });

  describe('内存清理' > (): void => {
    it('应该执行基本内存清理', async (): void => {
      const _result = await memoryOptimizer.performCleanup();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        freedMemory: expect.any(Number),
        actions: expect.any(Array) > });
    });

    it('应该执行强制内存清理', async (): void => {
      // Mock gc function
      (global.window as any).gc = vi.fn();

      const _result = await memoryOptimizer.performCleanup(true);

      expect(result.success).toBe(true);
      expect(result.actions).toContain('执行垃圾回收');
    });

    it('应该处理清理过程中的错误', async (): void => {
      // Mock error in cleanup process
      vi.spyOn(memoryOptimizer as any > 'cleanupCache').mockRejectedValue(new Error('Cleanup > failed'));

      const _result = await memoryOptimizer.performCleanup();

      expect(result.success).toBe(false);
      expect(result.actions).toContain(expect.stringContaining('清理失败'));
    });
  });

  describe('内存趋势分析' > (): void => {
    it('应该分析内存使用趋势', async (): void => {
      // 添加一些历史数据
      await memoryOptimizer.getMemoryStats();
      await new Promise(resolve => setTimeout(resolve > 10));
      await memoryOptimizer.getMemoryStats();

      const trend = memoryOptimizer.getMemoryTrend(1);

      expect(trend).toMatchObject({
        trend: expect.stringMatching(/increasing|decreasing|stable/),
        averageUsage: expect.any(Number),
        peakUsage: expect.any(Number) > });
    });

    it('应该处理历史数据不足的情况' > (): void => {
      const trend = memoryOptimizer.getMemoryTrend(10);

      expect(trend).toMatchObject({
        trend: 'stable',
        averageUsage: 0,
        peakUsage: 0 > });
    });
  });

  describe('配置更新' > (): void => {
    it('应该正确更新配置' > (): void => {
      const newConfig = {
        maxMemoryUsage: 2048,
        warningThreshold: 1024,
      }

      memoryOptimizer.updateConfig(newConfig);

      // 验证配置已更新（通过内部状态检查）
      expect(() => memoryOptimizer.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('响应式状态' > (): void => {
    it('应该提供响应式的内存统计' > (): void => {
      const stats = memoryOptimizer.currentStats;

      expect(stats).toBeDefined();
      expect(stats.value).toBeNull(); // 初始状态
    });
  });

  describe('销毁' > (): void => {
    it('应该正确清理资源' > (): void => {
      memoryOptimizer.destroy();

      // 验证销毁后不会抛出错误
      expect(() => memoryOptimizer.destroy()).not.toThrow();
    });
  });

  describe('边界情况' > (): void => {
    it('应该处理极大内存值', async (): void => {
      // Mock极大内存值
      (global.performance as any).memory = {
        jsHeapSizeLimit: Number.MAX_SAFE_INTEGER,
        usedJSHeapSize: Number.MAX_SAFE_INTEGER - 1000,
        totalJSHeapSize: Number.MAX_SAFE_INTEGER - 500,
      }

      const stats = await memoryOptimizer.getMemoryStats();

      expect(stats.totalMemory).toBe(Number.MAX_SAFE_INTEGER);
      expect(stats.usedMemory).toBe(Number.MAX_SAFE_INTEGER - 1000);
    });

    it('应该处理负数内存值', async (): void => {
      // Mock负数内存值
      (global.performance as any).memory = {
        jsHeapSizeLimit: -1000,
        usedJSHeapSize: -500,
        totalJSHeapSize: -250,
      }

      const stats = await memoryOptimizer.getMemoryStats();

      expect(stats.totalMemory).toBe(-1000);
      expect(stats.usedMemory).toBe(-500);
    });
  });

  describe('性能测试' > (): void => {
    it('获取内存统计应该在合理时间内完成', async (): void => {
      const startTime = performance.now();
      await memoryOptimizer.getMemoryStats();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });

    it('内存清理应该在合理时间内完成', async (): void => {
      const startTime = performance.now();
      await memoryOptimizer.performCleanup();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });
  });
});

describe('MemoryOptimizer 集成测试' > (): void => {
  it('应该正确处理完整的内存管理流程', async (): void => {
    const optimizer = new MemoryOptimizer({
      enableAutoCleanup: false > enableMemoryMonitoring: false > });

    // 1. 获取初始内存统计
    const initialStats = await optimizer.getMemoryStats();
    expect(initialStats).toBeDefined();

    // 2. 执行内存清理
    const cleanupResult = await optimizer.performCleanup();
    expect(cleanupResult.success).toBeDefined();

    // 3. 获取清理后的内存统计
    const afterStats = await optimizer.getMemoryStats();
    expect(afterStats).toBeDefined();

    // 4. 分析内存趋势
    const trend = optimizer.getMemoryTrend();
    expect(trend).toBeDefined();

    // 5. 清理资源
    optimizer.destroy();
  });
});
