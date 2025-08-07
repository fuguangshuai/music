/**
 * 重试工具函数单元测试
 * 验证重试逻辑的正确性和可靠性
 */

import { beforeEach,describe, expect, it, vi } from 'vitest';

import { withRetry, withRetryStats } from '@/utils/retry';

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed on first try', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    
    const result = await withRetry(mockFn, { maxRetries: 3 });
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should fail after max retries', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('persistent failure'));
    
    await expect(withRetry(mockFn, { maxRetries: 2 })).rejects.toThrow('persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('should respect delay between retries', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await withRetry(mockFn, { maxRetries: 1, delay: 100 });
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should call onRetry callback', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    const onRetry = vi.fn();
    
    await withRetry(mockFn, { maxRetries: 1, onRetry });
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 0);
  });

  it('should handle exponential backoff', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    
    const delays: number[] = [];
    const onRetry = vi.fn((_error, _attempt) => {
      delays.push(Date.now());
    });
    
    await withRetry(mockFn, { 
      maxRetries: 2, 
      delay: 50,
      exponentialBackoff: true,
      onRetry 
    });
    
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('should respect shouldRetry condition', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('retryable'))
      .mockRejectedValueOnce(new Error('non-retryable'))
      .mockResolvedValue('success');
    
    const shouldRetry = vi.fn((error: Error) => error.message === 'retryable');
    
    await expect(withRetry(mockFn, { 
      maxRetries: 2, 
      shouldRetry 
    })).rejects.toThrow('non-retryable');
    
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(shouldRetry).toHaveBeenCalledTimes(2);
  });
});

describe('withRetryStats', () => {
  it('should return retry statistics', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    
    const result = await withRetryStats(mockFn, { maxRetries: 1 });
    
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(2);
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should track failed attempts', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));
    
    try {
      await withRetryStats(mockFn, { maxRetries: 1 });
    } catch (_error) {
      // Expected to fail
    }
    
    // Should still track attempts even on failure
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('retry edge cases', () => {
  it('should handle zero retries', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));
    
    await expect(withRetry(mockFn, { maxRetries: 0 })).rejects.toThrow('fail');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle negative retries', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'));
    
    await expect(withRetry(mockFn, { maxRetries: -1 })).rejects.toThrow('fail');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle synchronous functions', async () => {
    const mockFn = vi.fn(() => 'sync result');
    
    const result = await withRetry(mockFn);
    
    expect(result).toBe('sync result');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle functions that throw synchronously', async () => {
    const mockFn = vi.fn(() => { throw new Error('sync error'); });
    
    await expect(withRetry(mockFn, { maxRetries: 1 })).rejects.toThrow('sync error');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
