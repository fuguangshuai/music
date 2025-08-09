/**
 * ✅ 统一验证工具模块
 * 提供一致的数据验证功能，支持链式调用和自定义验证规则
 *
 * 功能特性：
 * - 基础类型验证（字符串、数字、布尔值等）
 * - 格式验证（邮箱、URL、手机号等）
 * - 业务验证（音乐ID、用户ID等）
 * - 链式验证和组合验证
 * - 自定义验证规则
 */

// 验证结果接口
export interface ValidationResult {
valid: boolean;
  errors: string[];
  warnings: string[];
}

// 验证规则接口
export interface ValidationRule<T = any> {
  name: string;
  validate: (value: T) => boolean | Promise<boolean>;
  message: string;
  level?: 'error' | 'warning';
}

// 验证器类
export class Validator<T = any> {
  private rules: ValidationRule<T>[] = []
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  /**
   * 添加验证规则
   */
  rule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * 执行验证
   */
  async validate(): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

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
      warnings,
    }
  }

  /**
   * 同步验证（仅支持同步规则）
   */
  validateSync(): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    for (const rule of this.rules) {
      try {
        const result = rule.validate(this.value);
        if (result instanceof Promise) {
          console.warn(`规则 ${rule.name} 是异步的，请使用, validate() 方法`);
          continue;
        }

        if (!result) {
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
      warnings,
    }
  }
}

/**
 * 创建验证器
 */
export const createValidator = <T>(value: T): Validator<T> => {
  return new Validator(value);
}

/**
 * 🔤 字符串验证规则
 */
export const stringRules = {
  required: (message = '此字段为必填项'): ValidationRule<string> => ({ name: 'required', validate: value => Boolean(value && value.trim()),
    message }),

  minLength: (min: number, _message?: string): ValidationRule<string> => ({
    name: 'minLength', validate: value => !value || value.length >= min,
    message: _message || `最少需要 ${min} 个字符`, }),

  maxLength: (max: number, _message?: string): ValidationRule<string> => ({
    name: 'maxLength', validate: value => !value || value.length <= max,
    message: _message || `最多允许 ${max} 个字符`, }),

  pattern: (regex: RegExp, _message = '格式不正确'): ValidationRule<string> => ({
    name: 'pattern', validate: value => !value || regex.test(value),
    message: _message, }),

  email: (message = '邮箱格式不正确'): ValidationRule<string> => ({ name: 'email', validate: value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message }),

  url: (message = 'URL格式不正确'): ValidationRule<string> => ({ name: 'url', validate: value => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message, }),

  phone: (message = '手机号格式不正确'): ValidationRule<string> => ({ name: 'phone', validate: value => !value || /^1[3-9]\d{9}$/.test(value),
    message }),
}

/**
 * 🔢 数字验证规则
 */
export const numberRules = {
  required: (message = '此字段为必填项'): ValidationRule<number> => ({ name: 'required', validate: value => value !== null && value !== undefined && !isNaN(value),
    message }),

  min: (min: number, _message?: string): ValidationRule<number> => ({
    name: 'min', validate: value => value == null || value >= min,
    message: _message || `最小值为 ${min}`, }),

  max: (max: number, _message?: string): ValidationRule<number> => ({
    name: 'max', validate: value => value == null || value <= max,
    message: _message || `最大值为 ${max}`, }),

  integer: (message = '必须是整数'): ValidationRule<number> => ({ name: 'integer', validate: value => value == null || Number.isInteger(value),
    message }),

  positive: (message = '必须是正数'): ValidationRule<number> => ({ name: 'positive', validate: value => value == null || value > 0,
    message }),

  nonNegative: (message = '不能是负数'): ValidationRule<number> => ({ name: 'nonNegative', validate: value => value == null || value >= 0,
    message }),
}

/**
 * 📋 数组验证规则
 */
export const arrayRules = {
  required: (message = '此字段为必填项'): ValidationRule<any[]> => ({ name: 'required', validate: value => Array.isArray(value) && value.length > 0,
    message }),

  minLength: (min: number, message?: string): ValidationRule<any[]> => ({
    name: 'minLength', validate: value => !Array.isArray(value) || value.length >= min,
    message: message || `至少需要 ${min} 个项目` }),

  maxLength: (max: number, message?: string): ValidationRule<any[]> => ({
    name: 'maxLength', validate: value => !Array.isArray(value) || value.length <= max,
    message: message || `最多允许 ${max} 个项目` }),

  unique: (message = '不能有重复项'): ValidationRule<any[]> => ({ name: 'unique', validate: value => {
      if (!Array.isArray(value)) return true;
      const set = new Set(value);
      return set.size === value.length;
    },
    message }),
}

/**
 * 🎵 音乐业务验证规则
 */
export const musicRules = {
  songId: (message = '歌曲ID格式不正确'): ValidationRule<string | number> => ({ name: 'songId', validate: value => {
      if (!value) return false;
      const id = String(value);
      return /^\d+$/.test(id) && parseInt(id) > 0;
    },
    message }),

  playlistId: (message = '歌单ID格式不正确'): ValidationRule<string | number> => ({ name: 'playlistId', validate: value => {
      if (!value) return false;
      const id = String(value);
      return /^\d+$/.test(id) && parseInt(id) > 0;
    },
    message, }),

  userId: (message = '用户ID格式不正确'): ValidationRule<string | number> => ({ name: 'userId', validate: value => {
      if (!value) return false;
      const id = String(value);
      return /^\d+$/.test(id) && parseInt(id) > 0;
    },
    message }),

  duration: (message = '时长格式不正确'): ValidationRule<number> => ({ name: 'duration', validate: value => {
      return typeof value === 'number' && value >= 0 && value <= 7200; // 最长2小时
    },
    message }),

  audioUrl: (message = '音频URL格式不正确'): ValidationRule<string> => ({ name: 'audioUrl', validate: value => {
      if (!value) return false;
      try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    },
    message }),
}

/**
 * 🔧 通用验证函数
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
  array: (value: unknown[]) => createValidator(value),

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
   * 验证身份证号
   */
  _idCard: (idCard: string): boolean => {
    return /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(idCard
  ,  );
  },

  /**
   * 验证IP地址
   */
  _ip: (ip: string): boolean => {
    return /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(ip);
  },

  /**
   * 验证MAC地址
   */
  _mac: (mac: string): boolean => {
    return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac);
  },

  /**
   * 验证颜色值（十六进制）
   */
  _color: (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  },

  /**
   * 验证密码强度
   */
  passwordStrength: (
    password: string
  ): {
    score: number;
    level: 'weak' | 'medium' | 'strong' | 'very-strong';
    suggestions: string[];
  } => {
    let score = 0;
    const suggestions: string[] = [];

    if (password.length >= 8) score += 1;
    else suggestions.push('密码长度至少8位');

    if (/[a-z]/.test(password)) score += 1;
    else suggestions.push('包含小写字母');

    if (/[A-Z]/.test(password)) score += 1;
    else suggestions.push('包含大写字母');

    if (/\d/.test(password)) score += 1;
    else suggestions.push('包含数字');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else suggestions.push('包含特殊字符');

    const levels = ['weak', 'weak', 'medium', 'strong', 'very-strong'] as const;

    return {
      score,
      level: levels[score] || 'weak',
      suggestions,
    }
  },
}

/**
 * 🔄 组合验证器
 */
export class CompositeValidator {
  private validators: { [key: string]: Validator } = {}

  /**
   * 添加字段验证器
   */
  field<T>(name: string, value: T): Validator<T> {
    const validator = createValidator(value);
    this.validators[name] = validator;
    return validator;
  }

  /**
   * 验证所有字段
   */
  async validateAll(): Promise<{ [key: string]: ValidationResult }> {
    const results: { [key: string]: ValidationResult } = {};

    for (const [name, validator] of Object.entries(this.validators)) {
      results[name] = await validator.validate();
    }

    return results;
  }

  /**
   * 检查是否所有字段都有效
   */
  async isValid(): Promise<boolean> {
    const results = await this.validateAll();
    return Object.values(results).every(result => result.valid);
  }
}

/**
 * 创建组合验证器
 */
export const createCompositeValidator = (): CompositeValidator => {
  return new CompositeValidator();
}

// 导出所有验证规则的集合
export const validationRules = {
  string: stringRules, number: numberRules, array: arrayRules, music: musicRules,
} as const;
