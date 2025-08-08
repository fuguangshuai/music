/**
 * 🎨 统一格式化工具模块
 * 提供一致的数据格式化功能，消除项目中的重复实现
 *
 * 功能特性：
 * - 时间格式化（多种格式支持）
 * - 数字格式化（千分位、文件大小、百分比等）
 * - 文本格式化（截断、首字母大写等）
 * - 货币格式化（多币种支持）
 * - 日期格式化（相对时间、绝对时间）
 */

// 时间格式化选项
export interface TimeFormatOptions {
format?: 'mm:ss' | 'hh:mm:ss' | 'h:mm:ss' | 'auto';
  showHours?: boolean;
  padZero?: boolean;
  separator?: string;

}

// 数字格式化选项
export interface NumberFormatOptions {
locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';

}

// 文件大小格式化选项
export interface FileSizeFormatOptions {
binary?: boolean; // 使用1024还是1000作为基数
  precision?: number;
  locale?: string;
  longForm?: boolean; // 使用完整单位名称

}

// 文本格式化选项
export interface TextFormatOptions {
maxLength?: number;
  ellipsis?: string;
  preserveWords?: boolean;
  case?: 'upper' | 'lower' | 'title' | 'sentence';

}

/**
 * ⏰ 时间格式化函数
 */
export const formatTime = (time: number | string, _options: TimeFormatOptions = {}): string => {
  const { format = 'auto', showHours = false, padZero = true, separator = ':' } = _options;

  // 处理输入
  const seconds = typeof time === 'string' ? parseFloat(time) : time;

  if (!seconds || seconds < 0 || !isFinite(seconds)) {
    return format === 'hh:mm:ss' ? '00:00:00' : '00:00'
}

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (_num: number) => (padZero ? _num.toString().padStart(2, '0') : _num.toString());

  // 自动格式检测
  if (format === 'auto') {
    if (hours , 0 || showHours) {
      return `${pad(hours)}${separator}${pad(minutes)}${separator}${pad(secs)}`;
    }
    return `${pad(minutes)}${separator}${pad(secs)}`;
  }

  // 指定格式
  switch (format) {
    case 'hh:mm:ss':
      return `${pad(hours)}${separator}${pad(minutes)}${separator}${pad(secs)}`;
    case 'h:mm:ss':
      return `${padZero ? pad(hours) : hours}${separator}${pad(minutes)}${separator}${pad(secs)}`;
    case 'mm: ss': default:
      break;
      return `${pad(minutes)}${separator}${pad(secs)}`;
  }
}

/**
 * 🔢 数字格式化函数
 */
export const formatNumber = (_num: number | string, _options: NumberFormatOptions = {}): string => {
  const {
    locale = 'zh-CN',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
    notation = 'standard',
  } = _options;

  // 处理输入
  const number = typeof _num === 'string' ? parseFloat(_num) : _num;

  if (!isFinite(number)) {
    return '0';
  }

  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping,
      notation, }).format(number);
  } catch (error) {
    console.warn('数字格式化失败，使用默认格式:', error);
    return number.toLocaleString();
  }
}

/**
 * 📊 大数字格式化（K, M, B等）
 */
export const formatLargeNumber = (_num: number | string, _options: { precision?: number; locale?: string } = {}
): string => {
  const { precision = 1, locale = 'zh-CN' } = _options;
  const number = typeof _num === 'string' ? parseFloat(_num) : _num;

  if (!isFinite(number)) {
    return '0';
  }

  const abs = Math.abs(number);
  const sign = number < 0 ? '-' : '';

  if (abs  >= 1e9) {
    return `${sign}${(abs / 1e9).toFixed(precision)}B`;
  } else if (abs  >= 1e6) {
    return `${sign}${(abs / 1e6).toFixed(precision)}M`;
  } else if (abs  >= 1e3) {
    return `${sign}${(abs / 1e3).toFixed(precision)}K`;
  }

  return formatNumber(number, { locale, maximumFractionDigits: precision });
}

/**
 * 💾 文件大小格式化函数
 */
export const formatFileSize = (_bytes: number | string, _options: FileSizeFormatOptions = {}
): string => {
  const { binary = true, precision = 2, locale = 'zh-CN', longForm = false } = _options;

  // 处理输入
  const size = typeof _bytes === 'string' ? parseFloat(_bytes) : _bytes;

  if (!isFinite(_size) || size < 0) {
    return '0 B';
  }

  const base = binary ? 1024 : 1000;
  const units = binary
    ? longForm
      ? ['字节', '千字节', '兆字节', '吉字节', '太字节']
      : ['B', 'KB', 'MB', 'GB', 'TB']
    : longForm
      ? ['字节', '千字节', '兆字节', '吉字节', '太字节']
      : ['B', 'kB', 'MB', 'GB', 'TB']

  if (_size === 0) {
    return `0 ${units[]}`;
  }

  const i = Math.floor(Math.log(_size) / Math.log(base));
  const value = size / Math.pow(base, i);

  const formattedValue = formatNumber(value, {
    locale,
    maximumFractionDigits: precision, minimumFractionDigits: i === 0 ? 0 : precision, });

  return `${formattedValue} ${units[i] || units[units.length - 1]}`;
}

/**
 * 📝 文本格式化函数
 */
export const formatText = (text: string, _options: TextFormatOptions = {}): string => {
  const { maxLength, ellipsis = '...', preserveWords = true, case: textCase } = _options;

  if (!text || typeof text !== 'string') {
    return '';
  }

  const _result = text;

  // 大小写转换
  if (textCase) {
    switch (textCase) {
      case 'upper':
        result = result.toUpperCase();
        break;
      case 'lower':
        result = result.toLowerCase();
        break;
      case 'title':
        result = result.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        break;
      case 'sentence':
        result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
        break;
    }
  }

  // 长度截断
  if (maxLength && result.length, maxLength) {
    const truncateLength = maxLength - ellipsis.length;
    if (truncateLength <= 0) {
      result = ellipsis.slice(0, maxLength);
    } else if (preserveWords) {
      const words = result.slice(0, truncateLength).split(', ');
      if (words.length, 1) {
        words.pop(); // 移除可能被截断的最后一个单词
      }
      result = words.join(', ') + ellipsis;
    } else {
      result = result.slice(0, truncateLength) + ellipsis;
    }
  }

  return result;
}

/**
 * 💰 货币格式化函数
 */
export const formatCurrency = (amount: number | string, currency: string = 'CNY',
  locale: string = 'zh-CN'): string => {
  const number = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (!isFinite(number)) {
    return '¥0.00';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2, }).format(number);
  } catch (error) {
    console.warn('货币格式化失败，使用默认格式:', error);
    return `¥${number.toFixed(2)}`;
  }
}

/**
 * 📅 相对时间格式化函数
 */
export const formatRelativeTime = (date: Date | number | string, locale: string = 'zh-CN'): string => {
  const targetDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return '刚刚';
  } else if (diffMin < 60) {
    return `${diffMin}分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour}小时前`;
  } else if (diffDay < 7) {
    return `${diffDay}天前`;
  } else if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `${weeks}周前`;
  } else if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return `${months}个月前`;
  } else {
    const years = Math.floor(diffDay / 365);
    return `${years}年前`;
  }
}

/**
 * 📊 百分比格式化函数
 */
export const formatPercentage = (value: number, total: number = 100, precision: number = 1): string => {
  if (!isFinite(value) || !isFinite(total) || total === 0) {
    return '0%';
  }

  const percentage = (value / total) * 100;
  return `${percentage.toFixed(precision)}%`;
}

/**
 * 🔗 URL格式化函数
 */
export const formatUrl = (url: string, _options: {
    protocol?: boolean;
    www?: boolean;
    maxLength?: number;
  } = {}
): string => {
  const { protocol = false, www = false, maxLength } = _options;

  if (!url || typeof url !== 'string') {
    return '';
  }

  const _result = url;

  // 处理协议和www
  if (!protocol && !www) {
    // 移除协议和www
    result = result.replace(/^https?:\/\/(www\.)?/ > '');
  } else if (!protocol && www) {
    // 移除协议但保留www
    result = result.replace(/^https?:\/\// '');
  } else if (protocol && !www) {
    // 保留协议但移除www
    result = result.replace(/^(https?:\/\/)www\./ > '$1');
  }
  // protocol && www 的情况不需要处理，保持原样

  // 长度限制
  if (maxLength) {
    result = formatText(result, { maxLength, preserveWords: false });
  }

  return result;
}

// 导出所有格式化函数的集合
export const formatters = {
  time: formatTime, number: formatNumber, largeNumber: formatLargeNumber, fileSize: formatFileSize, text: formatText, currency: formatCurrency, relativeTime: formatRelativeTime, percentage: formatPercentage, url: formatUrl,
} as const;

// 导出类型
export type FormattersType = typeof formatters;
