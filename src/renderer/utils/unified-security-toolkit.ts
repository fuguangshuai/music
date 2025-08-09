/**
 * 统一安全工具集
 *
 * 目标：整合项目中分散的安全功能，提供统一的安全管理接口
 *
 * 整合内容：
 * 1. XSS 防护（来自 securityChecker.ts）
 * 2. CSRF 防护（来自 securityChecker.ts）
 * 3. 输入验证（来自 validation 模块）
 * 4. 数据清理（来自多个工具函数）
 * 5. 安全存储（来自 localStorage 使用）
 * 6. 内容安全策略
 *
 * @author TypeScript重构项目组
 * @since v4.11.0
 */

import { Ref, ref } from 'vue';

// ============================================================================
// 安全配置接口
// ============================================================================

/**
 * 安全配置选项
 */
export interface SecurityConfig {
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableInputSanitization: boolean;
  enableSecureStorage: boolean;
  enableContentSecurityPolicy: boolean;
  autoMitigation: boolean;
  reportingEnabled: boolean;
}

/**
 * 安全威胁级别
 */
export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 安全威胁类型
 */
export enum ThreatType {
  XSS = 'xss',
  CSRF = 'csrf',
  INJECTION = 'injection',
  DATA_LEAK = 'data_leak',
  INSECURE_STORAGE = 'insecure_storage',
  WEAK_AUTHENTICATION = 'weak_auth'
}

/**
 * 安全威胁信息
 */
export interface SecurityThreat {
  id: string;
  type: ThreatType;
  level: SecurityLevel;
  title: string;
  description: string;
  location?: string;
  evidence?: string;
  mitigation: string;
  timestamp: number;
  resolved: boolean;
}

/**
 * 安全检查结果
 */
export interface SecurityCheckResult {
  passed: boolean;
  threats: SecurityThreat[];
  score: number;
  recommendations: string[];
  timestamp: number;
}

// ============================================================================
// 输入清理和验证
// ============================================================================

/**
 * HTML 清理选项
 */
export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripScripts?: boolean;
  stripEvents?: boolean;
}

/**
 * 统一的输入清理器
 */
export class InputSanitizer {
  private static readonly DANGEROUS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<form[^>]*>/gi,
    /<input[^>]*>/gi
  ];

  private static readonly DANGEROUS_ATTRIBUTES = [
    'onclick',
    'onload',
    'onerror',
    'onmouseover',
    'onmouseout',
    'onfocus',
    'onblur',
    'onchange',
    'onsubmit',
    'onreset'
  ];

  /**
   * 清理 HTML 内容
   */
  static sanitizeHTML(input: string, options: SanitizeOptions = {}): string {
    if (!input || typeof input !== 'string') return '';

    const {
      allowedTags = ['p', 'br', 'strong', 'em', 'span'],
      allowedAttributes = {},
      stripScripts = true,
      stripEvents = true
    } = options;

    let sanitized = input;

    // 移除危险的脚本和标签
    if (stripScripts) {
      this.DANGEROUS_PATTERNS.forEach((pattern) => {
        sanitized = sanitized.replace(pattern, '');
      });
    }

    // 移除危险的事件属性
    if (stripEvents) {
      this.DANGEROUS_ATTRIBUTES.forEach((attr) => {
        const regex = new RegExp(`\\s*${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
        sanitized = sanitized.replace(regex, '');
      });
    }

    // 创建临时 DOM 元素进行清理
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitized;

    // 递归清理所有元素
    this.cleanElement(tempDiv, allowedTags, allowedAttributes);

    return tempDiv.innerHTML;
  }

  /**
   * 清理 DOM 元素
   */
  private static cleanElement(
    element: Element,
    allowedTags: string[],
    allowedAttributes: Record<string, string[]>
  ): void {
    const children = Array.from(element.children);

    children.forEach((child) => {
      const tagName = child.tagName.toLowerCase();

      // 检查标签是否被允许
      if (!allowedTags.includes(tagName)) {
        child.remove();
        return;
      }

      // 清理属性
      const attributes = Array.from(child.attributes);
      attributes.forEach((attr) => {
        const attrName = attr.name.toLowerCase();
        const allowedAttrs = allowedAttributes[tagName] || [];

        if (!allowedAttrs.includes(attrName)) {
          child.removeAttribute(attr.name);
        }
      });

      // 递归清理子元素
      this.cleanElement(child, allowedTags, allowedAttributes);
    });
  }

  /**
   * 清理用户输入
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
      .replace(/[<>]/g, '') // 移除尖括号
      .replace(/javascript:/gi, '') // 移除 javascript: 协议
      .replace(/on\w+\s*=/gi, '') // 移除事件处理器
      .trim();
  }

  /**
   * 清理 URL
   */
  static sanitizeURL(url: string): string {
    if (!url || typeof url !== 'string') return '';

    // 只允许 http, https, mailto 协议
    const allowedProtocols = ['http:', 'https:', 'mailto:'];

    try {
      const urlObj = new URL(url);
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return '';
      }
      return urlObj.toString();
    } catch {
      return '';
    }
  }
}

// ============================================================================
// 安全存储管理
// ============================================================================

/**
 * 安全存储管理器
 */
export class SecureStorage {
  // private static readonly ENCRYPTION_KEY = 'music-app-secure-key'; // 保留用于未来扩展
  private static readonly SENSITIVE_KEYS = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'session',
    'cookie'
  ];

  /**
   * 检查键名是否敏感
   */
  private static isSensitiveKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return this.SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive));
  }

  /**
   * 简单的字符串加密（仅用于演示，生产环境应使用更强的加密）
   */
  private static simpleEncrypt(text: string): string {
    return btoa(encodeURIComponent(text));
  }

  /**
   * 简单的字符串解密
   */
  private static simpleDecrypt(encrypted: string): string {
    try {
      return decodeURIComponent(atob(encrypted));
    } catch {
      return '';
    }
  }

  /**
   * 安全设置存储项
   */
  static setItem(key: string, value: string): void {
    if (this.isSensitiveKey(key)) {
      console.warn(`⚠️ 检测到敏感数据存储: ${key}，建议使用加密存储`);
      const encrypted = this.simpleEncrypt(value);
      localStorage.setItem(`encrypted_${key}`, encrypted);
    } else {
      localStorage.setItem(key, value);
    }
  }

  /**
   * 安全获取存储项
   */
  static getItem(key: string): string | null {
    if (this.isSensitiveKey(key)) {
      const encrypted = localStorage.getItem(`encrypted_${key}`);
      return encrypted ? this.simpleDecrypt(encrypted) : null;
    } else {
      return localStorage.getItem(key);
    }
  }

  /**
   * 安全移除存储项
   */
  static removeItem(key: string): void {
    localStorage.removeItem(key);
    localStorage.removeItem(`encrypted_${key}`);
  }

  /**
   * 清理所有敏感数据
   */
  static clearSensitiveData(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (this.isSensitiveKey(key) || key.startsWith('encrypted_'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log(`🧹 已清理 ${keysToRemove.length} 个敏感数据项`);
  }
}

// ============================================================================
// CSRF 防护
// ============================================================================

/**
 * CSRF 防护管理器
 */
export class CSRFProtection {
  private static token: string | null = null;

  /**
   * 生成 CSRF 令牌
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.token = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');

    // 设置到 meta 标签
    this.setMetaToken(this.token);

    return this.token;
  }

  /**
   * 获取当前令牌
   */
  static getToken(): string | null {
    return this.token || this.getMetaToken();
  }

  /**
   * 验证令牌
   */
  static validateToken(token: string): boolean {
    const currentToken = this.getToken();
    return currentToken !== null && currentToken === token;
  }

  /**
   * 设置 meta 标签中的令牌
   */
  private static setMetaToken(token: string): void {
    let metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'csrf-token';
      document.head.appendChild(metaTag);
    }
    metaTag.content = token;
  }

  /**
   * 从 meta 标签获取令牌
   */
  private static getMetaToken(): string | null {
    const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    return metaTag ? metaTag.content : null;
  }
}

// ============================================================================
// 统一安全工具集主类
// ============================================================================

/**
 * 统一安全工具集
 */
export class UnifiedSecurityToolkit {
  private config: SecurityConfig;
  private threats: Ref<SecurityThreat[]> = ref([]);
  private isInitialized = false;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableInputSanitization: true,
      enableSecureStorage: true,
      enableContentSecurityPolicy: true,
      autoMitigation: true,
      reportingEnabled: process.env.NODE_ENV === 'development',
      ...config
    };
  }

  /**
   * 初始化安全工具集
   */
  initialize(): void {
    if (this.isInitialized) return;

    console.log('🔒 统一安全工具集初始化中...', this.config);

    if (this.config.enableCSRFProtection) {
      CSRFProtection.generateToken();
    }

    if (this.config.enableXSSProtection) {
      this.setupXSSProtection();
    }

    this.isInitialized = true;
    console.log('✅ 统一安全工具集初始化完成');
  }

  /**
   * 设置 XSS 防护
   */
  private setupXSSProtection(): void {
    // 监听 DOM 变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkElementForXSS(node as Element);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 检查元素是否存在 XSS 风险
   */
  private checkElementForXSS(element: Element): void {
    const innerHTML = element.innerHTML;
    const outerHTML = element.outerHTML;

    // 检查危险模式
    const hasDangerousContent = InputSanitizer['DANGEROUS_PATTERNS'].some(
      (pattern) => pattern.test(innerHTML) || pattern.test(outerHTML)
    );

    if (hasDangerousContent) {
      this.reportThreat({
        id: `xss-${Date.now()}`,
        type: ThreatType.XSS,
        level: SecurityLevel.HIGH,
        title: 'XSS 攻击检测',
        description: '检测到潜在的 XSS 攻击代码',
        location: element.tagName,
        evidence: innerHTML.substring(0, 100),
        mitigation: '使用 InputSanitizer.sanitizeHTML() 清理内容',
        timestamp: Date.now(),
        resolved: false
      });

      if (this.config.autoMitigation) {
        this.mitigateXSS(element);
      }
    }
  }

  /**
   * 缓解 XSS 攻击
   */
  private mitigateXSS(element: Element): void {
    const sanitized = InputSanitizer.sanitizeHTML(element.innerHTML);
    element.innerHTML = sanitized;
    console.warn('🛡️ XSS 攻击已被自动缓解');
  }

  /**
   * 报告安全威胁
   */
  private reportThreat(threat: SecurityThreat): void {
    this.threats.value.push(threat);

    if (this.config.reportingEnabled) {
      console.warn('🚨 安全威胁检测:', threat);
    }
  }

  /**
   * 获取安全威胁列表
   */
  getThreats(): SecurityThreat[] {
    return this.threats.value;
  }

  /**
   * 清除已解决的威胁
   */
  clearResolvedThreats(): void {
    this.threats.value = this.threats.value.filter((threat) => !threat.resolved);
  }

  /**
   * 执行安全检查
   */
  runSecurityCheck(): SecurityCheckResult {
    const threats: SecurityThreat[] = [];
    let score = 100;

    // 检查存储安全
    threats.push(...this.checkStorageSecurity());

    // 检查传输安全
    threats.push(...this.checkTransportSecurity());

    score -= threats.length * 10;
    score = Math.max(0, score);

    const result: SecurityCheckResult = {
      passed: threats.length === 0,
      threats,
      score,
      recommendations: this.generateRecommendations(threats),
      timestamp: Date.now()
    };

    this.threats.value.push(...threats);
    return result;
  }

  /**
   * 检查存储安全
   */
  private checkStorageSecurity(): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && SecureStorage['isSensitiveKey'](key) && !key.startsWith('encrypted_')) {
        threats.push({
          id: `insecure-storage-${key}`,
          type: ThreatType.INSECURE_STORAGE,
          level: SecurityLevel.MEDIUM,
          title: '不安全的数据存储',
          description: `localStorage 中存储了未加密的敏感数据: ${key}`,
          location: 'localStorage',
          mitigation: '使用 SecureStorage.setItem() 进行加密存储',
          timestamp: Date.now(),
          resolved: false
        });
      }
    }

    return threats;
  }

  /**
   * 检查传输安全
   */
  private checkTransportSecurity(): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      threats.push({
        id: 'insecure-transport',
        type: ThreatType.DATA_LEAK,
        level: SecurityLevel.HIGH,
        title: '不安全的传输协议',
        description: '应用未使用 HTTPS 协议',
        mitigation: '配置 HTTPS 证书',
        timestamp: Date.now(),
        resolved: false
      });
    }

    return threats;
  }

  /**
   * 生成安全建议
   */
  private generateRecommendations(threats: SecurityThreat[]): string[] {
    const recommendations: string[] = [];
    const threatTypes = new Set(threats.map((t) => t.type));

    if (threatTypes.has(ThreatType.XSS)) {
      recommendations.push('使用 InputSanitizer 清理用户输入');
      recommendations.push('实施内容安全策略 (CSP)');
    }

    if (threatTypes.has(ThreatType.INSECURE_STORAGE)) {
      recommendations.push('使用 SecureStorage 进行敏感数据存储');
    }

    if (threatTypes.has(ThreatType.DATA_LEAK)) {
      recommendations.push('启用 HTTPS 并配置安全传输');
    }

    return recommendations;
  }
}

// ============================================================================
// 便捷导出
// ============================================================================

/**
 * 创建安全工具集实例
 */
export const createSecurityToolkit = (config?: Partial<SecurityConfig>) => {
  return new UnifiedSecurityToolkit(config);
};

/**
 * 默认安全工具集实例
 */
export const defaultSecurityToolkit = createSecurityToolkit();

// 自动初始化
if (typeof window !== 'undefined') {
  defaultSecurityToolkit.initialize();
}

/**
 * 便捷的安全工具函数
 */
export const security = {
  // 输入清理
  sanitize: {
    html: InputSanitizer.sanitizeHTML,
    input: InputSanitizer.sanitizeInput,
    url: InputSanitizer.sanitizeURL
  },

  // 安全存储
  storage: {
    set: SecureStorage.setItem,
    get: SecureStorage.getItem,
    remove: SecureStorage.removeItem,
    clearSensitive: SecureStorage.clearSensitiveData
  },

  // CSRF 防护
  csrf: {
    generate: CSRFProtection.generateToken,
    get: CSRFProtection.getToken,
    validate: CSRFProtection.validateToken
  },

  // 安全检查
  check: () => defaultSecurityToolkit.runSecurityCheck(),
  getThreats: () => defaultSecurityToolkit.getThreats(),
  clearThreats: () => defaultSecurityToolkit.clearResolvedThreats()
};
