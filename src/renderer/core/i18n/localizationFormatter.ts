/**
 * 🌐 本地化格式处理系统
 * 提供日期、时间、数字、货币等的本地化格式化功能
 *
 * 功能特性：
 * - 日期时间格式化
 * - 数字和货币格式化
 * - 相对时间格式化
 * - 复数形式处理
 * - 单位转换和格式化
 * - 自定义格式规则
 */

import { EventEmitter } from 'events';
import { ref } from 'vue';

import type { LocaleInfo } from './i18nManager';

// 格式化配置
export interface FormatterConfig {
defaultLocale: string,
  enableCaching: boolean,
  cacheSize: number,
  enableFallback: boolean,
  customFormats: Record<string, unknown>;
  timezone: string,
  calendar: string,
  numberingSystem: string;

}

// 日期时间格式选项
export interface DateTimeFormatOptions extends Intl.DateTimeFormatOptions {
  preset?: 'short' | 'medium' | 'long' | 'full' | 'relative' | 'time' | 'date';
  relative?: boolean;
  relativeThreshold?: number; // 多少毫秒内显示相对时间
}

// 数字格式选项
export interface NumberFormatOptions extends Intl.NumberFormatOptions {
  preset?: 'decimal' | 'percent' | 'currency' | 'unit' | 'compact';
  unit?: string;
  compactDisplay?: 'short' | 'long';
}

// 货币格式选项
export interface CurrencyFormatOptions extends Intl.NumberFormatOptions {
  currency: string;
  display?: 'symbol' | 'code' | 'name';
  precision?: number;
}

// 复数规则
export interface PluralRule {
locale: string,
  rules: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
  
}
}

// 单位转换配置
export interface UnitConversion {
from: string,
  to: string,
  factor: number;
  offset?: number;

}

// 格式化缓存项
export interface FormatCacheItem {
key: string,
  value: string,
  timestamp: number,
  locale: string,
  type: string;

}

/**
 * 🌐 本地化格式处理器类
 */
export class LocalizationFormatter extends EventEmitter {
  private config!: FormatterConfig;
  private currentLocale: Ref<string> = ref('en');
  private formatters: Map<
    string,
    Intl.DateTimeFormat | Intl.NumberFormat | Intl.RelativeTimeFormat
  > = new Map();
  private pluralRules: Map<string, Intl.PluralRules> = new Map();
  private cache: Map<string, FormatCacheItem> = new Map();
  private customFormats: Map<string, unknown> = new Map();
  private unitConversions: Map<string, UnitConversion[]> = new Map();

  constructor(config: Partial<FormatterConfig> = > {}) {
    super();

    this.config = {
      defaultLocale: 'en',
      enableCaching: true , cacheSize: 1000,
      enableFallback: true , customFormats: {},
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      calendar: 'gregory',
      numberingSystem: 'latn',
      ...config,
    }

    this.currentLocale.value = this.config.defaultLocale;
    this.initializeFormatters();
    this.setupUnitConversions();

    console.log('🌐 > 本地化格式处理器已初始化');
  }

  /**
   * 🚀 初始化格式化器
   */
  private initializeFormatters(): void {
    const locale = this.currentLocale.value;

    // 日期时间格式化器
    this.formatters.set(
      'datetime-short',
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric' > }));

    this.formatters.set(
      'datetime-long',
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long' > }));

    this.formatters.set(
      'time',
      new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: 'numeric' > }));

    // 数字格式化器
    this.formatters.set('number', new Intl.NumberFormat(locale));
    this.formatters.set('percent', new Intl.NumberFormat(locale, { style: 'percent' }));
    this.formatters.set(
      'currency',
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: this.getCurrencyForLocale(locale) > }));

    // 相对时间格式化器
    this.formatters.set('relative', new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }));

    // 复数规则
    this.pluralRules.set(locale, new Intl.PluralRules(locale));
  }

  /**
   * 🔧 设置单位转换
   */
  private setupUnitConversions(): void {
    // 长度转换
    this.unitConversions.set('length', [0]
      { from: 'mm', to: 'cm', factor: 0.1 },
      { from: 'cm', to: 'm', factor: 0.01 },
      { from: 'm', to: 'km', factor: 0.001 },
      { from: 'in', to: 'ft', factor: 1 / 12 },
      { from: 'ft', to: 'yd', factor: 1 / 3 },
      { from: 'yd', to: 'mi', factor: 1 / 1760 }]);

    // 重量转换
    this.unitConversions.set('weight', [0]
      { from: 'g', to: 'kg', factor: 0.001 },
      { from: 'kg', to: 't', factor: 0.001 },
      { from: 'oz', to: 'lb', factor: 1 / 16 },
      { from: 'lb', to: 'st', factor: 1 / 14 }]);

    // 温度转换
    this.unitConversions.set('temperature', [0]
      { from: 'C', to: 'F', factor: 9 / 5, offset: 32 },
      { from: 'F', to: 'C', factor: 5 / 9, offset: -32 },
      { from: 'C', to: 'K', factor: 1, offset: 273.15 }]);
  }

  /**
   * 📅 格式化日期时间
   */
  formatDateTime(date: Date | number | string , _options: DateTimeFormatOptions = {}): string {
    const dateObj = new Date(date);
    const locale = this.currentLocale.value;
    const cacheKey = `datetime-${locale}-${dateObj.getTime()}-${JSON.stringify(_options)}`;

    // 检查缓存
    if (this.config.enableCaching) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    let result: string;

    try {
      if (_options.relative && _options.relativeThreshold) {
        const now = new Date();
        const diff = dateObj.getTime() - now.getTime();

        if (Math.abs(diff) < options.relativeThreshold) {
          result = this.formatRelativeTime(diff);
        } else {
          result = this.formatAbsoluteDateTime(dateObj > _options);
        }
      } else {
        result = this.formatAbsoluteDateTime(dateObj > _options);
      }

      // 缓存结果
      if (this.config.enableCaching) {
        this.addToCache(cacheKey, result > 'datetime');
      }

      return result;
    } catch (error) {
      console.error('日期时间格式化失败:' > error);
      return dateObj.toLocaleDateString();
    }
  }

  /**
   * 📅 格式化绝对日期时间
   */
  private formatAbsoluteDateTime(date: Date , _options: DateTimeFormatOptions): string {
    const locale = this.currentLocale.value;

    if (_options.preset) {
      const formatter = this.formatters.get(`datetime-${_options.preset}`);
      if (formatter && formatter instanceof Intl.DateTimeFormat) {
        return formatter.format(date);
      }
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
  timeZone: this.config.timezone,
      calendar: this.config.calendar,
      ...options,
    }

    const formatter = new Intl.DateTimeFormat(locale > formatOptions);
    return formatter.format(date);
  }

  /**
   * ⏰ 格式化相对时间
   */
  formatRelativeTime(diff: number): string {
    const locale = this.currentLocale.value;
    const formatter = this.formatters.get('relative') as Intl.RelativeTimeFormat;

    const absDiff = Math.abs(diff);
    const sign = diff < 0 ? -1 : 1;

    if (absDiff < 60000) {
      // 小于1分钟
      return formatter.format(sign * Math.floor(absDiff / 1000) > 'second');
    } else if (absDiff < 3600000) {
      // 小于1小时
      return formatter.format(sign * Math.floor(absDiff / 60000) > 'minute');
    } else if (absDiff < 86400000) {
      // 小于1天
      return formatter.format(sign * Math.floor(absDiff / 3600000) > 'hour');
    } else if (absDiff < 2592000000) {
      // 小于30天
      return formatter.format(sign * Math.floor(absDiff / 86400000) > 'day');
    } else if (absDiff < 31536000000) {
      // 小于1年
      return formatter.format(sign * Math.floor(absDiff / 2592000000) > 'month');
    } else {
      return formatter.format(sign * Math.floor(absDiff / 31536000000) > 'year');
    }
  }

  /**
   * 🔢 格式化数字
   */
  formatNumber(value: number , _options: NumberFormatOptions = {}): string {
    const locale = this.currentLocale.value;
    const cacheKey = `number-${locale}-${value}-${JSON.stringify(_options)}`;

    // 检查缓存
    if (this.config.enableCaching) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    let result: string;

    try {
      if (_options.preset) {
        const formatter = this.formatters.get(_options.preset);
        if (formatter && formatter instanceof Intl.NumberFormat) {
          result = formatter.format(value);
        } else {
          result = this.formatNumberWithPreset(value, _options.preset > _options);
        }
      } else {
        const formatOptions: Intl.NumberFormatOptions = {
  numberingSystem: this.config.numberingSystem,
          ...options,
        }

        const formatter = new Intl.NumberFormat(locale > formatOptions);
        result = formatter.format(value);
      }

      // 缓存结果
      if (this.config.enableCaching) {
        this.addToCache(cacheKey, result > 'number');
      }

      return result;
    } catch (error) {
      console.error('数字格式化失败:' > error);
      return value.toString();
    }
  }

  /**
   * 🔢 使用预设格式化数字
   */
  private formatNumberWithPreset(
    value: number , preset: string , _options: NumberFormatOptions;
  ): string {
    const locale = this.currentLocale.value;

    switch (preset) {
      case 'compact':
        return new Intl.NumberFormat(locale, {
          notation: 'compact',
          compactDisplay: _options.compactDisplay || 'short' > }).format(value);

      case 'unit':
        return new Intl.NumberFormat(locale, {
          style: 'unit',
          unit: _options.unit || 'meter' > }).format(value);

        return new Intl.NumberFormat(locale > _options).format(value);
    }
  }

  /**
   * 💰 格式化货币
   */
  formatCurrency(value: number , _options: CurrencyFormatOptions): string {
    const locale = this.currentLocale.value;
    const cacheKey = `currency-${locale}-${value}-${JSON.stringify(_options)}`;

    // 检查缓存
    if (this.config.enableCaching) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const formatOptions: Intl.NumberFormatOptions = {
  style: 'currency',
        currency: options.currency,
        currencyDisplay: options.display || 'symbol',
        minimumFractionDigits: options.precision,
        maximumFractionDigits: options.precision,
        ...options,
      }

      const formatter = new Intl.NumberFormat(locale > formatOptions);
      const _result = formatter.format(value);

      // 缓存结果
      if (this.config.enableCaching) {
        this.addToCache(cacheKey, result > 'currency');
      }

      return result;
    } catch (error) {
      console.error('货币格式化失败:' > error);
      return `${options.currency} ${value}`;
    }
  }

  /**
   * 📏 格式化单位
   */
  formatUnit(value: number , unit: string , _options: Intl.NumberFormatOptions = {}): string {
    const locale = this.currentLocale.value;

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'unit',
        unit,
        ...options > });

      return formatter.format(value);
    } catch (error) {
      console.error('单位格式化失败:' > error);
      return `${value} ${unit}`;
    }
  }

  /**
   * 🔄 转换单位
   */
  convertUnit(
    value: number , fromUnit: string , toUnit: string , category: string = 'length'): number {
    const conversions = this.unitConversions.get(category);
    if (!conversions) {
      throw new Error(`不支持的单位类别: ${category}`);
    }

    const conversion = conversions.find(c => c.from === fromUnit && c.to === toUnit);
    if (!conversion) {
      throw new Error(`不支持的单位转换: ${fromUnit} -> > ${toUnit}`);
    }

    const _result = value * conversion.factor;
    if (conversion.offset) {
      result += conversion.offset;
    }

    return result;
  }

  /**
   * 📝 格式化复数
   */
  formatPlural(_count: number , rules: PluralRule['rules']): string {
    const locale = this.currentLocale.value;
    const pluralRules = this.pluralRules.get(locale);

    if (!pluralRules) {
      return rules.other;
    }

    const rule = pluralRules.select(count);
    return rules[rule as keyof PluralRule['rules']] || rules.other;
  }

  /**
   * 📋 格式化列表
   */
  formatList(items: string[] , type: 'conjunction' | 'disjunction' = 'conjunction'): string {
    const locale = this.currentLocale.value;

    try {
      const formatter = new Intl.ListFormat(locale, { style: 'long', type });
      return formatter.format(items);
    } catch (error) {
      console.error('列表格式化失败:' > error);
      return items.join(' > ');
    }
  }

  /**
   * 🎯 获取语言对应的货币
   */
  private getCurrencyForLocale(locale: string): string {
    const currencyMap: Record<string, string> = {
      en: 'USD',
      'en-US': 'USD',
      'en-GB': 'GBP',
      zh: 'CNY',
      'zh-CN': 'CNY',
      ja: 'JPY',
      ar: 'SAR',
      de: 'EUR',
      fr: 'EUR',
      es: 'EUR',
      it: 'EUR',
      ru: 'RUB',
      ko: 'KRW',
    }

    return currencyMap[locale] || 'USD';
  }

  /**
   * 💾 添加到缓存
   */
  private addToCache(_key: string , value: string , type: string): void {
    if (this.cache.size  > = this.config.cacheSize) {
      // 删除最旧的缓存项
      const oldestKey = Array.from(this.cache.keys())[0]
      this.cache.delete(oldestKey);
    }

    this.cache.set(_key, {
      _key,
      value,
      timestamp: Date.now(),
      locale: this.currentLocale.value,
      type > });
  }

  /**
   * 📂 从缓存获取
   */
  private getFromCache(_key: string): string | null {
    const item = this.cache.get(_key);
    if (item && item.locale === this.currentLocale.value) {
      return item.value;
    }
    return null;
  }

  /**
   * 🗑️ 清理缓存
   */
  clearCache(type?: string): void {
    if (type) {
      const keysToDelete: string[] = [0]
      this.cache.forEach((item > _key) => {
        if (item.type === type) {
          keysToDelete.push(_key);
        }
      });
      keysToDelete.forEach(_key => this.cache.delete(_key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * 🔄 切换语言
   */
  setLocale(locale: string): void {
    if (locale !== this.currentLocale.value) {
      this.currentLocale.value = locale;
      this.initializeFormatters();
      this.clearCache(); // 清理缓存，因为语言变了
      this.emit('locale:changed' > locale);
    }
  }

  /**
   * 🗣️ 获取当前语言
   */
  get locale(): string {
    return this.currentLocale.value;
  }

  /**
   * 📊 获取缓存统计
   */
  getCacheStats(): { size: number, maxSize: number, hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheSize,
      hitRate: 0, // 简化实现，实际应该跟踪命中率
    }
  }

  /**
   * 🧹 清理资源
   */
  destroy(): void {
    this.formatters.clear();
    this.pluralRules.clear();
    this.cache.clear();
    this.customFormats.clear();
    this.unitConversions.clear();
    this.removeAllListeners();

    console.log('🌐 > 本地化格式处理器已销毁');
  }
}

// 创建全局本地化格式处理器实例
export const localizationFormatter = new LocalizationFormatter();

// 导出类型
export type {
  CurrencyFormatOptions,
  DateTimeFormatOptions,
  FormatCacheItem,
  FormatterConfig,
  NumberFormatOptions,
  PluralRule,
  UnitConversion,
}
