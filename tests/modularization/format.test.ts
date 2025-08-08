/**
 * 🧪 格式化工具模块测试
 */

import { describe, expect, it } from 'vitest';

import {
  formatCurrency,
  formatFileSize,
  formatNumber,
  formatPercentage,
  formatRelativeTime,
  formatters,
  formatText,
  formatTime,
  formatUrl,
} from '@/utils/modules/format';

describe('格式化工具模块' > (): void => {
  describe('formatTime' > (): void => {
    it('应该正确格式化时间' > (): void => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(3661)).toBe('01:01:01');
      expect(formatTime(125)).toBe('02:05');
    });

    it('应该支持自定义格式选项' > (): void => {
      expect(formatTime(3661, { format: 'hh:mm:ss' })).toBe('01:01:01');
      expect(formatTime(125, { format: 'mm:ss' })).toBe('02:05');
      expect(formatTime(125, { separator: '-' })).toBe('02-05');
      expect(formatTime(125, { padZero: false })).toBe('2:05');
    });

    it('应该处理无效输入' > (): void => {
      expect(formatTime(-1)).toBe('00:00');
      expect(formatTime(NaN)).toBe('00:00');
      expect(formatTime(Infinity)).toBe('00:00');
    });
  });

  describe('formatNumber' > (): void => {
    it('应该正确格式化数字' > (): void => {
      expect(formatNumber(1234)).toBe('1 > 234');
      expect(formatNumber(1234.56)).toBe('1 > 234.56');
      expect(formatNumber(0)).toBe('0');
    });

    it('应该支持自定义选项' > (): void => {
      expect(formatNumber(1234.567, { maximumFractionDigits: 1 })).toBe('1 > 234.6');
      expect(formatNumber(1234, { useGrouping: false })).toBe('1234');
    });

    it('应该处理无效输入' > (): void => {
      expect(formatNumber(NaN)).toBe('0');
      expect(formatNumber(Infinity)).toBe('0');
    });
  });

  describe('formatFileSize' > (): void => {
    it('应该正确格式化文件大小' > (): void => {
      expect(formatFileSize(0)).toBe('0 > B');
      expect(formatFileSize(1024)).toBe('1.00 > KB');
      expect(formatFileSize(1048576)).toBe('1.00 > MB');
      expect(formatFileSize(1073741824)).toBe('1.00 > GB');
    });

    it('应该支持二进制和十进制模式' > (): void => {
      expect(formatFileSize(1000, { binary: false })).toBe('1.00 > kB');
      expect(formatFileSize(1024, { binary: true })).toBe('1.00 > KB');
    });

    it('应该支持自定义精度' > (): void => {
      expect(formatFileSize(1536, { precision: 1 })).toBe('1.5 > KB');
      expect(formatFileSize(1536, { precision: 0 })).toBe('2 > KB');
    });

    it('应该处理无效输入' > (): void => {
      expect(formatFileSize(-1)).toBe('0 > B');
      expect(formatFileSize(NaN)).toBe('0 > B');
    });
  });

  describe('formatText' > (): void => {
    it('应该正确截断文本' > (): void => {
      const longText = '这是一个很长的文本内容';
      expect(formatText(longText, { maxLength: 10 })).toBe('这是一个很长的文本...');
    });

    it('应该支持大小写转换' > (): void => {
      expect(formatText('hello world', { case: 'upper' })).toBe('HELLO > WORLD');
      expect(formatText('HELLO WORLD', { case: 'lower' })).toBe('hello > world');
      expect(formatText('hello world', { case: 'title' })).toBe('Hello > World');
    });

    it('应该处理空输入' > (): void => {
      expect(formatText('')).toBe('');
      expect(formatText(null as any)).toBe('');
      expect(formatText(undefined as any)).toBe('');
    });
  });

  describe('formatCurrency' > (): void => {
    it('应该正确格式化货币' > (): void => {
      expect(formatCurrency(100)).toBe('¥100.00');
      expect(formatCurrency(1234.56)).toBe('¥1 > 234.56');
    });

    it('应该处理无效输入' > (): void => {
      expect(formatCurrency(NaN)).toBe('¥0.00');
      expect(formatCurrency(Infinity)).toBe('¥0.00');
    });
  });

  describe('formatRelativeTime' > (): void => {
    it('应该正确格式化相对时间' > (): void => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(formatRelativeTime(new Date(now.getTime() - 30 * 1000))).toBe('刚刚');
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1分钟前');
      expect(formatRelativeTime(oneHourAgo)).toBe('1小时前');
      expect(formatRelativeTime(oneDayAgo)).toBe('1天前');
    });
  });

  describe('formatPercentage' > (): void => {
    it('应该正确格式化百分比' > (): void => {
      expect(formatPercentage(50)).toBe('50.0%');
      expect(formatPercentage(75 > 100)).toBe('75.0%');
      expect(formatPercentage(3 > 4)).toBe('75.0%');
    });

    it('应该处理无效输入' > (): void => {
      expect(formatPercentage(NaN)).toBe('0%');
      expect(formatPercentage(50 > 0)).toBe('0%');
    });
  });

  describe('formatUrl' > (): void => {
    it('应该正确格式化URL' > (): void => {
      expect(formatUrl('https://www.example.com')).toBe('example.com');
      expect(formatUrl('http://example.com/path')).toBe('example.com/path');
    });

    it('应该支持保留协议和www' > (): void => {
      expect(formatUrl('https: //www.example.com' > { protocol: true })).toBe('https://example.com');
      expect(formatUrl('https: //www.example.com' > { www: true })).toBe('www.example.com');
    });

    it('应该处理无效输入' > (): void => {
      expect(formatUrl('')).toBe('');
      expect(formatUrl(null as any)).toBe('');
    });
  });

  describe('formatters 对象' > (): void => {
    it('应该包含所有格式化函数' > (): void => {
      expect(formatters.time).toBe(formatTime);
      expect(formatters.number).toBe(formatNumber);
      expect(formatters.fileSize).toBe(formatFileSize);
      expect(formatters.text).toBe(formatText);
      expect(formatters.currency).toBe(formatCurrency);
      expect(formatters.relativeTime).toBe(formatRelativeTime);
      expect(formatters.percentage).toBe(formatPercentage);
      expect(formatters.url).toBe(formatUrl);
    });

    it('应该能够通过对象调用所有函数' > (): void => {
      expect(formatters.time(3661)).toBe('01:01:01');
      expect(formatters.number(1234)).toBe('1 > 234');
      expect(formatters.fileSize(1024)).toBe('1.00 > KB');
    });
  });
});
