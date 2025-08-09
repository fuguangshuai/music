/**
 * 统一验证工厂
 *
 * 目标：整合项目中重复的验证逻辑，提供统一的验证API
 *
 * 整合内容：
 * 1. 验证规则（来自 modules/validation/index.ts）
 * 2. 数据验证模式
 * 3. 表单验证逻辑
 * 4. API参数验证
 * 5. 类型守卫函数
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import type { UnifiedValidationResult, UnifiedValidationRule } from '../types/consolidated-types';

// ============================================================================
// 统一的验证工厂类
// ============================================================================

/**
 * 验证器构建器类
 */
export class UnifiedValidationBuilder<T = any> {
  private rules: UnifiedValidationRule<T>[] = [];
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  /**
   * 添加验证规则
   */
  rule(rule: UnifiedValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * 添加必填验证
   */
  required(message = '此字段为必填项'): this {
    return this.rule({
      name: 'required',
      validate: (value) => {
        if (typeof value === 'string') return Boolean(value && value.trim());
        if (Array.isArray(value)) return value.length > 0;
        return value != null && value !== undefined;
      },
      message
    });
  }

  /**
   * 添加长度验证
   */
  length(min?: number, max?: number, message?: string): this {
    if (min !== undefined) {
      this.rule({
        name: 'minLength',
        validate: (value) => {
          const length =
            typeof value === 'string' ? value.length : Array.isArray(value) ? value.length : 0;
          return length >= min;
        },
        message: message || `最少需要 ${min} 个字符`
      });
    }

    if (max !== undefined) {
      this.rule({
        name: 'maxLength',
        validate: (value) => {
          const length =
            typeof value === 'string' ? value.length : Array.isArray(value) ? value.length : 0;
          return length <= max;
        },
        message: message || `最多允许 ${max} 个字符`
      });
    }

    return this;
  }

  /**
   * 添加数值范围验证
   */
  range(min?: number, max?: number, message?: string): this {
    if (min !== undefined) {
      this.rule({
        name: 'min',
        validate: (value) => {
          const num = typeof value === 'number' ? value : parseFloat(String(value));
          return !isNaN(num) && num >= min;
        },
        message: message || `值不能小于 ${min}`
      });
    }

    if (max !== undefined) {
      this.rule({
        name: 'max',
        validate: (value) => {
          const num = typeof value === 'number' ? value : parseFloat(String(value));
          return !isNaN(num) && num <= max;
        },
        message: message || `值不能大于 ${max}`
      });
    }

    return this;
  }

  /**
   * 添加正则表达式验证
   */
  pattern(regex: RegExp, message = '格式不正确'): this {
    return this.rule({
      name: 'pattern',
      validate: (value) => {
        if (value == null || value === '') return true;
        return regex.test(String(value));
      },
      message
    });
  }

  /**
   * 添加自定义验证
   */
  custom(
    validate: (value: T) => boolean | Promise<boolean>,
    message: string,
    name = 'custom'
  ): this {
    return this.rule({
      name,
      validate,
      message
    });
  }

  /**
   * 执行验证
   */
  async validate(): Promise<UnifiedValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of this.rules) {
      try {
        const isValid = await rule.validate(this.value);
        if (!isValid) {
          if (rule.level === 'warning') {
            warnings.push(rule.message);
          } else {
            errors.push(rule.message);
          }
        }
      } catch (error) {
        errors.push(`验证规则 ${rule.name} 执行失败: ${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// ============================================================================
// 预定义验证规则
// ============================================================================

/**
 * 字符串验证规则
 */
export const stringValidators = {
  email: (message = '邮箱格式不正确'): UnifiedValidationRule<string> => ({
    name: 'email',
    validate: (value) => {
      if (!value) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message
  }),

  phone: (message = '手机号格式不正确'): UnifiedValidationRule<string> => ({
    name: 'phone',
    validate: (value) => {
      if (!value) return true;
      return /^1[3-9]\d{9}$/.test(value);
    },
    message
  }),

  url: (message = 'URL格式不正确'): UnifiedValidationRule<string> => ({
    name: 'url',
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  numeric: (message = '必须是数字'): UnifiedValidationRule<string> => ({
    name: 'numeric',
    validate: (value) => {
      if (!value) return true;
      return /^\d+$/.test(value);
    },
    message
  }),

  alphanumeric: (message = '只能包含字母和数字'): UnifiedValidationRule<string> => ({
    name: 'alphanumeric',
    validate: (value) => {
      if (!value) return true;
      return /^[a-zA-Z0-9]+$/.test(value);
    },
    message
  })
};

/**
 * 数字验证规则
 */
export const numberValidators = {
  positive: (message = '必须是正数'): UnifiedValidationRule<number> => ({
    name: 'positive',
    validate: (value) => value > 0,
    message
  }),

  negative: (message = '必须是负数'): UnifiedValidationRule<number> => ({
    name: 'negative',
    validate: (value) => value < 0,
    message
  }),

  integer: (message = '必须是整数'): UnifiedValidationRule<number> => ({
    name: 'integer',
    validate: (value) => Number.isInteger(value),
    message
  })
};

/**
 * 数组验证规则
 */
export const arrayValidators = {
  unique: (message = '不能有重复项'): UnifiedValidationRule<any[]> => ({
    name: 'unique',
    validate: (value) => {
      if (!Array.isArray(value)) return true;
      const set = new Set(value);
      return set.size === value.length;
    },
    message
  }),

  contains: (item: any, message = '必须包含指定项'): UnifiedValidationRule<any[]> => ({
    name: 'contains',
    validate: (value) => {
      if (!Array.isArray(value)) return false;
      return value.includes(item);
    },
    message
  })
};

// ============================================================================
// 便捷的验证函数
// ============================================================================

/**
 * 创建验证器
 */
export const createValidator = <T>(value: T): UnifiedValidationBuilder<T> => {
  return new UnifiedValidationBuilder(value);
};

/**
 * 快速验证函数
 */
export const validate = {
  /**
   * 验证字符串
   */
  string: (value: string) => createValidator(value),

  /**
   * 验证数字
   */
  number: (value: number) => createValidator(value),

  /**
   * 验证数组
   */
  array: (value: any[]) => createValidator(value),

  /**
   * 验证对象
   */
  object: (value: object) => createValidator(value),

  /**
   * 验证邮箱
   */
  email: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * 验证URL
   */
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 验证手机号
   */
  phone: (phone: string): boolean => {
    return /^1[3-9]\d{9}$/.test(phone);
  },

  /**
   * 验证ID（数字或字符串数字）
   */
  id: (id: any): boolean => {
    if (typeof id === 'number') return id > 0 && Number.isInteger(id);
    if (typeof id === 'string') return /^\d+$/.test(id) && parseInt(id) > 0;
    return false;
  },

  /**
   * 验证音乐相关参数
   */
  musicParams: (params: any): boolean => {
    if (!params || typeof params !== 'object') return false;

    // 验证ID
    if (params.id && !validate.id(params.id)) return false;
    if (params.ids && (!Array.isArray(params.ids) || !params.ids.every(validate.id))) return false;

    // 验证分页参数
    if (params.limit && (typeof params.limit !== 'number' || params.limit <= 0)) return false;
    if (params.offset && (typeof params.offset !== 'number' || params.offset < 0)) return false;

    return true;
  }
};

// ============================================================================
// 类型守卫函数
// ============================================================================

/**
 * 检查是否为有效的音乐ID
 */
export const isMusicId = (value: any): value is number => {
  return typeof value === 'number' && value > 0 && Number.isInteger(value);
};

/**
 * 检查是否为有效的用户ID
 */
export const isUserId = (value: any): value is number => {
  return isMusicId(value);
};

/**
 * 检查是否为有效的分页参数
 */
export const isPaginationParams = (value: any): value is { limit?: number; offset?: number } => {
  if (!value || typeof value !== 'object') return false;

  if (value.limit !== undefined && (typeof value.limit !== 'number' || value.limit <= 0)) {
    return false;
  }

  if (value.offset !== undefined && (typeof value.offset !== 'number' || value.offset < 0)) {
    return false;
  }

  return true;
};

/**
 * 检查是否为有效的搜索参数
 */
export const isSearchParams = (value: any): value is { keywords: string; type?: number } => {
  if (!value || typeof value !== 'object') return false;

  if (!value.keywords || typeof value.keywords !== 'string' || !value.keywords.trim()) {
    return false;
  }

  if (value.type !== undefined && (typeof value.type !== 'number' || value.type < 0)) {
    return false;
  }

  return true;
};

// ============================================================================
// 表单验证助手
// ============================================================================

/**
 * 表单字段验证器
 */
export class FormValidator {
  private fields = new Map<string, UnifiedValidationBuilder<any>>();

  /**
   * 添加字段验证
   */
  field<T>(name: string, value: T): UnifiedValidationBuilder<T> {
    const validator = createValidator(value);
    this.fields.set(name, validator);
    return validator;
  }

  /**
   * 验证所有字段
   */
  async validateAll(): Promise<Record<string, UnifiedValidationResult>> {
    const results: Record<string, UnifiedValidationResult> = {};

    for (const [name, validator] of this.fields) {
      results[name] = await validator.validate();
    }

    return results;
  }

  /**
   * 检查是否所有字段都有效
   */
  async isValid(): Promise<boolean> {
    const results = await this.validateAll();
    return Object.values(results).every((result) => result.valid);
  }

  /**
   * 获取所有错误
   */
  async getErrors(): Promise<Record<string, string[]>> {
    const results = await this.validateAll();
    const errors: Record<string, string[]> = {};

    for (const [name, result] of Object.entries(results)) {
      if (result.errors.length > 0) {
        errors[name] = result.errors;
      }
    }

    return errors;
  }
}

/**
 * 创建表单验证器
 */
export const createFormValidator = (): FormValidator => {
  return new FormValidator();
};
